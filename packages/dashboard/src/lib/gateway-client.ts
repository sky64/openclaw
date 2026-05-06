import { generateId } from "./utils";

interface Frame {
  type: "req" | "res" | "event";
  id?: string;
  method?: string;
  params?: unknown;
  ok?: boolean;
  payload?: unknown;
  error?: { code: number; message: string };
  event?: string;
  seq?: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface GatewayClientOptions {
  url: string;
  token?: string;
  onEvent?: (event: string, payload: unknown, seq?: number) => void;
  onHello?: (payload: Record<string, unknown>) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  constructor(private opts: GatewayClientOptions) {}

  start() {
    this.shouldReconnect = true;
    this.connect();
  }

  stop() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async request<T = unknown>(
    method: string,
    params?: unknown,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const id = generateId();
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 15000);

      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      const frame: Frame = { type: "req", id, method, params };
      this.ws.send(JSON.stringify(frame));
    });
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.opts.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.opts.onOpen?.();
    };

    this.ws.onmessage = (ev) => {
      let frame: Frame;
      try {
        frame = JSON.parse(ev.data as string) as Frame;
      } catch {
        return;
      }
      this.handleFrame(frame);
    };

    this.ws.onclose = () => {
      this.opts.onClose?.();
      this.rejectAllPending();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  private handleFrame(frame: Frame) {
    switch (frame.type) {
      case "res": {
        if (!frame.id) return;
        const pending = this.pending.get(frame.id);
        if (!pending) return;
        this.pending.delete(frame.id);
        clearTimeout(pending.timer);
        if (frame.ok) {
          pending.resolve(frame.payload);
        } else {
          pending.reject(
            new Error(frame.error?.message ?? "Unknown error"),
          );
        }
        break;
      }

      case "event": {
        const eventName = frame.event ?? "";

        if (eventName === "connect.challenge") {
          this.handleChallenge(frame.payload as Record<string, unknown>);
          return;
        }

        if (eventName === "hello-ok") {
          this.opts.onHello?.(
            (frame.payload as Record<string, unknown>) ?? {},
          );
          return;
        }

        this.opts.onEvent?.(eventName, frame.payload, frame.seq);
        break;
      }
    }
  }

  private handleChallenge(_payload: Record<string, unknown>) {
    const connectParams: Record<string, unknown> = {
      client: "dashboard",
      version: "0.1.0",
    };

    if (this.opts.token) {
      connectParams.token = this.opts.token;
    }

    const frame: Frame = {
      type: "req",
      id: generateId(),
      method: "connect",
      params: connectParams,
    };

    this.ws?.send(JSON.stringify(frame));
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect) return;
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private rejectAllPending() {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Connection closed"));
      this.pending.delete(id);
    }
  }
}

export function getGatewayUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const fromParam = params.get("gateway");
  if (fromParam) return fromParam;

  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `ws://localhost:18789`;
  }

  return `${proto}//${window.location.host}`;
}
