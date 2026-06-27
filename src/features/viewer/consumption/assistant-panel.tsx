"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistantViaApi } from "@/lib/content/api-client";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

interface AssistantPanelProps {
  creation: Creation;
  className?: string;
}

export function AssistantPanel({ creation, className }: AssistantPanelProps) {
  const auth = useOptionalAuth();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setPrompt("");
    setLoading(true);
    try {
      const res = await askAssistantViaApi(
        creation.id,
        text,
        auth?.getAuthHeaders(),
      );
      setMessages((m) => [...m, { role: "assistant", text: res.text }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry, I could not answer that right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Summarize this chapter",
    "Explain the last passage",
    "Who are the main characters?",
  ];

  return (
    <aside
      className={cn(
        "hidden h-full flex-col border-l border-border/60 xl:flex",
        className,
      )}
      aria-label="AI Assistant"
    >
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">AI Assistant</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask about this content
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className="w-full justify-start rounded-xl text-left text-sm font-normal"
                  onClick={() => void send(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-8 bg-primary text-primary-foreground"
                    : "mr-8 bg-muted",
                )}
              >
                {msg.text}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        <form
          className="flex gap-2 border-t border-border/60 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send(prompt);
          }}
        >
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything…"
            className="rounded-xl"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-xl" disabled={loading}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
