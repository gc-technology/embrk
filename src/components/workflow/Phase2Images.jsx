import React, { useState } from "react";
import { GeneratedImage } from "@/entities/GeneratedImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Loader2, Check, X, Trash2, RefreshCw, Download } from "lucide-react";
import { IMAGE_ENGINES } from "@/lib/platformPresets";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const WORKER_URL = 'https://embark-worker.gideonconcepts7.workers.dev';

export default function Phase2Images({ project, prompts, images }) {
  const [selectedEngine, setSelectedEngine] = useState("nanobanana");
  const [generateMode, setGenerateMode] = useState("lite");
  const [generatingFor, setGeneratingFor] = useState(null);
  const queryClient = useQueryClient();

  const approvedPrompts = prompts.filter((p) => p.status === "approved");

  const getReferenceImages = () => {
    if (!project.reference_images) return [];
    if (Array.isArray(project.reference_images)) return project.reference_images;
    try { return JSON.parse(project.reference_images); } catch { return []; }
  };

  const generateImages = async (prompt) => {
    setGeneratingFor(prompt.id);

    const referenceImages = getReferenceImages();
    const referenceImageUrl = referenceImages.length > 0 ? referenceImages[0] : null;
    const variationCount = generateMode === "lite" ? 1 : 3;

    const allVariations = [
      prompt.prompt_text,
      `${prompt.prompt_text} Use a slightly different composition and angle.`,
      `${prompt.prompt_text} Use a different color palette and mood.`,
    ];

    const variations = allVariations.slice(0, variationCount);

    for (let i = 0; i < variations.length; i++) {
      try {
        const genRes = await fetch(`${WORKER_URL}/api/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: variations[i],
            aspect_ratio: project.aspect_ratio || '16:9',
            engine: selectedEngine,
            reference_image_url: referenceImageUrl,
          }),
        });

        const genData = await genRes.json();

        await GeneratedImage.create({
          project_id: project.id,
          prompt_id: prompt.id,
          image_url: genData.image_url || '',
          engine: selectedEngine,
          status: 'generated',
          variation_index: i + 1,
        });
      } catch (err) {
        console.error(`Image generation error variation ${i + 1}:`, err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["images", project.id] });
    setGeneratingFor(null);
  };

  const updateImageStatus = async (image, status) => {
    await GeneratedImage.update(image.id, { status });
    queryClient.invalidateQueries({ queryKey: ["images", project.id] });
  };

  const deleteImage = async (image) => {
    await GeneratedImage.delete(image.id);
    queryClient.invalidateQueries({ queryKey: ["images", project.id] });
  };

  const getImagesForPrompt = (promptId) =>
    images.filter((img) => img.prompt_id === promptId);

  const approvedImages = images.filter((img) => img.status === "approved");
  const referenceImages = getReferenceImages();

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold">Image Engine</h3>
              <p className="text-sm text-muted-foreground">
                {approvedImages.length} images approved across {approvedPrompts.length} prompts
              </p>
              {referenceImages.length > 0 && (
                <p className="text-xs text-primary mt-1">
                  ✓ Reference image detected — using image-to-image mode
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                <button
                  onClick={() => setGenerateMode("lite")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    generateMode === "lite"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Lite (1)
                </button>
                <button
                  onClick={() => setGenerateMode("full")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    generateMode === "full"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Full (3)
                </button>
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
          </div>
        </CardContent>
      </Card>

      {referenceImages.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img
                src={referenceImages[0]}
                alt="Reference"
                className="w-16 h-16 rounded-lg object-cover border border-border/50"
              />
              <div>
                <p className="text-sm font-medium text-primary">Reference image active</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  NanoBanana and Flux will use this as a visual reference
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {approvedPrompts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No approved prompts yet.</p>
          <p className="text-sm mt-1">Go back to Phase 1 to approve some prompts first.</p>
        </div>
      )}

      {approvedPrompts.map((prompt) => {
        const promptImages = getImagesForPrompt(prompt.id);
        return (
          <Card key={prompt.id} className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed line-clamp-2">{prompt.prompt_text}</p>
                {prompt.action_prompt && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    🎬 {prompt.action_prompt}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => generateImages(prompt)}
                disabled={generatingFor === prompt.id}
                className="shrink-0"
              >
                {generatingFor === prompt.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : promptImages.length > 0 ? (
                  <RefreshCw className="w-4 h-4 mr-2" />
                ) : (
                  <ImageIcon className="w-4 h-4 mr-2" />
                )}
                {generatingFor === prompt.id
                  ? "Generating..."
                  : promptImages.length > 0
                  ? "Regenerate"
                  : `Generate ${generateMode === "lite" ? "1 Image" : "3 Images"}`}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AnimatePresence>
                  {promptImages.map((img) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden border border-border/50 bg-secondary/30 flex items-center justify-center">
                        {img.image_url ? (
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-muted-foreground text-xs p-4">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            No image yet
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className={
                          img.status === "approved"
                            ? "bg-green-500/90 text-white"
                            : img.status === "rejected"
                            ? "bg-red-500/90 text-white"
                            : "bg-black/60 text-white"
                        }>
                          {img.status}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {img.status !== "approved" && (
                          <Button
                            size="icon"
                            className="h-8 w-8 bg-green-500/90 hover:bg-green-500 text-white"
                            onClick={() => updateImageStatus(img, "approved")}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {img.status !== "rejected" && (
                          <Button
                            size="icon"
                            className="h-8 w-8 bg-red-500/90 hover:bg-red-500 text-white"
                            onClick={() => updateImageStatus(img, "rejected")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {img.image_url && (
                          <Button
                            size="icon"
                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white"
                            onClick={() => window.open(img.image_url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => deleteImage(img)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {promptImages.length === 0 && !generatingFor && (
                  <div className="col-span-3 text-center py-8 text-muted-foreground text-sm">
                    Click generate to create image{generateMode === "lite" ? "" : " variations"}
                  </div>
                )}
                {generatingFor === prompt.id && (
                  <div className="col-span-3 flex items-center justify-center py-8 gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">
                      Generating {generateMode === "lite" ? "1 image" : "3 variations"} via {selectedEngine}
                      {referenceImages.length > 0 ? " (image-to-image)" : " (text-to-image)"}...
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}