import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Prompt } from "@/entities/Prompt";
import { GeneratedImage } from "@/entities/GeneratedImage";
import { GeneratedVideo } from "@/entities/GeneratedVideo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import PhaseIndicator from "@/components/workflow/PhaseIndicator";
import Phase1Brief from "@/components/workflow/Phase1Brief";
import Phase2Images from "@/components/workflow/Phase2Images";
import Phase3Video from "@/components/workflow/Phase3Video";
import Phase4PostProcess from "@/components/workflow/Phase4PostProcess";

export default function ProjectWorkflow() {
  const projectId = window.location.pathname.split("/project/")[1];
  const queryClient = useQueryClient();

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => Project.get(projectId),
    enabled: !!projectId,
  });

  const [currentPhase, setCurrentPhase] = useState(1);

  useEffect(() => {
    if (project?.current_phase) {
      setCurrentPhase(project.current_phase);
    }
  }, [project?.current_phase]);

  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts", projectId],
    queryFn: () => Prompt.list({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: images = [] } = useQuery({
    queryKey: ["images", projectId],
    queryFn: () => GeneratedImage.list({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos", projectId],
    queryFn: () => GeneratedVideo.list({ project_id: projectId }),
    enabled: !!projectId,
  });

  const handlePhaseChange = async (phase) => {
    setCurrentPhase(phase);
    if (project) {
      await Project.update(project.id, { current_phase: phase });
    }
  };

  const onProjectUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const getCompletedPhases = () => {
    const completed = [];
    if (prompts.some((p) => p.status === "approved")) completed.push(1);
    if (images.some((i) => i.status === "approved")) completed.push(2);
    if (videos.some((v) => v.status === "approved")) completed.push(3);
    return completed;
  };

  if (loadingProject) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Project not found</p>
          <Button variant="ghost" className="mt-4" asChild>
            <Link to="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row — back + title */}
          <div className="h-14 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="text-base sm:text-lg font-bold truncate">{project.title}</h1>
          </div>
          {/* Phase tabs — own row on mobile */}
          <div className="pb-3 overflow-x-auto">
            <PhaseIndicator
              currentPhase={currentPhase}
              onPhaseClick={handlePhaseChange}
              completedPhases={getCompletedPhases()}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentPhase === 1 && (
              <Phase1Brief
                project={project}
                prompts={prompts}
                onProjectUpdate={onProjectUpdate}
              />
            )}
            {currentPhase === 2 && (
              <Phase2Images
                project={project}
                prompts={prompts}
                images={images}
              />
            )}
            {currentPhase === 3 && (
              <Phase3Video
                project={project}
                prompts={prompts}
                images={images}
                videos={videos}
              />
            )}
            {currentPhase === 4 && (
              <Phase4PostProcess
                project={project}
                images={images}
                videos={videos}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePhaseChange(Math.max(1, currentPhase - 1))}
            disabled={currentPhase === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Previous Phase</span>
            <span className="sm:hidden">Prev</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            Phase {currentPhase} of 4
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePhaseChange(Math.min(4, currentPhase + 1))}
            disabled={currentPhase === 4}
          >
            <span className="hidden sm:inline">Next Phase</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>
    </div>
  );
}