import React from "react";
import { motion } from "framer-motion";
import { Check, FileText, Image, Video, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const phases = [
  { id: 1, label: "Brief & Prompts", shortLabel: "Brief", icon: FileText },
  { id: 2, label: "Image Generation", shortLabel: "Images", icon: Image },
  { id: 3, label: "Video Generation", shortLabel: "Video", icon: Video },
  { id: 4, label: "Post Processing", shortLabel: "Post", icon: Sparkles },
];

export default function PhaseIndicator({ currentPhase, onPhaseClick, completedPhases = [] }) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-secondary/50 rounded-2xl backdrop-blur-sm border border-border/50 overflow-x-auto max-w-full">
      {phases.map((phase, idx) => {
        const Icon = phase.icon;
        const isActive = currentPhase === phase.id;
        const isCompleted = completedPhases.includes(phase.id);

        return (
          <React.Fragment key={phase.id}>
            <button
              onClick={() => onPhaseClick(phase.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : isCompleted
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activePhase"
                  className="absolute inset-0 bg-primary rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {isCompleted && !isActive ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                <span className="hidden sm:inline">{phase.shortLabel}</span>
                <span className="hidden lg:inline"> & {phase.label.split(" & ")[1] || phase.label.split(" ")[1]}</span>
              </span>
            </button>
            {idx < phases.length - 1 && (
              <div className={cn(
                "w-3 sm:w-6 h-px hidden sm:block shrink-0",
                isCompleted ? "bg-primary/40" : "bg-border"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}