import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

function PasswordField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-secondary/40 border border-border/50 rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const { data: me } = useQuery({ queryKey: ["admin-me"], queryFn: () => adminApi.me() });

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  const change = useMutation({
    mutationFn: () => adminApi.changePassword(current, next),
    onSuccess: (res) => {
      if (res.ok) {
        setSuccess(true);
        setCurrent(""); setNext(""); setConfirm("");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setLocalError(res.error ?? "Failed to change password");
      }
    },
    onError: () => setLocalError("Request failed"),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    setSuccess(false);
    if (next.length < 8) { setLocalError("New password must be at least 8 characters"); return; }
    if (next !== confirm) { setLocalError("New passwords do not match"); return; }
    change.mutate();
  }

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-bold text-foreground mb-1">Profile</h1>
      {me?.email && <p className="text-sm text-muted-foreground mb-8">{me.email}</p>}

      <div className="bg-[#101010] border border-border/50 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5">Change password</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField label="Current password" value={current} onChange={setCurrent} />
          <PasswordField label="New password" value={next} onChange={setNext} />
          <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} />

          {localError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {localError}
            </p>
          )}
          {success && (
            <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Password updated. Other sessions have been signed out.
            </p>
          )}

          <button
            type="submit"
            disabled={change.isPending || !current || !next || !confirm}
            className="w-full flex items-center justify-center gap-2 bg-primary text-black rounded-full px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {change.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {change.isPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
