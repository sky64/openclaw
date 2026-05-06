import { useState, useEffect, useRef, useCallback } from "react";
import type { WidgetComponentProps } from "@/components/workspace-layout";

const STORAGE_KEY = "openclaw-dashboard-notes";
const SAVE_DEBOUNCE = 500;

export function NotesWidget(_props: WidgetComponentProps) {
  const [content, setContent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const save = useCallback((text: string) => {
    setSaveStatus("saving");
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {
      // storage full — silently ignore
    }
    setSaveStatus("saved");
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setContent(val);
      setSaveStatus("saving");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(val), SAVE_DEBOUNCE);
    },
    [save],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex h-full flex-col gap-1">
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Quick notes..."
        className="flex-1 resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
      />
      {saveStatus !== "idle" && (
        <span className="text-[10px] text-muted-foreground/50">
          {saveStatus === "saving" ? "Saving..." : "Saved"}
        </span>
      )}
    </div>
  );
}
