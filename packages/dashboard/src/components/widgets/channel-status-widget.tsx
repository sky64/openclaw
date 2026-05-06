import { Radio } from "lucide-react";
import { useGatewayStore, type ChannelInfo } from "@/stores/use-gateway-store";
import type { WidgetComponentProps } from "@/components/workspace-layout";

const STATUS_DOT: Record<ChannelInfo["status"], string> = {
  connected: "bg-green-400",
  disconnected: "bg-destructive",
  connecting: "bg-yellow-400",
};

const STATUS_TEXT: Record<ChannelInfo["status"], string> = {
  connected: "text-green-400",
  disconnected: "text-destructive",
  connecting: "text-yellow-400",
};

const STATUS_LABELS: Record<ChannelInfo["status"], string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  connecting: "Connecting",
};

export function ChannelStatusWidget(_props: WidgetComponentProps) {
  const channels = useGatewayStore((s) => s.channels);

  if (channels.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Radio size={32} className="opacity-40" />
        <p className="text-sm">No channels connected</p>
        <p className="text-xs opacity-60">Connect to gateway to see channel status</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto">
      {channels.map((ch) => (
        <div key={ch.id} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${STATUS_DOT[ch.status]}`} />
            <span className="text-sm text-foreground">{ch.name || ch.type}</span>
          </div>
          <span className={`text-[10px] font-medium ${STATUS_TEXT[ch.status]}`}>
            {STATUS_LABELS[ch.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
