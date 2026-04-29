import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Check, X } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

function ModeForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Name</label>
        <input
          className="w-full bg-secondary/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          value={name}
          onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
          placeholder="e.g. Technical"
        />
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Slug</label>
        <input
          className="w-full bg-secondary/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. technical"
        />
      </div>
      <button onClick={() => onSave({ name, slug })} className="bg-primary text-black rounded-full px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors">
        Add
      </button>
      <button onClick={onCancel} className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">Cancel</button>
    </div>
  );
}

function CategoryForm({ modeId, onSave, onCancel }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  return (
    <div className="flex gap-2 items-end mt-2">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Name</label>
        <input
          className="w-full bg-secondary/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          value={name}
          onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
          placeholder="e.g. Logo"
        />
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Slug</label>
        <input
          className="w-full bg-secondary/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. logo"
        />
      </div>
      <button onClick={() => onSave({ name, slug, mode_id: modeId })} className="bg-primary text-black rounded-full px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors">
        Add
      </button>
      <button onClick={onCancel} className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">Cancel</button>
    </div>
  );
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const [selectedMode, setSelectedMode] = useState(null);
  const [addingMode, setAddingMode] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const { data: modes = [], isLoading } = useQuery({
    queryKey: ["admin-modes"],
    queryFn: () => adminApi.getModes(),
    onSuccess: (data) => { if (!selectedMode && data.length) setSelectedMode(data[0].id); },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories", selectedMode],
    queryFn: () => adminApi.getCategories(selectedMode),
    enabled: !!selectedMode,
  });

  const createMode = useMutation({
    mutationFn: (d) => adminApi.createMode(d),
    onSuccess: () => { qc.invalidateQueries(["admin-modes"]); setAddingMode(false); },
  });

  const deleteMode = useMutation({
    mutationFn: (id) => adminApi.deleteMode(id),
    onSuccess: () => { qc.invalidateQueries(["admin-modes"]); setSelectedMode(null); },
  });

  const createCategory = useMutation({
    mutationFn: (d) => adminApi.createCategory(d),
    onSuccess: () => { qc.invalidateQueries(["admin-categories", selectedMode]); setAddingCategory(false); },
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => adminApi.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries(["admin-categories", selectedMode]),
  });

  if (isLoading) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-1">Modes & Categories</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage the modes and categories users can choose from.</p>

      <div className="flex gap-6">
        {/* Modes panel */}
        <div className="w-56 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Modes</span>
            <button onClick={() => setAddingMode(true)} className="text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {modes.map((m) => (
              <div
                key={m.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedMode === m.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
                onClick={() => setSelectedMode(m.id)}
              >
                <span className="text-sm font-medium">{m.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMode.mutate(m.id); }}
                  className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {addingMode && (
            <div className="mt-3">
              <ModeForm
                onSave={(d) => createMode.mutate(d)}
                onCancel={() => setAddingMode(false)}
              />
            </div>
          )}
        </div>

        {/* Categories panel */}
        <div className="flex-1">
          {selectedMode ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Categories — {modes.find((m) => m.id === selectedMode)?.name}
                </span>
                <button onClick={() => setAddingCategory(true)} className="text-primary hover:text-primary/80 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-[#101010] border border-border/50 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.slug}</p>
                    </div>
                    <button
                      onClick={() => deleteCategory.mutate(c.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {addingCategory && (
                <CategoryForm
                  modeId={selectedMode}
                  onSave={(d) => createCategory.mutate(d)}
                  onCancel={() => setAddingCategory(false)}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a mode to view its categories.</p>
          )}
        </div>
      </div>
    </div>
  );
}
