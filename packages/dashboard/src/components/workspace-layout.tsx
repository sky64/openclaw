import { useState, useEffect, useRef, useCallback, lazy } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { AnimatePresence, motion } from "framer-motion";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/use-workspace-store";
import { getPreset } from "@/lib/workspace-presets";
import { getWidget } from "@/lib/widget-registry";
import { WidgetCard } from "./widget-card";
import type { GatewayClient } from "@/lib/gateway-client";

const ChatWidget = lazy(() =>
  import("./widgets/chat-widget").then((m) => ({ default: m.ChatWidget })),
);
const ActivityWidget = lazy(() =>
  import("./widgets/activity-widget").then((m) => ({
    default: m.ActivityWidget,
  })),
);
const ChannelStatusWidget = lazy(() =>
  import("./widgets/channel-status-widget").then((m) => ({
    default: m.ChannelStatusWidget,
  })),
);
const EventLogWidget = lazy(() =>
  import("./widgets/event-log-widget").then((m) => ({
    default: m.EventLogWidget,
  })),
);
const ClockWidget = lazy(() =>
  import("./widgets/clock-widget").then((m) => ({ default: m.ClockWidget })),
);
const NotesWidget = lazy(() =>
  import("./widgets/notes-widget").then((m) => ({ default: m.NotesWidget })),
);
const ConfigViewerWidget = lazy(() =>
  import("./widgets/config-viewer-widget").then((m) => ({
    default: m.ConfigViewerWidget,
  })),
);
const PlaceholderWidget = lazy(() =>
  import("./widgets/placeholder-widget").then((m) => ({
    default: m.PlaceholderWidget,
  })),
);

const ResponsiveGrid = WidthProvider(Responsive);

const WIDGET_COMPONENTS: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<WidgetComponentProps>>
> = {
  chat: ChatWidget,
  "agent-activity": ActivityWidget,
  "channel-status": ChannelStatusWidget,
  "event-log": EventLogWidget,
  clock: ClockWidget,
  notes: NotesWidget,
  "config-viewer": ConfigViewerWidget,
};

export interface WidgetComponentProps {
  gatewayClient: GatewayClient | null;
}

interface WorkspaceLayoutProps {
  gatewayClient: GatewayClient | null;
}

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 };
const COLS = { lg: 12, md: 10, sm: 1 };
const ROW_HEIGHT = 50;
const MOBILE_BREAKPOINT = 768;

export function WorkspaceLayout({ gatewayClient }: WorkspaceLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return <MobileWorkspace gatewayClient={gatewayClient} />;
  }

  return (
    <div ref={containerRef} className="h-full overflow-auto p-2">
      <DesktopGrid gatewayClient={gatewayClient} />
    </div>
  );
}

function DesktopGrid({ gatewayClient }: WorkspaceLayoutProps) {
  const { activePresetId, activeWidgets } = useWorkspaceStore();
  const preset = getPreset(activePresetId);

  if (!preset) return null;

  const layouts = {
    lg: preset.layouts.lg.filter((l) => activeWidgets.includes(l.i)),
    md: preset.layouts.md.filter((l) => activeWidgets.includes(l.i)),
  };

  return (
    <ResponsiveGrid
      layouts={layouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      isDraggable={false}
      isResizable={false}
      compactType="vertical"
      margin={[8, 8]}
    >
      {activeWidgets.map((widgetId) => {
        const def = getWidget(widgetId);
        const isCompact = def?.id === "clock";

        return (
          <div key={widgetId}>
            <WidgetCard widgetId={widgetId} compact={isCompact}>
              <WidgetRenderer
                widgetId={widgetId}
                gatewayClient={gatewayClient}
              />
            </WidgetCard>
          </div>
        );
      })}
    </ResponsiveGrid>
  );
}

function WidgetRenderer({
  widgetId,
  gatewayClient,
}: {
  widgetId: string;
  gatewayClient: GatewayClient | null;
}) {
  const Component = WIDGET_COMPONENTS[widgetId] ?? PlaceholderWidget;
  return <Component gatewayClient={gatewayClient} />;
}

function MobileWorkspace({ gatewayClient }: WorkspaceLayoutProps) {
  const { activeWidgets, mobileActiveWidget, setMobileActiveWidget } =
    useWorkspaceStore();

  const activeIndex = activeWidgets.indexOf(mobileActiveWidget);
  const [direction, setDirection] = useState(0);

  const handleTabChange = useCallback(
    (widgetId: string) => {
      const newIdx = activeWidgets.indexOf(widgetId);
      const oldIdx = activeWidgets.indexOf(mobileActiveWidget);
      setDirection(newIdx > oldIdx ? 1 : -1);
      setMobileActiveWidget(widgetId);
    },
    [activeWidgets, mobileActiveWidget, setMobileActiveWidget],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={mobileActiveWidget}
            custom={direction}
            initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? "-100%" : "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 p-2"
          >
            <WidgetCard widgetId={mobileActiveWidget}>
              <WidgetRenderer
                widgetId={mobileActiveWidget}
                gatewayClient={gatewayClient}
              />
            </WidgetCard>
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="flex h-14 shrink-0 items-center justify-around border-t border-border bg-card">
        {activeWidgets.map((widgetId) => {
          const def = getWidget(widgetId);
          const iconName = def?.icon ?? "Box";
          const IconComponent =
            (Icons as Record<string, Icons.LucideIcon>)[iconName] ?? Icons.Box;
          const isActive = widgetId === mobileActiveWidget;

          return (
            <button
              key={widgetId}
              onClick={() => handleTabChange(widgetId)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 transition-colors"
            >
              <IconComponent
                size={18}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={cn(
                  "text-[10px]",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {def?.name ?? widgetId}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
