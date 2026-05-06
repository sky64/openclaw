import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getPreset, getDefaultPreset } from "@/lib/workspace-presets";

interface WorkspaceStore {
  activePresetId: string;
  activeWidgets: string[];
  mobileActiveWidget: string;
  setActivePresetId: (id: string) => void;
  setActiveWidgets: (widgets: string[]) => void;
  setMobileActiveWidget: (widgetId: string) => void;
}

const defaultPreset = getDefaultPreset();

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activePresetId: defaultPreset.id,
      activeWidgets: defaultPreset.widgets,
      mobileActiveWidget: "chat",

      setActivePresetId: (id: string) => {
        const preset = getPreset(id);
        if (preset) {
          set({
            activePresetId: id,
            activeWidgets: preset.widgets,
          });
        }
      },

      setActiveWidgets: (widgets: string[]) => set({ activeWidgets: widgets }),

      setMobileActiveWidget: (widgetId: string) =>
        set({ mobileActiveWidget: widgetId }),
    }),
    { name: "openclaw-workspace" },
  ),
);
