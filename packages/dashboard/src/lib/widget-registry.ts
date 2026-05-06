export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "core" | "operational" | "utility";
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  component: string;
}

const registry = new Map<string, WidgetDefinition>();

function register(def: WidgetDefinition) {
  registry.set(def.id, def);
}

register({
  id: "chat",
  name: "Chat",
  description: "Live agent conversation",
  icon: "MessageSquare",
  category: "core",
  defaultSize: { w: 8, h: 12 },
  minSize: { w: 4, h: 6 },
  component: "ChatWidget",
});

register({
  id: "agent-activity",
  name: "Agent Activity",
  description: "Real-time tool calls, model, tokens",
  icon: "Activity",
  category: "core",
  defaultSize: { w: 4, h: 6 },
  minSize: { w: 3, h: 4 },
  component: "ActivityWidget",
});

register({
  id: "channel-status",
  name: "Channel Status",
  description: "Connected channels health",
  icon: "Radio",
  category: "operational",
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  component: "ChannelStatusWidget",
});

register({
  id: "event-log",
  name: "Event Log",
  description: "Live gateway event stream",
  icon: "ScrollText",
  category: "operational",
  defaultSize: { w: 4, h: 6 },
  minSize: { w: 3, h: 4 },
  component: "EventLogWidget",
});

register({
  id: "clock",
  name: "Clock",
  description: "Time and timezone",
  icon: "Clock",
  category: "utility",
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  component: "ClockWidget",
});

register({
  id: "notes",
  name: "Notes",
  description: "Quick scratchpad",
  icon: "StickyNote",
  category: "utility",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 3 },
  component: "NotesWidget",
});

register({
  id: "config-viewer",
  name: "Config Viewer",
  description: "Running gateway configuration",
  icon: "Settings",
  category: "operational",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  component: "ConfigViewerWidget",
});

export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

export function getAllWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}

export function getWidgetsByCategory(
  category: WidgetDefinition["category"],
): WidgetDefinition[] {
  return getAllWidgets().filter((w) => w.category === category);
}
