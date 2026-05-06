import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, generateId } from "@/lib/utils";
import { useChatStore, type Message } from "@/stores/use-chat-store";
import type { WidgetComponentProps } from "@/components/workspace-layout";

export function ChatWidget({ gatewayClient }: WidgetComponentProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isAgentTyping, addMessage } = useChatStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const msg: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    addMessage(msg);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await gatewayClient?.request("agent.chat", { message: trimmed });
    } catch {
      addMessage({
        id: generateId(),
        role: "system",
        content: "Failed to send message. Is the gateway connected?",
        timestamp: Date.now(),
      });
    }
  }, [input, addMessage, gatewayClient]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  if (messages.length === 0 && !isAgentTyping) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Bot size={40} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Send a message to start chatting
          </p>
        </div>
        <InputBar
          input={input}
          textareaRef={textareaRef}
          handleInput={handleInput}
          handleKeyDown={handleKeyDown}
          sendMessage={sendMessage}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isAgentTyping && (
          <div className="flex items-start gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2">
              <span
                className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <InputBar
        input={input}
        textareaRef={textareaRef}
        handleInput={handleInput}
        handleKeyDown={handleKeyDown}
        sendMessage={sendMessage}
      />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary"
            : isSystem
              ? "bg-destructive/20"
              : "bg-secondary",
        )}
      >
        {isUser ? (
          <User size={14} className="text-primary-foreground" />
        ) : (
          <Bot
            size={14}
            className={isSystem ? "text-destructive" : "text-primary"}
          />
        )}
      </div>

      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground"
              : isSystem
                ? "bg-destructive/10 text-foreground"
                : "bg-secondary text-foreground",
          )}
        >
          {message.content}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {message.metadata?.model && (
            <span className="text-[10px] text-muted-foreground">
              {message.metadata.model}
            </span>
          )}
          {message.metadata?.tokens && (
            <span className="text-[10px] text-muted-foreground">
              {message.metadata.tokens} tok
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function InputBar({
  input,
  textareaRef,
  handleInput,
  handleKeyDown,
  sendMessage,
}: {
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  sendMessage: () => void;
}) {
  return (
    <div className="mt-2 flex items-end gap-2 rounded-lg border border-border bg-secondary p-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Send a message..."
        rows={1}
        className="max-h-[120px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        onClick={sendMessage}
        disabled={!input.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary transition-colors disabled:opacity-40"
      >
        <Send size={14} className="text-primary-foreground" />
      </button>
    </div>
  );
}
