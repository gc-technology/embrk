import React, { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Video, Loader2, Check, Download, RefreshCw } from "lucide-react";
import { VIDEO_ENGINES } from "@/lib/platformPresets";

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "";

const ENGINE_DURATIONS = {
  kling: [
    { value: "5", label: "5 seconds" },
    { value: "10", label: "10 seconds" },
    { value: "15", label: "15 seconds" },
    { value: "30", label: "30 seconds" },
  ],
  veo: [
    { value: "4", label: "4 seconds" },
    { value: "6", label: "6 seconds" },
    { value: "8", label: "8 seconds" },
  ],
};

const ENGINE_LABELS = {
  kling: "Kling ($0.084/sec)",
  veo: "Veo ($0.40/sec)",
};

const getCostEstimate = (engine, duration, audioOn) => {
  const secs = parseInt(duration);
  if (engine === "kling") return `$${(secs * (audioOn ? 0.112 : 0.084)).toFixed(2)}`;
  if (engine === "veo") return `$${(secs * 0.40).toFixed(2)}`;
  return "—";
};

const ENGINE_DEFAULTS = { kling: "5", veo: "4" };

export default function StoryboardPhase3Video({
  project,
  scenes,
  onScenesUpdate,
}) {
  const [selectedEngine, setSelectedEngine] = useState("kling");
  const [duration, setDuration] = useState(ENGINE_DEFAULTS.kling);
  const [actionOverrides, setActionOverrides] = useState({});
  const [generatingFor, setGeneratingFor] = useState(null);
  const inFlightRef = useRef({});
  const [downloadingFor, setDownloadingFor] = useState(null);
  const [exportProgress, setExportProgress] = useState(null);
  const [generateAudio, setGenerateAudio] = useState(false);

  const approvedScenes = scenes.filter((s) => s.image_status === "approved");
  const currentDurations = ENGINE_DURATIONS[selectedEngine] || ENGINE_DURATIONS.kling;

  const handleEngineChange = (engine) => {
    setSelectedEngine(engine);
    setDuration(ENGINE_DEFAULTS[engine] || ENGINE_DURATIONS[engine]?.[0]?.value || "5");
    setGenerateAudio(false);
  };

  const generateVideo = async (scene) => {
    if (inFlightRef.current[scene.scene_number]) return;
    inFlightRef.current[scene.scene_number] = true;
    setGeneratingFor(scene.scene_number);
    console.log(`[EMBARK] Generating video for scene ${scene.scene_number} via ${selectedEngine} at ${new Date().toISOString()}`);
    const actionPrompt =
      actionOverrides[scene.scene_number] ?? scene.action_prompt ?? "";

    try {
      const res = await fetch(`${WORKER_URL}/api/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: scene.image_url,
          action_prompt: actionPrompt,
          engine: selectedEngine,
          duration: parseInt(duration),
          generate_audio: generateAudio,
        }),
      });
      const data = await res.json();

      const updatedScenes = scenes.map((s) =>
        s.scene_number === scene.scene_number
          ? {
              ...s,
              video_url: data.video_url || "",
              video_status: data.video_url ? "generated" : "generating",
              action_prompt: actionPrompt,
            }
          : s
      );
      await onScenesUpdate(updatedScenes);
    } catch (err) {
      console.error("Video generation error:", err);
    } finally {
      delete inFlightRef.current[scene.scene_number];
      setGeneratingFor(null);
    }
  };

  const approveVideo = async (scene) => {
    const updatedScenes = scenes.map((s) =>
      s.scene_number === scene.scene_number
        ? { ...s, video_status: "approved" }
        : s
    );
    await onScenesUpdate(updatedScenes);
  };

  const rejectVideo = async (scene) => {
    const updatedScenes = scenes.map((s) =>
      s.scene_number === scene.scene_number
        ? { ...s, video_url: null, video_status: "pending" }
        : s
    );
    await onScenesUpdate(updatedScenes);
  };

  const downloadVideo = async (scene) => {
    setDownloadingFor(scene.scene_number);
    try {
      const res = await fetch(scene.video_url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `scene-${scene.scene_number}-${scene.scene_title
        .replace(/\s+/g, "-")
        .toLowerCase()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloadingFor(null);
    }
  };

  const exportAll = async () => {
    const approvedVideos = scenes.filter(
      (s) => s.video_status === "approved" && s.video_url
    );
    for (let i = 0; i < approvedVideos.length; i++) {
      setExportProgress({ current: i + 1, total: approvedVideos.length });
      await downloadVideo(approvedVideos[i]);
      if (i < approvedVideos.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    setExportProgress(null);
  };

  if (approvedScenes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No approved scene images yet.</p>
        <p className="text-sm mt-1">
          Go back to Phase 2 to approve scene images first.
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
              <h3 className="font-semibold">Storyboard Video Queue</h3>
              <p className="text-sm text-muted-foreground">
                Generate videos for all {approvedScenes.length} approved scenes
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <Select value={selectedEngine} onValueChange={handleEngineChange}>
                  <SelectTrigger className="w-48 bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_ENGINES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {ENGINE_LABELS[e.id] || e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-32 bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentDurations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-amber-400">
                  Est. cost per clip: ~{getCostEstimate(selectedEngine, duration, generateAudio)}
                </span>
                {selectedEngine === "kling" && (
                  <div className="flex items-center gap-2">
                    <button
                      role="switch"
                      aria-checked={generateAudio}
                      onClick={() => setGenerateAudio((v) => !v)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${generateAudio ? "bg-primary" : "bg-secondary"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${generateAudio ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <span className="text-xs text-muted-foreground">
                      Generate Audio{" "}
                      <span className="text-amber-400/70">
                        Audio on adds ~$0.03/sec (~${(parseInt(duration) * 0.028).toFixed(2)} extra for {duration}s clip)
                      </span>
                    </span>
                  </div>
                )}
                {selectedEngine === "veo" && (
                  <span className="text-xs text-amber-400/70">
                    ⚠️ Veo charges $0.40/sec. A 4s clip = ~$1.60.
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {approvedScenes.map((scene) => {
        const isGenerating = generatingFor === scene.scene_number;
        const hasVideo = !!scene.video_url;
        const isApproved = scene.video_status === "approved";
        const actionText =
          actionOverrides[scene.scene_number] ?? scene.action_prompt ?? "";

        return (
          <Card
            key={scene.scene_number}
            className={`border overflow-hidden transition-all ${
              isApproved
                ? "border-green-500/30 bg-green-500/5"
                : "border-border/50 bg-card"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* Source image */}
              <div className="relative aspect-square md:aspect-auto bg-secondary/30">
                {scene.image_url ? (
                  <img
                    src={scene.image_url}
                    alt={scene.scene_title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-10 h-10 opacity-20" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                  <Badge className="bg-black/60 text-white text-xs w-fit">
                    Scene {scene.scene_number}
                  </Badge>
                  <Badge className="bg-black/60 text-white text-xs w-fit max-w-[120px] truncate">
                    {scene.scene_title}
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="col-span-2 p-5 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {scene.description}
                </p>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Action / Motion Prompt
                  </Label>
                  <Textarea
                    value={actionText}
                    onChange={(e) =>
                      setActionOverrides({
                        ...actionOverrides,
                        [scene.scene_number]: e.target.value,
                      })
                    }
                    placeholder="Describe the motion, camera movement, or visual effects..."
                    className="bg-secondary/50"
                    rows={3}
                    disabled={isApproved}
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isApproved && (
                    <Button
                      onClick={() => generateVideo(scene)}
                      disabled={isGenerating}
                      className={
                        hasVideo
                          ? "bg-secondary text-foreground hover:bg-secondary/80"
                          : "bg-primary hover:bg-primary/90"
                      }
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : hasVideo ? (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      ) : (
                        <Video className="w-4 h-4 mr-2" />
                      )}
                      {isGenerating
                        ? "Generating..."
                        : hasVideo
                        ? "Regenerate"
                        : "Generate Video"}
                    </Button>
                  )}

                  {hasVideo && !isApproved && (
                    <Button
                      size="sm"
                      onClick={() => approveVideo(scene)}
                      className="bg-green-500/90 hover:bg-green-500 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  )}

                  {isApproved && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400">
                        <Check className="w-3 h-3 mr-1" /> Approved
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rejectVideo(scene)}
                        className="text-muted-foreground hover:text-destructive text-xs"
                      >
                        Revise
                      </Button>
                    </div>
                  )}

                  {hasVideo && (
                    <button
                      onClick={() => downloadVideo(scene)}
                      disabled={downloadingFor === scene.scene_number}
                      className="inline-flex items-center gap-2 text-sm h-9 px-3 rounded-md border border-border bg-transparent hover:bg-secondary/50 disabled:opacity-50"
                    >
                      {downloadingFor === scene.scene_number ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloadingFor === scene.scene_number ? "Downloading..." : "Download"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Video player */}
            {hasVideo && (
              <div className="border-t border-border/50">
                <video
                  src={scene.video_url}
                  controls
                  className="w-full"
                  style={{ maxHeight: "360px", backgroundColor: "#000" }}
                />
              </div>
            )}

            {isGenerating && !hasVideo && (
              <div className="border-t border-border/50 flex items-center justify-center py-10 bg-secondary/20">
                <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  Generating video...
                </span>
              </div>
            )}
          </Card>
        );
      })}

      {scenes.some((s) => s.video_status === "approved" && s.video_url) && (
        <div className="flex justify-end pt-2">
          <button
            onClick={exportAll}
            disabled={exportProgress !== null}
            className="inline-flex items-center gap-2 text-sm h-10 px-4 rounded-md bg-[#C4BAA7] text-black hover:bg-[#C4BAA7]/80 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exportProgress
              ? `Downloading ${exportProgress.current} of ${exportProgress.total}...`
              : `Export All Videos (${scenes.filter((s) => s.video_status === "approved" && s.video_url).length} scenes)`}
          </button>
        </div>
      )}
    </div>
  );
}
