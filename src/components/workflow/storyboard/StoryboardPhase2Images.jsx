import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Image as ImageIcon,
  Loader2,
  Check,
  RefreshCw,
  Lock,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { IMAGE_ENGINES } from "@/lib/platformPresets";

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "";

export default function StoryboardPhase2Images({
  project,
  scenes,
  onScenesUpdate,
  onAdvance,
}) {
  const [selectedEngine, setSelectedEngine] = useState("nanobanana");
  const [generatingFor, setGeneratingFor] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState("");

  const isUnlocked = (idx) =>
    idx === 0 || scenes[idx - 1]?.image_status === "approved";

  const allApproved =
    scenes.length > 0 && scenes.every((s) => s.image_status === "approved");

  const generateImage = async (idx) => {
    const scene = scenes[idx];
    if (!scene) return;
    setGeneratingFor(idx);

    const referenceImageUrl = idx > 0 ? scenes[idx - 1].image_url : null;

    try {
      const res = await fetch(`${WORKER_URL}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: scene.image_prompt,
          aspect_ratio: project.aspect_ratio || "16:9",
          engine: selectedEngine,
          reference_image_url: referenceImageUrl,
        }),
      });
      const data = await res.json();

      const updatedScenes = scenes.map((s, i) =>
        i === idx
          ? { ...s, image_url: data.image_url || "", image_status: "generated" }
          : s
      );
      await onScenesUpdate(updatedScenes);
    } catch (err) {
      console.error("Image generation error:", err);
    } finally {
      setGeneratingFor(null);
    }
  };

  const approveImage = async (idx) => {
    const updatedScenes = scenes.map((s, i) =>
      i === idx ? { ...s, image_status: "approved" } : s
    );
    await onScenesUpdate(updatedScenes);
  };

  const savePrompt = async (idx) => {
    const updatedScenes = scenes.map((s, i) =>
      i === idx ? { ...s, image_prompt: editingPrompt } : s
    );
    await onScenesUpdate(updatedScenes);
    setEditingIdx(null);
    setEditingPrompt("");
  };

  const rejectImage = async (idx) => {
    const updatedScenes = scenes.map((s, i) =>
      i === idx ? { ...s, image_url: null, image_status: "pending" } : s
    );
    await onScenesUpdate(updatedScenes);
  };

  if (scenes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No scenes yet.</p>
        <p className="text-sm mt-1">
          Go back to Phase 1 to generate your storyboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold">Scene Image Generation</h3>
              <p className="text-sm text-muted-foreground">
                Generate images scene by scene. Each scene uses the previous
                approved image as a visual reference for character and style
                consistency.
              </p>
            </div>
            <Select value={selectedEngine} onValueChange={setSelectedEngine}>
              <SelectTrigger className="w-48 bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_ENGINES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {scenes.map((scene, idx) => {
        const unlocked = isUnlocked(idx);
        const isGenerating = generatingFor === idx;
        const hasImage = !!scene.image_url;
        const isApproved = scene.image_status === "approved";

        return (
          <Card
            key={scene.scene_number}
            className={`border transition-all ${
              isApproved
                ? "border-green-500/30 bg-green-500/5"
                : unlocked
                ? "border-border/50 bg-card"
                : "border-border/20 bg-card/30 opacity-60"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isApproved ? "bg-green-500/20" : "bg-[#C4BAA7]/20"
                  }`}
                >
                  {isApproved ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <span
                      className={`text-sm font-bold ${
                        unlocked
                          ? "text-[#C4BAA7]"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {scene.scene_number}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold">{scene.scene_title}</h4>
                    {!unlocked && (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    )}
                    {isApproved && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        Approved
                      </Badge>
                    )}
                    {idx > 0 && unlocked && !isApproved && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-[#C4BAA7]/20 text-[#C4BAA7]"
                      >
                        Using scene {idx} as reference
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {scene.description}
                  </p>

                  <div className="bg-secondary/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Image Prompt
                      </p>
                      {editingIdx !== idx && (
                        <button
                          onClick={() => {
                            setEditingIdx(idx);
                            setEditingPrompt(scene.image_prompt);
                          }}
                          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {editingIdx === idx ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingPrompt}
                          onChange={(e) => setEditingPrompt(e.target.value)}
                          className="w-full text-xs leading-relaxed bg-secondary/50 border border-border/50 rounded-md p-2 resize-none min-h-[80px] focus:outline-none focus:ring-1 focus:ring-border"
                        />
                        <div className="flex gap-2">
                          <button
                            className="text-xs h-7 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => savePrompt(idx)}
                          >
                            Save
                          </button>
                          <button
                            className="text-xs h-7 px-3 rounded-md text-muted-foreground hover:text-foreground"
                            onClick={() => { setEditingIdx(null); setEditingPrompt(""); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed">{scene.image_prompt}</p>
                    )}
                  </div>

                  {!unlocked ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
                      <Lock className="w-4 h-4" />
                      Unlock by approving Scene {idx}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hasImage && (
                        <div className="relative rounded-xl overflow-hidden border border-border/50 bg-secondary/30">
                          <img
                            src={scene.image_url}
                            alt={`Scene ${scene.scene_number}`}
                            className="w-full max-h-72 object-cover"
                          />
                          {isApproved && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-500/90 text-white">
                                <Check className="w-3 h-3 mr-1" /> Approved
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {isGenerating && (
                        <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground bg-secondary/30 rounded-xl">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">
                            Generating via {selectedEngine}
                            {idx > 0 ? " (with scene reference)..." : "..."}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {!isApproved && (
                          <Button
                            size="sm"
                            onClick={() => generateImage(idx)}
                            disabled={isGenerating}
                            className={
                              hasImage
                                ? "bg-secondary text-foreground hover:bg-secondary/80"
                                : "bg-primary hover:bg-primary/90"
                            }
                          >
                            {isGenerating ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : hasImage ? (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            ) : (
                              <ImageIcon className="w-4 h-4 mr-2" />
                            )}
                            {isGenerating
                              ? "Generating..."
                              : hasImage
                              ? "Regenerate"
                              : "Generate Image"}
                          </Button>
                        )}

                        {hasImage && !isApproved && (
                          <Button
                            size="sm"
                            onClick={() => approveImage(idx)}
                            className="bg-green-500/90 hover:bg-green-500 text-white"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        )}

                        {isApproved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => rejectImage(idx)}
                            className="text-muted-foreground hover:text-destructive text-xs"
                          >
                            Revise Image
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {allApproved && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={onAdvance}
            className="bg-[#C4BAA7] text-black hover:bg-[#C4BAA7]/80"
          >
            Proceed to Video Queue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
