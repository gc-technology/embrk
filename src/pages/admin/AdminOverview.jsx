import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layers, FileText, Palette, Users, ArrowRight } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

function StatCard({ icon: Icon, label, count, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center justify-between bg-[#101010] border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-colors text-left w-full"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground">{count ?? "—"}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

export default function AdminOverview() {
  const { data: modes } = useQuery({ queryKey: ["admin-modes"], queryFn: () => adminApi.getModes() });
  const { data: flavors } = useQuery({ queryKey: ["admin-flavors"], queryFn: () => adminApi.getFlavors() });
  const { data: users } = useQuery({ queryKey: ["admin-users"], queryFn: () => adminApi.getUsers() });
  const { data: fragments } = useQuery({ queryKey: ["admin-fragments"], queryFn: () => adminApi.getFragments() });

  const categoryCount = modes?.reduce((n, m) => n + (m.category_count ?? 0), 0);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Overview</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage modes, categories, prompts, and users.</p>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Layers} label="Modes" count={modes?.length} to="/admin/categories" />
        <StatCard icon={Layers} label="Categories" count={categoryCount} to="/admin/categories" />
        <StatCard icon={FileText} label="Prompt Fragments" count={fragments?.length} to="/admin/prompts" />
        <StatCard icon={Palette} label="Flavors" count={flavors?.length} to="/admin/flavors" />
        <StatCard icon={Users} label="Users" count={users?.length} to="/admin/users" />
      </div>
    </div>
  );
}
