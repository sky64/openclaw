import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ChevronRight, ChevronDown, Settings } from "lucide-react";
import { useGatewayStore } from "@/stores/use-gateway-store";
import type { WidgetComponentProps } from "@/components/workspace-layout";

export function ConfigViewerWidget({ gatewayClient }: WidgetComponentProps) {
  const config = useGatewayStore((s) => s.config);
  const setConfig = useGatewayStore((s) => s.setConfig);
  const [loading, setLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!gatewayClient) return;
    setLoading(true);
    try {
      const result = await gatewayClient.request<Record<string, unknown>>("config.get");
      if (result) setConfig(result);
    } catch {
      // gateway may not support this method yet
    }
    setLoading(false);
  }, [gatewayClient, setConfig]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  if (!config) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Settings size={32} className="opacity-40" />
        <p className="text-sm">No config loaded</p>
        <button
          onClick={fetchConfig}
          className="rounded-md bg-secondary px-3 py-1 text-xs text-foreground hover:bg-secondary/80 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 items-center justify-end">
        <button
          onClick={fetchConfig}
          disabled={loading}
          className="flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground transition-opacity hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {Object.entries(config).map(([key, value]) => (
          <ConfigSection key={key} label={key} value={value} />
        ))}
      </div>
    </div>
  );
}

function ConfigSection({ label, value }: { label: string; value: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const isObject = value !== null && typeof value === "object";

  if (!isObject) {
    return (
      <div className="flex gap-2 py-0.5">
        <span className="text-blue-300">{label}</span>
        <span className="text-muted-foreground">:</span>
        <JsonValue value={value} />
      </div>
    );
  }

  return (
    <div className="py-0.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-blue-300 hover:text-blue-200 transition-colors"
      >
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {label}
      </button>
      {expanded && (
        <div className="ml-3 border-l border-border pl-2">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <ConfigSection key={k} label={k} value={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function JsonValue({ value }: { value: unknown }) {
  if (typeof value === "string") {
    return <span className="text-green-300">"{value}"</span>;
  }
  if (typeof value === "number") {
    return <span className="text-yellow-300">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-purple-300">{String(value)}</span>;
  }
  if (value === null) {
    return <span className="text-muted-foreground">null</span>;
  }
  return <span className="text-muted-foreground">{String(value)}</span>;
}
