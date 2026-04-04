import React, { useState } from "react";
import { Project } from "@/entities/Project";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FolderOpen, Trash2, ArrowRight, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const phaseLabels = {
  1: "Brief & Prompts",
  2: "Image Generation",
  3: "Video Generation",
  4: "Post Processing",
};

export default function Dashboard() {
  const [newTitle, setNewTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => Project.list(),
  });

  const createProject = useMutation({
    mutationFn: (title) =>
      Project.create({
        title,
        current_phase: 1,
        status: "draft",
        prompt_engine: "claude",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNewTitle("");
      setDialogOpen(false);
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id) => Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">EMBARK</h1>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Project title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-secondary/50"
                  autoFocus
                />
                <Button
                  onClick={() => {
                    if (newTitle.trim()) createProject.mutate(newTitle.trim());
                  }}
                  disabled={!newTitle.trim() || createProject.isPending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Your Projects</h2>
          <p className="text-muted-foreground mt-1">
            Manage your AI creative workflows
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Create your first project to get started
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-6 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {projects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-xs">
                              Phase {project.current_phase || 1}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {phaseLabels[project.current_phase || 1]}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            deleteProject.mutate(project.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {project.created_date
                            ? format(new Date(project.created_date), "MMM d, yyyy")
                            : "Recently"}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary group-hover:bg-primary/10"
                          asChild
                        >
                          <Link to={`/project/${project.id}`}>
                            Open
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}