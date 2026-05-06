import { Component, Suspense, type ReactNode, type ErrorInfo } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { getWidget } from "@/lib/widget-registry";

interface WidgetCardProps {
  widgetId: string;
  children: ReactNode;
  compact?: boolean;
}

function WidgetSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  widgetId: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Widget "${this.props.widgetId}" crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-destructive">
          <Icons.AlertTriangle size={24} />
          <p className="text-sm font-medium">Widget Error</p>
          <p className="text-xs text-muted-foreground">
            {this.state.error?.message ?? "Unknown error"}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WidgetCard({ widgetId, children, compact }: WidgetCardProps) {
  const def = getWidget(widgetId);
  const iconName = def?.icon ?? "Box";
  const IconComponent = (Icons as Record<string, Icons.LucideIcon>)[iconName] ?? Icons.Box;

  return (
    <div className="card-container flex h-full flex-col overflow-hidden">
      {!compact && def && (
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
          <IconComponent size={14} className="text-muted-foreground" />
          <span className="section-header">{def.name}</span>
        </div>
      )}
      <div className={cn("flex-1 overflow-hidden", compact ? "p-2" : "p-3")}>
        <WidgetErrorBoundary widgetId={widgetId}>
          <Suspense fallback={<WidgetSkeleton />}>{children}</Suspense>
        </WidgetErrorBoundary>
      </div>
    </div>
  );
}
