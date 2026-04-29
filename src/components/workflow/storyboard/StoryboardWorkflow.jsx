import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { FileText, Image, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StoryboardPhase1Brief from "./StoryboardPhase1Brief";
import StoryboardPhase2Images from "./StoryboardPhase2Images";
import StoryboardPhase3Video from "./StoryboardPhase3Video";

const STORYBOARD_PHASES = [
  { id: 1, label: "Brief & Scenes", icon: FileText },
  { id: 2, label: "Image Generation", icon: Image },
  { id: 3, label: "Video Queue", icon: Video },
];

export default function StoryboardWorkflow({ project, onProjectUpdate }) {
  const [currentPhase, setCurrentPhase] = useState(
    project.current_phase || 1
  );
  const [scenes, setScenes] = useState([]);

  useEffect(() => {
    if (project.scenes) {
      try {
        const parsed = JSON.parse(project.scenes);
        setScenes(Array.isArray(parsed) ? parsed : []);
      } catch {
        setScenes([]);
      }
    }
  }, [project.scenes]);

  const saveScenes = async (updatedScenes) => {
    setScenes(updatedScenes);
    await Project.update(project.id, { scenes: JSON.stringify(updatedScenes) });
    onProjectUpdate?.();
  };

  const handlePhaseChange = async (phase) => {
    setCurrentPhase(phase);
    await Project.update(project.id, { current_phase: phase });
  };

  const handleScenesGenerated = async (newScenes) => {
    await saveScenes(newScenes);
    await handlePhaseChange(2);
  };

  return (
    <div>
      {/* Storyboard phase tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {STORYBOARD_PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isActive = currentPhase === phase.id;
          const isCompleted = currentPhase > phase.id;
          const hasScenes = scenes.length > 0;
          const isAccessible =
            phase.id === 1 ||
            (phase.id === 2 && hasScenes) ||
            (phase.id === 3 && hasScenes);

          return (
            <React.Fragment key={phase.id}>
              <button
                onClick={() => isAccessible && handlePhaseChange(phase.id)}
                disabled={!isAccessible}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#C4BAA7]/20 text-[#C4BAA7] border border-[#C4BAA7]/40"
                    : isCompleted && isAccessible
                    ? "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    : isAccessible
                    ? "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    : "text-muted-foreground/30 cursor-not-allowed"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {phase.label}
              </button>
              {idx < STORYBOARD_PHASES.length - 1 && (
                <div
                  className={`h-px w-6 shrink-0 ${
                    currentPhase > phase.id
                      ? "bg-[#C4BAA7]/40"
                      : "bg-border/50"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Phase content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentPhase === 1 && (
            <StoryboardPhase1Brief
              project={project}
              scenes={scenes}
              onScenesGenerated={handleScenesGenerated}
            />
          )}
          {currentPhase === 2 && (
            <StoryboardPhase2Images
              project={project}
              scenes={scenes}
              onScenesUpdate={saveScenes}
              onAdvance={() => handlePhaseChange(3)}
            />
          )}
          {currentPhase === 3 && (
            <StoryboardPhase3Video
              project={project}
              scenes={scenes}
              onScenesUpdate={saveScenes}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
