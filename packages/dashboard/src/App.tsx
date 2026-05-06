import { useEffect, useRef, useCallback } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { GatewayClient, getGatewayUrl } from "@/lib/gateway-client";
import { useWorkspaceStore } from "@/stores/use-workspace-store";
import { useChatStore } from "@/stores/use-chat-store";
import { useGatewayStore } from "@/stores/use-gateway-store";
import { presets } from "@/lib/workspace-presets";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { generateId } from "@/lib/utils";

export function App() {
  const clientRef = useRef<GatewayClient | null>(null);
  const { activePresetId, setActivePresetId } = useWorkspaceStore();
  const gwConnected = useGatewayStore((s) => s.isConnected);

  const handleEvent = useCallback(
    (event: string, payload: unknown, seq?: number) => {
      const store = useGatewayStore.getState();
      store.addEvent({
        id: generateId(),
        event,
        payload: (payload as Record<string, unknown>) ?? undefined,
        timestamp: Date.now(),
        seq,
      });

      if (event === "agent.message" || event === "message.received") {
        const p = payload as Record<string, unknown>;
        useChatStore.getState().addMessage({
          id: generateId(),
          role: (p.role as "user" | "assistant") ?? "assistant",
          content: (p.content as string) ?? (p.text as string) ?? "",
          timestamp: Date.now(),
          metadata: {
            model: p.model as string | undefined,
            tokens: p.tokens as number | undefined,
            tools: p.tools as string[] | undefined,
            cost: p.cost as number | undefined,
          },
        });
      }

      if (event === "agent.typing") {
        const p = payload as Record<string, unknown>;
        useChatStore.getState().setAgentTyping(!!p.typing);
      }

      if (event === "agent.activity") {
        const p = payload as Record<string, unknown>;
        store.addActivity({
          id: generateId(),
          model: (p.model as string) ?? "unknown",
          tokens: (p.tokens as number) ?? 0,
          cost: p.cost as number | undefined,
          tools: (p.tools as string[]) ?? [],
          timestamp: Date.now(),
        });
      }

      if (event === "channels.status") {
        const p = payload as { channels?: unknown[] };
        if (Array.isArray(p.channels)) {
          store.setChannels(
            p.channels.map((ch: unknown) => {
              const c = ch as Record<string, unknown>;
              return {
                id: (c.id as string) ?? "",
                name: (c.name as string) ?? (c.type as string) ?? "",
                type: (c.type as string) ?? "",
                status: (c.status as "connected" | "disconnected" | "connecting") ?? "disconnected",
              };
            }),
          );
        }
      }
    },
    [],
  );

  const handleHello = useCallback(
    (payload: Record<string, unknown>) => {
      if (payload.version) {
        useGatewayStore.getState().setGatewayVersion(payload.version as string);
      }
      if (payload.channels && Array.isArray(payload.channels)) {
        useGatewayStore.getState().setChannels(
          (payload.channels as Record<string, unknown>[]).map((ch) => ({
            id: (ch.id as string) ?? "",
            name: (ch.name as string) ?? (ch.type as string) ?? "",
            type: (ch.type as string) ?? "",
            status: (ch.status as "connected" | "disconnected" | "connecting") ?? "disconnected",
          })),
        );
      }
    },
    [],
  );

  useEffect(() => {
    const url = getGatewayUrl();
    const client = new GatewayClient({
      url,
      onEvent: handleEvent,
      onHello: handleHello,
      onOpen: () => {
        useGatewayStore.getState().setConnected(true);
        useChatStore.getState().setConnected(true);
      },
      onClose: () => {
        useGatewayStore.getState().setConnected(false);
        useChatStore.getState().setConnected(false);
      },
    });

    clientRef.current = client;
    client.start();

    return () => {
      client.stop();
    };
  }, [handleEvent, handleHello]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <span className="text-gradient-primary text-lg font-bold">🦞 OpenClaw</span>
          <span className="text-xs font-medium text-muted-foreground">
            Dashboard
          </span>
        </div>

        <div className="flex items-center gap-1">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePresetId(p.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activePresetId === p.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {gwConnected ? (
            <Wifi size={14} className="text-green-500" />
          ) : (
            <WifiOff size={14} className="text-destructive" />
          )}
          <span className="text-xs text-muted-foreground">
            {gwConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <WorkspaceLayout gatewayClient={clientRef.current} />
      </main>
    </div>
  );
}
