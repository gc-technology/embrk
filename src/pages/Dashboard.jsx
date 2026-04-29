import React, { useState } from "react";
import { Project } from "@/entities/Project";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, FolderOpen, Trash2, Clock, Layers, Film, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import NewProjectModal from "@/components/NewProjectModal";
import WordsPullUp from "@/components/motion/WordsPullUp";
import AnimatedLetter from "@/components/motion/AnimatedLetter";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  draft: "bg-muted/50 text-muted-foreground",
  "in progress": "bg-amber-500/20 text-amber-400",
  in_progress: "bg-amber-500/20 text-amber-400",
  complete: "bg-green-500/20 text-green-400",
};

const MODE_BADGE = {
  standard: "bg-secondary text-muted-foreground",
  storyboard: "bg-primary/20 text-primary",
};

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modeFilter, setModeFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => Project.list(),
  });

  const deleteProject = useMutation({
    mutationFn: (id) => Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const filteredProjects = projects.filter((p) =>
    modeFilter === "all" ? true : (p.mode || "standard") === modeFilter
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border/50 bg-[#101010] flex flex-col shrink-0">
        {/* Logo + new project */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-primary">EMBARK</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-between gap-2 bg-primary text-black rounded-full px-5 py-2.5 text-sm font-bold hover:gap-3 transition-all duration-200 group"
          >
            New Project
            <span className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
              <Plus className="w-3.5 h-3.5 text-primary" />
            </span>
          </button>
        </div>

        {/* Mode filter */}
        <div className="px-3 py-3 border-b border-border/50">
          <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
            {[
              { id: "all", label: "All" },
              { id: "standard", label: "Standard" },
              { id: "storyboard", label: "Story" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setModeFilter(tab.id)}
                className={cn(
                  "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors",
                  modeFilter === tab.id
                    ? "bg-primary text-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading && (
            <div className="space-y-2 px-3 mt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-secondary/20 animate-pulse"
                />
              ))}
            </div>
          )}

          {!isLoading && filteredProjects.length === 0 && (
            <div className="text-center px-4 py-8">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                {modeFilter === "all"
                  ? "No projects yet"
                  : `No ${modeFilter} projects`}
              </p>
            </div>
          )}

          <AnimatePresence>
            {filteredProjects.map((project, idx) => {
              const mode = project.mode || "standard";
              const status = project.status || "draft";
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="px-2 mb-0.5 group"
                >
                  <Link
                    to={`/project/${project.id}`}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {mode === "storyboard" ? (
                        <Film className="w-4 h-4 text-primary" />
                      ) : (
                        <Layers className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {project.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                            MODE_BADGE[mode] || MODE_BADGE.standard
                          )}
                        >
                          {mode === "storyboard" ? "Storyboard" : "Standard"}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium capitalize",
                            STATUS_STYLES[status] || STATUS_STYLES.draft
                          )}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/60">
                        <Clock className="w-2.5 h-2.5" />
                        {project.created_date
                          ? format(new Date(project.created_date), "MMM d")
                          : "Recent"}
                      </div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteProject.mutate(project.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer count */}
        <div className="p-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground/40 text-center">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
      </aside>

      {/* Main welcome area */}
      <main className="flex-1 overflow-auto flex flex-col items-center justify-center gap-6 p-8 relative">
        {/* Ambient noise texture */}
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.06]" />

        <div className="text-center max-w-md relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-primary">
            <WordsPullUp text="Welcome to Embark" />
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
            <AnimatedLetter text="Your AI-powered media production pipeline. Create projects, generate prompts, produce images and videos — all in one place." />
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-black rounded-full px-6 py-3 text-sm font-bold hover:gap-3 transition-all duration-200 group"
          >
            New Project
            <span className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
              <ArrowRight className="w-4 h-4 text-primary" />
            </span>
          </button>
          {projects.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Or select a project from the sidebar to continue
            </p>
          )}
        </div>

        {/* Mode info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl relative">
          <div className="p-5 rounded-2xl border border-border/50 bg-[#101010] text-left">
            <Layers className="w-6 h-6 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1 text-foreground">Standard Mode</h3>
            <p className="text-sm text-muted-foreground">
              Generate images and video from a creative brief through a guided
              4-phase workflow.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 text-left">
            <Film className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1 text-foreground">Storyboard Mode</h3>
            <p className="text-sm text-muted-foreground">
              Build a scene-by-scene video narrative with character consistency
              across every frame.
            </p>
          </div>
        </div>
      </main>

      <NewProjectModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
