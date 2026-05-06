import { create } from "zustand";

export interface GatewayEvent {
  id: string;
  event: string;
  payload?: Record<string, unknown>;
  timestamp: number;
  seq?: number;
}

export interface ChannelInfo {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "connecting";
  metadata?: Record<string, unknown>;
}

export interface ActivityEntry {
  id: string;
  model: string;
  tokens: number;
  cost?: number;
  tools: string[];
  timestamp: number;
}

interface GatewayStore {
  events: GatewayEvent[];
  channels: ChannelInfo[];
  activities: ActivityEntry[];
  isConnected: boolean;
  gatewayVersion: string | null;
  config: Record<string, unknown> | null;
  addEvent: (evt: GatewayEvent) => void;
  setChannels: (channels: ChannelInfo[]) => void;
  addActivity: (entry: ActivityEntry) => void;
  setConnected: (connected: boolean) => void;
  setGatewayVersion: (version: string) => void;
  setConfig: (config: Record<string, unknown>) => void;
}

const MAX_EVENTS = 200;

export const useGatewayStore = create<GatewayStore>()((set) => ({
  events: [],
  channels: [],
  activities: [],
  isConnected: false,
  gatewayVersion: null,
  config: null,

  addEvent: (evt) =>
    set((state) => ({
      events: [...state.events, evt].slice(-MAX_EVENTS),
    })),

  setChannels: (channels) => set({ channels }),

  addActivity: (entry) =>
    set((state) => ({
      activities: [entry, ...state.activities].slice(0, 50),
    })),

  setConnected: (connected) => set({ isConnected: connected }),

  setGatewayVersion: (version) => set({ gatewayVersion: version }),

  setConfig: (config) => set({ config }),
}));
