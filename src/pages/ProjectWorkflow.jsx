import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Prompt } from "@/entities/Prompt";
import { GeneratedImage } from "@/entities/GeneratedImage";
import { GeneratedVideo } from "@/entities/GeneratedVideo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import PhaseIndicator from "@/components/workflow/PhaseIndicator";
import Phase1Brief from "@/components/workflow/Phase1Brief";
import Phase2Images from "@/components/workflow/Phase2Images";
import Phase3Video from "@/components/workflow/Phase3Video";
import Phase4PostProcess from "@/components/workflow/Phase4PostProcess";
import FeedbackSidebar from "@/components/workflow/FeedbackSidebar";
import StoryboardWorkflow from "@/components/workflow/storyboard/StoryboardWorkflow";

export default function ProjectWorkflow() {
  const projectId = window.location.pathname.split("/project/")[1];
  const queryClient = useQueryClient();

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => Project.get(projectId),
    enabled: !!projectId,
  });

  const [currentPhase, setCurrentPhase] = useState(1);
  const [promptMode, setPromptMode] = useState(null);
  const [promptCategory, setPromptCategory] = useState(null);
  const [promptFlavors, setPromptFlavors] = useState({ 1: "stylized", 2: "abstract", 3: "literal" });

  // Feedback sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackThread, setFeedbackThread] = useState([]);

  // Phase 2 inline edits — { [promptId]: string }
  const [editedPrompts, setEditedPrompts] = useState({});

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

  // Sidebar refinement callback
  const handlePromptsRefined = async (refinedPrompts, relevantPrompts) => {
    if (currentPhase === 1) {
      // Update D1 records for Phase 1 refinements
      for (let i = 0; i < Math.min(refinedPrompts.length, relevantPrompts.length); i++) {
        await Prompt.update(relevantPrompts[i].id, {
          prompt_text: refinedPrompts[i].prompt_text,
          action_prompt: refinedPrompts[i].action_prompt || relevantPrompts[i].action_prompt,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["prompts", projectId] });
    } else {
      // Phase 2+: update the local edited-prompts state
      const updates = {};
      for (let i = 0; i < Math.min(refinedPrompts.length, relevantPrompts.length); i++) {
        updates[relevantPrompts[i].id] = refinedPrompts[i].prompt_text;
      }
      setEditedPrompts((prev) => ({ ...prev, ...updates }));
    }
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-[#101010]/80 backdrop-blur-sm shrink-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="text-base sm:text-lg font-bold truncate text-primary flex-1">
              {project.title}
            </h1>
            {/* Feedback sidebar toggle — only in standard mode */}
            {project.mode !== "storyboard" && (
              <button
                onClick={() => setSidebarOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  sidebarOpen
                    ? "bg-primary text-black border-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Feedback</span>
                {feedbackThread.length > 0 && (
                  <span className={`rounded-full w-4 h-4 text-[10px] flex items-center justify-center ${sidebarOpen ? "bg-black text-primary" : "bg-primary/20 text-primary"}`}>
                    {Math.floor(feedbackThread.length / 2)}
                  </span>
                )}
              </button>
            )}
          </div>
          {project.mode !== "storyboard" && (
            <div className="pb-3 overflow-x-auto">
              <PhaseIndicator
                currentPhase={currentPhase}
                onPhaseClick={handlePhaseChange}
                completedPhases={getCompletedPhases()}
              />
            </div>
          )}
        </div>
      </header>

      {/* Body — main content + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {project.mode === "storyboard" ? (
              <StoryboardWorkflow project={project} onProjectUpdate={onProjectUpdate} />
            ) : (
              <>
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
                        promptMode={promptMode}
                        promptCategory={promptCategory}
                        onPromptModeChange={(m) => { setPromptMode(m); setPromptCategory(null); }}
                        onPromptCategoryChange={setPromptCategory}
                        promptFlavors={promptFlavors}
                        onPromptFlavorsChange={setPromptFlavors}
                      />
                    )}
                    {currentPhase === 2 && (
                      <Phase2Images
                        project={project}
                        prompts={prompts}
                        images={images}
                        editedPrompts={editedPrompts}
                        onEditPrompt={(id, text) =>
                          setEditedPrompts((prev) => ({ ...prev, [id]: text }))
                        }
                        onResetPrompt={(id) =>
                          setEditedPrompts((prev) => {
                            const next = { ...prev };
                            delete next[id];
                            return next;
                          })
                        }
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
              </>
            )}
          </div>
        </main>

        {/* Persistent feedback sidebar */}
        {project.mode !== "storyboard" && (
          <FeedbackSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentPhase={currentPhase}
            prompts={prompts}
            editedPrompts={editedPrompts}
            promptMode={promptMode}
            promptCategory={promptCategory}
            onPromptsRefined={handlePromptsRefined}
            thread={feedbackThread}
            onThreadUpdate={setFeedbackThread}
            projectId={projectId}
            queryClient={queryClient}
          />
        )}
      </div>
    </div>
  );
}
