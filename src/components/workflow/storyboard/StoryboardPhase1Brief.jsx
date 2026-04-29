import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "";

export default function StoryboardPhase1Brief({
  project,
  scenes,
  onScenesGenerated,
}) {
  const [brief, setBrief] = useState(project.brief || "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [localScenes, setLocalScenes] = useState(scenes);

  useEffect(() => {
    setLocalScenes(scenes);
  }, [scenes]);

  const generateStoryboard = async () => {
    if (!brief.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/api/generate-storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: brief.trim() }),
      });
      const data = await res.json();
      if (data.scenes && Array.isArray(data.scenes)) {
        const scenesWithStatus = data.scenes.map((s) => ({
          ...s,
          image_url: null,
          image_status: "pending",
          video_url: null,
          video_status: "pending",
        }));
        setLocalScenes(scenesWithStatus);
        onScenesGenerated(scenesWithStatus);
      } else {
        setError("Unexpected response format. Please try again.");
      }
    } catch (err) {
      setError("Failed to generate storyboard. Please try again.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Video Brief</h3>
            <p className="text-sm text-muted-foreground">
              Describe the full video you want to create — characters, setting,
              narrative arc, visual style, and tone. The more detail you
              provide, the better your storyboard will be.
            </p>
          </div>
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. A cinematic short about a lone astronaut discovering a hidden oasis on Mars. The character is a weathered scientist in her 50s wearing a worn spacesuit. The visual style is high-contrast with dusty reds and deep blues. The narrative opens with solitude and quiet, then moves to wonder as she discovers water, then ends with an unexpected connection to something left behind..."
            className="bg-secondary/50 min-h-[160px] text-sm leading-relaxed"
            rows={7}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={generateStoryboard}
            disabled={!brief.trim() || generating}
            className="bg-primary hover:bg-primary/90"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {generating ? "Generating Storyboard..." : "Generate Storyboard"}
          </Button>
        </CardContent>
      </Card>

      {localScenes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {localScenes.length} Scenes Generated
            </h3>
            <Button
              size="sm"
              onClick={() => onScenesGenerated(localScenes)}
              className="bg-[#C4BAA7] text-black hover:bg-[#C4BAA7]/80"
            >
              Proceed to Image Generation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="space-y-3">
            {localScenes.map((scene) => (
              <Card
                key={scene.scene_number}
                className="bg-card border-border/50"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C4BAA7]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-[#C4BAA7]">
                        {scene.scene_number}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{scene.scene_title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          Scene {scene.scene_number}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {scene.description}
                      </p>
                      <div className="space-y-2">
                        <div className="bg-secondary/30 rounded-lg p-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            Image Prompt
                          </p>
                          <p className="text-xs leading-relaxed">
                            {scene.image_prompt}
                          </p>
                        </div>
                        <div className="bg-secondary/30 rounded-lg p-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            Action / Motion
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {scene.action_prompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
