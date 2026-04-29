import React, { useState } from "react";
import { Project } from "@/entities/Project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layers, Film, ArrowRight, ArrowLeft } from "lucide-react";

const MODES = [
  {
    id: "standard",
    label: "Standard Mode",
    description: "Generate images and video from a creative brief",
    icon: Layers,
  },
  {
    id: "storyboard",
    label: "Storyboard Mode",
    description:
      "Build a scene-by-scene video narrative with character consistency",
    icon: Film,
  },
];

export default function NewProjectModal({ open, onOpenChange }) {
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState(null);
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createProject = useMutation({
    mutationFn: ({ title, mode }) =>
      Project.create({
        title,
        mode,
        current_phase: 1,
        status: "draft",
        prompt_engine: "claude",
      }),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      handleClose();
      navigate(`/project/${newProject.id}`);
    },
  });

  const handleClose = () => {
    setStep(1);
    setSelectedMode(null);
    setTitle("");
    onOpenChange(false);
  };

  const handleModeSelect = (modeId) => {
    setSelectedMode(modeId);
    setStep(2);
  };

  const handleCreate = () => {
    if (title.trim() && selectedMode) {
      createProject.mutate({ title: title.trim(), mode: selectedMode });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Choose a Mode" : "Name Your Project"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground -mt-1">
              Select a mode to get started — you'll name the project next.
            </p>
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className="w-full text-left p-4 rounded-xl border-2 border-border/50 hover:border-primary/60 bg-secondary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold group-hover:text-primary transition-colors">
                        {mode.label}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {mode.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mode:</span>
              <span className="text-primary font-medium capitalize">
                {selectedMode}
              </span>
            </div>
            <Input
              placeholder="Project title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="bg-secondary/50"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!title.trim() || createProject.isPending}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
