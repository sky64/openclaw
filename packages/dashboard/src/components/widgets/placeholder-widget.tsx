import { Package } from "lucide-react";
import type { WidgetComponentProps } from "@/components/workspace-layout";

export function PlaceholderWidget(_props: WidgetComponentProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <Package size={32} className="opacity-30" />
      <p className="text-sm font-medium">Coming soon</p>
      <p className="text-xs opacity-60">This widget is not yet available</p>
    </div>
  );
}
