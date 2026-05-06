import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    tools?: string[];
    cost?: number;
  };
}

interface ChatStore {
  sessionId: string;
  messages: Message[];
  isConnected: boolean;
  isAgentTyping: boolean;
  addMessage: (msg: Message) => void;
  setConnected: (connected: boolean) => void;
  setAgentTyping: (typing: boolean) => void;
  clearMessages: () => void;
  setSessionId: (id: string) => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  sessionId: "main",
  messages: [],
  isConnected: false,
  isAgentTyping: false,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setConnected: (connected) => set({ isConnected: connected }),

  setAgentTyping: (typing) => set({ isAgentTyping: typing }),

  clearMessages: () => set({ messages: [] }),

  setSessionId: (id) => set({ sessionId: id }),
}));
