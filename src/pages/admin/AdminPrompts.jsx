import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

function FragmentEditor({ fragment }) {
  const qc = useQueryClient();
  const [text, setText] = useState(fragment.system_prompt ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => { setText(fragment.system_prompt ?? ""); }, [fragment.system_prompt]);

  const update = useMutation({
    mutationFn: () => adminApi.updateFragment(fragment.id, { system_prompt: text }),
    onSuccess: () => {
      qc.invalidateQueries(["admin-fragments"]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const isDirty = text !== (fragment.system_prompt ?? "");

  return (
    <div className="bg-[#101010] border border-border/50 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{fragment.category_name}</p>
          <p className="text-xs text-muted-foreground">{fragment.mode_name} · {fragment.category_slug}</p>
        </div>
        <button
          onClick={() => update.mutate()}
          disabled={!isDirty || update.isPending}
          className="flex items-center gap-1.5 bg-primary text-black rounded-full px-4 py-1.5 text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {update.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-y font-mono"
        placeholder="Enter system prompt for this category…"
      />
    </div>
  );
}

export default function AdminPrompts() {
  const { data: fragments = [], isLoading } = useQuery({
    queryKey: ["admin-fragments"],
    queryFn: () => adminApi.getFragments(),
  });

  if (isLoading) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Prompt Fragments</h1>
      <p className="text-sm text-muted-foreground mb-8">
        System prompts used when generating images for each category.
      </p>

      {fragments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fragments yet. Add categories first.</p>
      ) : (
        <div className="space-y-4">
          {fragments.map((f) => <FragmentEditor key={f.id} fragment={f} />)}
        </div>
      )}
    </div>
  );
}
