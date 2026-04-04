import React, { useState } from "react";
import { GeneratedVideo } from "@/entities/GeneratedVideo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Video, Loader2, Check, Trash2 } from "lucide-react";
import { VIDEO_ENGINES } from "@/lib/platformPresets";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const WORKER_URL = 'https://embark-worker.gideonconcepts7.workers.dev';

const ENGINE_DURATIONS = {
  kling: [
    { value: '5', label: '5 seconds' },
    { value: '10', label: '10 seconds' },
    { value: '15', label: '15 seconds' },
    { value: '30', label: '30 seconds' },
  ],
  veo: [
    { value: '4', label: '4 seconds' },
    { value: '6', label: '6 seconds' },
    { value: '8', label: '8 seconds' },
  ],
};

export default function Phase3Video({ project, prompts, images, videos }) {
  const [selectedEngine, setSelectedEngine] = useState("kling");
  const [duration, setDuration] = useState("5");
  const [actionOverrides, setActionOverrides] = useState({});
  const [generatingFor, setGeneratingFor] = useState(null);
  const queryClient = useQueryClient();

  const approvedImages = images.filter((img) => img.status === "approved");

  const getPromptForImage = (img) => prompts.find((p) => p.id === img.prompt_id);
  const getVideosForImage = (imageId) => videos.filter((v) => v.image_id === imageId);

  const handleEngineChange = (engine) => {
    setSelectedEngine(engine);
    const durations = ENGINE_DURATIONS[engine] || ENGINE_DURATIONS.kling;
    setDuration(durations[0].value);
  };

  const generateVideo = async (image) => {
    setGeneratingFor(image.id);
    const prompt = getPromptForImage(image);
    const actionPrompt = actionOverrides[image.id] || prompt?.action_prompt || '';

    try {
      const genRes = await fetch(`${WORKER_URL}/api/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: image.image_url,
          action_prompt: actionPrompt,
          engine: selectedEngine,
          duration: parseInt(duration),
        }),
      });

      const genData = await genRes.json();

      await GeneratedVideo.create({
        project_id: project.id,
        image_id: image.id,
        prompt_id: prompt?.id || '',
        engine: selectedEngine,
        duration: parseInt(duration),
        status: genData.video_url ? 'generated' : 'generating',
        action_prompt: actionPrompt,
        video_url: genData.video_url || '',
      });

    } catch (err) {
      console.error('Video generation error:', err);
    }

    queryClient.invalidateQueries({ queryKey: ["videos", project.id] });
    setGeneratingFor(null);
  };

  const updateVideoStatus = async (video, status) => {
    await GeneratedVideo.update(video.id, { status });
    queryClient.invalidateQueries({ queryKey: ["videos", project.id] });
  };

  const deleteVideo = async (video) => {
    await GeneratedVideo.delete(video.id);
    queryClient.invalidateQueries({ queryKey: ["videos", project.id] });
  };

  const currentDurations = ENGINE_DURATIONS[selectedEngine] || ENGINE_DURATIONS.kling;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold">Video Generation</h3>
              <p className="text-sm text-muted-foreground">
                {approvedImages.length} approved images ready for video
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedEngine} onValueChange={handleEngineChange}>
                <SelectTrigger className="w-40 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_ENGINES.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
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
          </div>
        </CardContent>
      </Card>

      {approvedImages.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No approved images yet.</p>
          <p className="text-sm mt-1">Go back to Phase 2 to approve images first.</p>
        </div>
      )}

      {approvedImages.map((image) => {
        const prompt = getPromptForImage(image);
        const imageVideos = getVideosForImage(image.id);
        const actionText = actionOverrides[image.id] ?? (prompt?.action_prompt || '');

        return (
          <Card key={image.id} className="bg-card border-border/50 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* Source Image */}
              <div className="relative aspect-square md:aspect-auto bg-secondary/30">
                {image.image_url ? (
                  <img src={image.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-10 h-10 opacity-20" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-black/60 text-white text-xs">Source</Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="col-span-2 p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Action / Motion Prompt
                  </Label>
                  <Textarea
                    value={actionText}
                    onChange={(e) => setActionOverrides({ ...actionOverrides, [image.id]: e.target.value })}
                    placeholder="Describe the motion, camera movement, or visual effects..."
                    className="bg-secondary/50"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => generateVideo(image)}
                  disabled={generatingFor === image.id}
                  className="bg-primary hover:bg-primary/90"
                >
                  {generatingFor === image.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4 mr-2" />
                  )}
                  {generatingFor === image.id ? "Generating..." : "Generate Video"}
                </Button>
              </div>
            </div>

            {/* Generated Videos — full width below */}
            <AnimatePresence>
              {imageVideos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border/50 p-5 space-y-4"
                >
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Generated Videos
                  </Label>
                  {imageVideos.map((vid) => (
                    <motion.div
                      key={vid.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-secondary/30 rounded-xl border border-border/50 overflow-hidden"
                    >
                      {/* Video Player */}
                      {vid.video_url ? (
                        <video
                          src={vid.video_url}
                          controls
                          className="w-full rounded-t-xl"
                          style={{ maxHeight: '400px', backgroundColor: '#000' }}
                        />
                      ) : (
                        <div className="flex items-center justify-center py-12 bg-secondary/20">
                          <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Generating video...</span>
                        </div>
                      )}

                      {/* Video Controls */}
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              vid.status === "approved"
                                ? "bg-green-500/20 text-green-400"
                                : vid.status === "generating"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : ""
                            }
                          >
                            {vid.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {vid.engine?.toUpperCase()} · {vid.duration}s
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {vid.status !== "approved" && vid.status !== "generating" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-400 hover:bg-green-500/10"
                              onClick={() => updateVideoStatus(vid, "approved")}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteVideo(vid)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}