import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Check, X } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

function FlavorRow({ flavor }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(flavor.name);
  const [slug, setSlug] = useState(flavor.slug);
  const [description, setDescription] = useState(flavor.description ?? "");

  const update = useMutation({
    mutationFn: () => adminApi.updateFlavor(flavor.id, { name, slug, description }),
    onSuccess: () => { qc.invalidateQueries(["admin-flavors"]); setEditing(false); },
  });

  const remove = useMutation({
    mutationFn: () => adminApi.deleteFlavor(flavor.id),
    onSuccess: () => qc.invalidateQueries(["admin-flavors"]),
  });

  if (editing) {
    return (
      <tr className="border-t border-border/30">
        <td className="py-2 pr-3">
          <input className="w-full bg-secondary/40 border border-border/50 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50" value={name} onChange={(e) => setName(e.target.value)} />
        </td>
        <td className="py-2 pr-3">
          <input className="w-full bg-secondary/40 border border-border/50 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </td>
        <td className="py-2 pr-3">
          <input className="w-full bg-secondary/40 border border-border/50 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50" value={description} onChange={(e) => setDescription(e.target.value)} />
        </td>
        <td className="py-2 flex items-center gap-1">
          <button onClick={() => update.mutate()} className="text-primary hover:text-primary/80 p-1">
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground p-1"><X className="w-4 h-4" /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className="border-t border-border/30 cursor-pointer hover:bg-secondary/20 transition-colors"
      onClick={() => setEditing(true)}
    >
      <td className="py-3 pr-3 text-sm text-foreground font-medium">{flavor.name}</td>
      <td className="py-3 pr-3 text-sm text-muted-foreground">{flavor.slug}</td>
      <td className="py-3 pr-3 text-sm text-muted-foreground">{flavor.description}</td>
      <td className="py-3">
        <button
          onClick={(e) => { e.stopPropagation(); remove.mutate(); }}
          className="text-muted-foreground hover:text-red-400 transition-colors p-1"
        >
          {remove.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
}

function AddFlavorForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  return (
    <tr className="border-t border-border/30 bg-primary/5">
      <td className="py-2 pr-3">
        <input className="w-full bg-secondary/40 border border-border/50 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }} placeholder="Stylized" />
      </td>
      <td className="py-2 pr-3">
        <input className="w-full bg-secondary/40 border border-border/50 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="stylized" />
      </td>
      <td className="py-2 pr-3">
        <input className="w-full bg-secondary/40 border border-border/50 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Artistic interpretation…" />
      </td>
      <td className="py-2 flex items-center gap-1">
        <button onClick={() => onSave({ name, slug, description })} className="text-primary hover:text-primary/80 p-1"><Check className="w-4 h-4" /></button>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground p-1"><X className="w-4 h-4" /></button>
      </td>
    </tr>
  );
}

export default function AdminFlavors() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: flavors = [], isLoading } = useQuery({
    queryKey: ["admin-flavors"],
    queryFn: () => adminApi.getFlavors(),
  });

  const create = useMutation({
    mutationFn: (d) => adminApi.createFlavor(d),
    onSuccess: () => { qc.invalidateQueries(["admin-flavors"]); setAdding(false); },
  });

  if (isLoading) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground">Flavors</h1>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-primary text-black rounded-full px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Flavor
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Output style options shown to users when generating prompts.</p>

      <div className="bg-[#101010] border border-border/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Name</th>
              <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-0 py-3">Slug</th>
              <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-0 py-3">Description</th>
              <th className="w-16 px-0 py-3" />
            </tr>
          </thead>
          <tbody className="px-4">
            {flavors.map((f) => (
              <tr key={f.id} className="border-t border-border/30">
                <td colSpan={4} className="p-0">
                  <table className="w-full"><tbody><FlavorRow flavor={f} /></tbody></table>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="border-t border-border/30">
                <td colSpan={4} className="p-0">
                  <table className="w-full"><tbody>
                    <AddFlavorForm onSave={(d) => create.mutate(d)} onCancel={() => setAdding(false)} />
                  </tbody></table>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
