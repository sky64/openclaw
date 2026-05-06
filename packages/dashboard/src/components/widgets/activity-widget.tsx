import { Loader2, Cpu } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { useGatewayStore, type ActivityEntry } from "@/stores/use-gateway-store";
import { useChatStore } from "@/stores/use-chat-store";
import type { WidgetComponentProps } from "@/components/workspace-layout";

export function ActivityWidget(_props: WidgetComponentProps) {
  const activities = useGatewayStore((s) => s.activities);
  const isAgentTyping = useChatStore((s) => s.isAgentTyping);

  if (activities.length === 0 && !isAgentTyping) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <Cpu size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      {isAgentTyping && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
          <Loader2
            size={14}
            className="animate-spin text-primary"
          />
          <span className="text-xs font-medium text-primary">
            AI is thinking...
          </span>
        </div>
      )}

      <div className="relative space-y-0">
        {activities.map((entry) => (
          <ActivityItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  return (
    <div className="relative flex gap-3 py-2">
      <div className="flex flex-col items-center">
        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
        <div className="w-px flex-1 bg-border" />
      </div>

      <div className="flex-1 space-y-1 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            {entry.model}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {relativeTime(entry.timestamp)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {entry.tokens > 0 && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {entry.tokens} tokens
            </span>
          )}
          {entry.cost !== undefined && entry.cost > 0 && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ${entry.cost.toFixed(4)}
            </span>
          )}
        </div>

        {entry.tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tools.map((tool, i) => (
              <span
                key={`${tool}-${i}`}
                className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
