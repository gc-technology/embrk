import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageSquare, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Prompt } from "@/entities/Prompt";

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "";

export default function FeedbackSidebar({
  open,
  onClose,
  currentPhase,
  prompts,
  editedPrompts,
  promptMode,
  promptCategory,
  onPromptsRefined,
  thread,
  onThreadUpdate,
  projectId,
  queryClient,
}) {
  const [input, setInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [thread, isRefining]);

  const relevantPrompts =
    currentPhase === 1
      ? prompts
      : prompts.filter((p) => p.status === "approved");

  const currentPromptTexts = relevantPrompts.map(
    (p) => editedPrompts[p.id] || p.prompt_text
  );

  const handleApply = async () => {
    const trimmed = input.trim();
    if (!trimmed || !currentPromptTexts.length) return;

    const userMsg = { role: "user", content: trimmed };
    const updatedThread = [...thread, userMsg];
    onThreadUpdate(updatedThread);
    setInput("");
    setIsRefining(true);

    const historyForApi = thread.map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch(`${WORKER_URL}/api/refine-prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: promptMode,
          category: promptCategory,
          currentPrompts: currentPromptTexts,
          feedback: trimmed,
          history: historyForApi,
        }),
      });

      const data = await res.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const refined = parsed.prompts || [];

      const preview = refined
        .map((p, i) => `${i + 1}. ${p.prompt_text.slice(0, 90)}${p.prompt_text.length > 90 ? "…" : ""}`)
        .join("\n");

      const assistantMsg = {
        role: "assistant",
        content: `Applied refinements:\n${preview}`,
        refined,
      };

      onThreadUpdate([...updatedThread, assistantMsg]);
      onPromptsRefined(refined, relevantPrompts);
    } catch (err) {
      console.error("Refinement failed:", err);
      onThreadUpdate([
        ...updatedThread,
        { role: "assistant", content: "Refinement failed — please try again." },
      ]);
    }

    setIsRefining(false);
  };

  const phaseLabel =
    currentPhase === 1
      ? "prompts"
      : currentPhase === 2
      ? "image prompts"
      : "phase";

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="sidebar"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 220 }}
          className="w-[360px] shrink-0 border-l border-border/50 bg-[#101010] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Feedback</span>
              <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                Phase {currentPhase}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Thread */}
          <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {thread.length === 0 && (
              <div className="text-center py-10">
                <Wand2 className="w-8 h-8 mx-auto mb-3 text-primary/25" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Refine your {phaseLabel} across any phase without starting over.
                </p>
                <p className="text-xs text-muted-foreground/50 mt-2">
                  e.g. "make these more cinematic" · "abstract the second one more"
                </p>
              </div>
            )}

            {thread.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary text-black font-medium"
                      : "bg-[#212121] text-foreground border border-border/30"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isRefining && (
              <div className="flex justify-start">
                <div className="bg-[#212121] border border-border/30 rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Refining {phaseLabel}…
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-border/50 space-y-2">
            {currentPromptTexts.length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center pb-1">
                {currentPhase === 1
                  ? "Generate prompts in Phase 1 first."
                  : "Approve prompts in Phase 1 first."}
              </p>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleApply();
                }
              }}
              placeholder={`e.g. "make these more cinematic…"`}
              className="bg-secondary/30 border-border/40 resize-none text-sm min-h-[70px]"
              rows={3}
              disabled={isRefining || currentPromptTexts.length === 0}
            />
            <button
              onClick={handleApply}
              disabled={!input.trim() || isRefining || currentPromptTexts.length === 0}
              className="w-full flex items-center justify-between gap-2 bg-primary text-black rounded-full px-5 py-2.5 text-sm font-bold hover:gap-3 transition-all duration-200 group disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Apply to Phase {currentPhase}</span>
              <span className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Send className="w-3.5 h-3.5 text-primary" />
              </span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
