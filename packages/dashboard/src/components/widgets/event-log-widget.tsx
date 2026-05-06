import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import { useGatewayStore, type GatewayEvent } from "@/stores/use-gateway-store";
import type { WidgetComponentProps } from "@/components/workspace-layout";

type EventFilter = "all" | "messages" | "tools" | "system";

const FILTER_MATCH: Record<EventFilter, (evt: GatewayEvent) => boolean> = {
  all: () => true,
  messages: (e) =>
    e.event.includes("message") || e.event.includes("chat") || e.event.includes("agent.message"),
  tools: (e) =>
    e.event.includes("tool") || e.event.includes("activity") || e.event.includes("browser"),
  system: (e) =>
    e.event.includes("connect") ||
    e.event.includes("hello") ||
    e.event.includes("channels") ||
    e.event.includes("config") ||
    e.event.includes("gateway"),
};

const EVENT_BADGE: Record<string, string> = {
  message: "text-primary bg-primary/10",
  chat: "text-primary bg-primary/10",
  tool: "text-purple-400 bg-purple-400/10",
  activity: "text-purple-400 bg-purple-400/10",
  channel: "text-green-400 bg-green-400/10",
  connect: "text-blue-400 bg-blue-400/10",
  hello: "text-blue-400 bg-blue-400/10",
  error: "text-destructive bg-destructive/10",
};

function getEventBadge(event: string): string {
  for (const [key, cls] of Object.entries(EVENT_BADGE)) {
    if (event.includes(key)) return cls;
  }
  return "text-muted-foreground bg-secondary";
}

function summarizePayload(payload?: Record<string, unknown>): string {
  if (!payload) return "";
  const keys = Object.keys(payload);
  if (keys.length === 0) return "";
  if (payload.message) return String(payload.message).slice(0, 60);
  if (payload.content) return String(payload.content).slice(0, 60);
  if (payload.tool) return `tool: ${payload.tool}`;
  if (payload.method) return `method: ${payload.method}`;
  return keys.slice(0, 3).join(", ");
}

export function EventLogWidget(_props: WidgetComponentProps) {
  const events = useGatewayStore((s) => s.events);
  const [filter, setFilter] = useState<EventFilter>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const filtered = events.filter(FILTER_MATCH[filter]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    autoScrollRef.current = atBottom;
  }, []);

  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length]);

  if (events.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <ScrollText size={32} className="opacity-40" />
        <p className="text-sm">No events yet</p>
      </div>
    );
  }

  const filters: EventFilter[] = ["all", "messages", "tools", "system"];

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 gap-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-medium capitalize transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto font-mono text-xs">
        {filtered.map((evt) => (
          <div key={evt.id} className="flex gap-2 py-0.5 leading-5">
            <span className="text-muted-foreground/60">{formatTimestamp(evt.timestamp)}</span>
            <span className={`shrink-0 rounded px-1 font-medium ${getEventBadge(evt.event)}`}>
              {evt.event}
            </span>
            <span className="truncate text-muted-foreground">
              {summarizePayload(evt.payload)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
