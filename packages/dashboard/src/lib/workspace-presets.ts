import type { Layout } from "react-grid-layout";

export interface WorkspacePreset {
  id: string;
  name: string;
  description: string;
  widgets: string[];
  layouts: {
    lg: Layout[];
    md: Layout[];
  };
}

function item(
  i: string,
  x: number,
  y: number,
  w: number,
  h: number,
): Layout {
  return { i, x, y, w, h, static: true };
}

export const presets: WorkspacePreset[] = [
  {
    id: "developer",
    name: "Developer",
    description: "Chat-focused with activity and notes",
    widgets: ["chat", "agent-activity", "notes", "clock"],
    layouts: {
      lg: [
        item("chat", 0, 0, 8, 12),
        item("agent-activity", 8, 0, 4, 6),
        item("notes", 8, 6, 4, 4),
        item("clock", 8, 10, 4, 2),
      ],
      md: [
        item("chat", 0, 0, 6, 10),
        item("agent-activity", 6, 0, 4, 5),
        item("notes", 6, 5, 4, 3),
        item("clock", 6, 8, 4, 2),
      ],
    },
  },
  {
    id: "operator",
    name: "Operator",
    description: "Full operational overview with channels and events",
    widgets: ["channel-status", "chat", "event-log", "clock", "notes"],
    layouts: {
      lg: [
        item("channel-status", 0, 0, 3, 5),
        item("chat", 3, 0, 5, 12),
        item("event-log", 8, 0, 4, 8),
        item("clock", 8, 8, 4, 2),
        item("notes", 0, 5, 3, 7),
      ],
      md: [
        item("channel-status", 0, 0, 3, 4),
        item("chat", 3, 0, 4, 10),
        item("event-log", 7, 0, 3, 6),
        item("clock", 7, 6, 3, 2),
        item("notes", 0, 4, 3, 6),
      ],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Just chat and activity",
    widgets: ["chat", "agent-activity"],
    layouts: {
      lg: [
        item("chat", 0, 0, 8, 12),
        item("agent-activity", 8, 0, 4, 12),
      ],
      md: [
        item("chat", 0, 0, 6, 10),
        item("agent-activity", 6, 0, 4, 10),
      ],
    },
  },
];

export function getPreset(id: string): WorkspacePreset | undefined {
  return presets.find((p) => p.id === id);
}

export function getDefaultPreset(): WorkspacePreset {
  return presets[0];
}
