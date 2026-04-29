import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Sparkles, LayoutDashboard, Layers, FileText, Palette, Users, UserCircle, LogOut, Loader2 } from "lucide-react";
import { adminApi, adminToken } from "@/lib/adminApiClient";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/categories", label: "Modes & Categories", icon: Layers },
  { to: "/admin/prompts", label: "Prompts", icon: FileText },
  { to: "/admin/flavors", label: "Flavors", icon: Palette },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/profile", label: "Profile", icon: UserCircle },
];

export default function AdminLayout() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminToken.get()) {
      navigate("/admin/login", { replace: true });
      return;
    }
    adminApi.me()
      .then((res) => {
        if (!res?.email) navigate("/admin/login", { replace: true });
        else setChecking(false);
      })
      .catch(() => navigate("/admin/login", { replace: true }));
  }, [navigate]);

  const handleLogout = async () => {
    await adminApi.logout().catch(() => {});
    adminToken.clear();
    navigate("/admin/login", { replace: true });
  };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-[#101010] border-r border-border/50 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border/50">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-primary">EMBARK Admin</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
