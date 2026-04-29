import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, UserCheck, UserX } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

function CreateUserForm({ onSave, onCancel }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");

  return (
    <div className="bg-[#101010] border border-primary/30 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">New User</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-secondary/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
            placeholder="admin@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-secondary/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-secondary/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ email, password, role })}
          disabled={!email || !password}
          className="bg-primary text-black rounded-full px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          Create User
        </button>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminApi.getUsers(),
  });

  const create = useMutation({
    mutationFn: (d) => adminApi.createUser(d),
    onSuccess: () => { qc.invalidateQueries(["admin-users"]); setAdding(false); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }) => adminApi.updateUser(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(["admin-users"]),
  });

  if (isLoading) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-2 bg-primary text-black rounded-full px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Admin accounts that can access this panel.</p>

      {adding && (
        <div className="mb-6">
          <CreateUserForm onSave={(d) => create.mutate(d)} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="bg-[#101010] border border-border/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Email</th>
              <th className="text-left text-xs text-muted-foreground uppercase tracking-wider py-3">Role</th>
              <th className="text-left text-xs text-muted-foreground uppercase tracking-wider py-3">Status</th>
              <th className="text-left text-xs text-muted-foreground uppercase tracking-wider py-3">Created</th>
              <th className="w-20 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border/30">
                <td className="px-4 py-3 text-sm text-foreground">{u.email}</td>
                <td className="py-3 text-sm text-muted-foreground capitalize">{u.role}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 text-sm text-muted-foreground">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="py-3 pr-4 text-right">
                  <button
                    onClick={() => toggle.mutate({ id: u.id, is_active: !u.is_active })}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={u.is_active ? "Deactivate" : "Activate"}
                  >
                    {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
