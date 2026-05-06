import { useState, useEffect } from "react";
import type { WidgetComponentProps } from "@/components/workspace-layout";

export function ClockWidget(_props: WidgetComponentProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {time}
      </span>
      <span className="text-xs text-muted-foreground">{date}</span>
      <span className="mt-0.5 text-[10px] text-muted-foreground/60">{timezone}</span>
    </div>
  );
}
