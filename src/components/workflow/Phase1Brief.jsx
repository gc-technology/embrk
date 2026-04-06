import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Prompt } from "@/entities/Prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Wand2, Check, X, Loader2, Trash2, Pencil } from "lucide-react";
import { PLATFORM_PRESETS, PROMPT_ENGINES } from "@/lib/platformPresets";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const WORKER_URL = 'https://embark-worker.gideonconcepts7.workers.dev';

const PROMPT_PRESETS = [
  {
    id: "product",
    label: "🛍️ Product Photography",
    text: "Clean studio lighting, professional product shot, sharp focus, minimal background, commercial quality",
  },
  {
    id: "ugc",
    label: "📱 UGC Style",
    text: "Authentic user-generated content style, casual natural lighting, lifestyle feel, shot on phone aesthetic, relatable and genuine",
  },
  {
    id: "editorial",
    label: "🎨 Editorial",
    text: "High fashion editorial style, dramatic lighting, artistic composition, magazine quality",
  },
  {
    id: "lifestyle",
    label: "🌿 Lifestyle",
    text: "Natural light, warm tones, aspirational lifestyle, candid feel, bright and airy",
  },
  {
    id: "cinematic",
    label: "🎬 Cinematic",
    text: "Cinematic color grading, dramatic shadows, wide angle, film quality, moody atmosphere",
  },
  {
    id: "bold",
    label: "⚡ Bold & Graphic",
    text: "Bold colors, high contrast, graphic design aesthetic, eye-catching, social media optimized",
  },
];

function parseImageList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export default function Phase1Brief({ project, prompts, onProjectUpdate }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingStyle, setUploadingStyle] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editAction, setEditAction] = useState("");
  const [activePresets, setActivePresets] = useState(new Set());
  const queryClient = useQueryClient();

  const [localFields, setLocalFields] = useState({
    title: project.title || "",
    description: project.description || "",
    goal: project.goal || "",
    style_notes: project.style_notes || "",
    aspect_ratio: project.aspect_ratio || "",
    resolution: project.resolution || "",
  });

  useEffect(() => {
    setLocalFields({
      title: project.title || "",
      description: project.description || "",
      goal: project.goal || "",
      style_notes: project.style_notes || "",
      aspect_ratio: project.aspect_ratio || "",
      resolution: project.resolution || "",
    });
  }, [project.id, project.aspect_ratio, project.resolution]);

  const handlePlatformChange = async (platform) => {
    const preset = PLATFORM_PRESETS[platform];
    await Project.update(project.id, {
      platform,
      aspect_ratio: preset.aspect_ratio,
      resolution: preset.resolution,
    });
    onProjectUpdate();
  };

  const handleFieldBlur = async (field) => {
    await Project.update(project.id, { [field]: localFields[field] });
    onProjectUpdate();
  };

  const handleFieldUpdate = async (field, value) => {
    await Project.update(project.id, { [field]: value });
    onProjectUpdate();
  };

  // --- Primary reference image (1 max) ---
  const handlePrimaryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPrimary(true);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${WORKER_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (data.url) {
      await Project.update(project.id, {
        reference_images: JSON.stringify([data.url]),
      });
      onProjectUpdate();
    }

    setUploadingPrimary(false);
    e.target.value = "";
  };

  const removePrimaryReference = async () => {
    await Project.update(project.id, { reference_images: JSON.stringify([]) });
    onProjectUpdate();
  };

  // --- Style reference images (up to 4) ---
  const handleStyleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const existing = parseImageList(project.style_references);
    const remaining = 4 - existing.length;
    if (remaining <= 0) return;

    setUploadingStyle(true);
    const urls = [];

    for (const file of files.slice(0, remaining)) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${WORKER_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }

    await Project.update(project.id, {
      style_references: JSON.stringify([...existing, ...urls]),
    });
    onProjectUpdate();
    setUploadingStyle(false);
    e.target.value = "";
  };

  const removeStyleReference = async (urlToRemove) => {
    const existing = parseImageList(project.style_references);
    const updated = existing.filter((u) => u !== urlToRemove);
    await Project.update(project.id, { style_references: JSON.stringify(updated) });
    onProjectUpdate();
  };

  // --- Preset chips ---
  const handlePresetClick = (preset) => {
    const next = new Set(activePresets);
    if (next.has(preset.id)) {
      next.delete(preset.id);
    } else {
      next.add(preset.id);
    }
    setActivePresets(next);

    const current = localFields.style_notes;
    const alreadyContains = current.includes(preset.text);

    if (!alreadyContains && !activePresets.has(preset.id)) {
      // Adding
      const updated = current ? `${current} ${preset.text}` : preset.text;
      setLocalFields((f) => ({ ...f, style_notes: updated }));
      Project.update(project.id, { style_notes: updated }).then(onProjectUpdate);
    }
  };

  // --- Prompt generation ---
  const generatePrompts = async () => {
    setIsGenerating(true);
    const preset = PLATFORM_PRESETS[project.platform] || {};
    const primaryImages = parseImageList(project.reference_images);
    const styleImages = parseImageList(project.style_references);

    const hasPrimary = primaryImages.length > 0;
    const hasStyle = styleImages.length > 0;

    const referenceNote = hasPrimary
      ? `\nReference Image: A primary reference image has been uploaded. Each prompt must instruct the AI image generator to use it as the main subject.`
      : "";

    const styleNote = hasStyle
      ? `\nStyle References: The user has uploaded style/mood reference images. Incorporate their visual style, color palette, and mood into each prompt.`
      : "";

    const userPrompt = `You are a creative director specializing in AI-generated visual content. Based on the following project brief, generate 3 distinct creative prompts for AI image generation. Each prompt should be detailed, vivid, and optimized for AI image generators.

Project Title: ${project.title}
Background: ${project.description || "Not specified"}
Goal/CTA: ${project.goal || "Not specified"}
Target Platform: ${preset.label || project.platform || "General"}
Aspect Ratio: ${project.aspect_ratio || "Not specified"}
Style Notes: ${project.style_notes || "Not specified"}${referenceNote}${styleNote}

For each prompt also provide a brief action prompt describing what motion would work best if turned into a short video.

Respond with ONLY a JSON object in this exact format, no other text:
{
  "prompts": [
    { "prompt_text": "...", "action_prompt": "..." },
    { "prompt_text": "...", "action_prompt": "..." },
    { "prompt_text": "...", "action_prompt": "..." }
  ]
}`;

    try {
      const response = await fetch(`${WORKER_URL}/api/generate-prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const generated = parsed.prompts || [];

      for (let i = 0; i < generated.length; i++) {
        await Prompt.create({
          project_id: project.id,
          prompt_text: generated[i].prompt_text,
          action_prompt: generated[i].action_prompt || "",
          status: "draft",
          order: i + 1,
          engine_used: "claude",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["prompts", project.id] });
    } catch (err) {
      console.error("Prompt generation failed:", err);
      alert("Prompt generation failed. Check worker deployment.");
    }

    setIsGenerating(false);
  };

  const approvePrompt = async (prompt) => {
    await Prompt.update(prompt.id, { status: "approved" });
    queryClient.invalidateQueries({ queryKey: ["prompts", project.id] });
  };

  const rejectPrompt = async (prompt) => {
    await Prompt.update(prompt.id, { status: "rejected" });
    queryClient.invalidateQueries({ queryKey: ["prompts", project.id] });
  };

  const deletePrompt = async (prompt) => {
    await Prompt.delete(prompt.id);
    queryClient.invalidateQueries({ queryKey: ["prompts", project.id] });
  };

  const startEdit = (prompt) => {
    setEditingPromptId(prompt.id);
    setEditText(prompt.prompt_text);
    setEditAction(prompt.action_prompt || "");
  };

  const saveEdit = async (prompt) => {
    await Prompt.update(prompt.id, {
      prompt_text: editText,
      action_prompt: editAction,
    });
    setEditingPromptId(null);
    queryClient.invalidateQueries({ queryKey: ["prompts", project.id] });
  };

  const approvedCount = prompts.filter((p) => p.status === "approved").length;
  const primaryImages = parseImageList(project.reference_images);
  const styleImages = parseImageList(project.style_references);
  const primaryImage = primaryImages[0] || null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Project Details */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input
                value={localFields.title}
                onChange={(e) => setLocalFields({ ...localFields, title: e.target.value })}
                onBlur={() => handleFieldBlur("title")}
                placeholder="Enter project title..."
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Background & Context</Label>
              <Textarea
                value={localFields.description}
                onChange={(e) => setLocalFields({ ...localFields, description: e.target.value })}
                onBlur={() => handleFieldBlur("description")}
                placeholder="Describe the project background..."
                className="bg-secondary/50 min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Goal / CTA</Label>
              <Textarea
                value={localFields.goal}
                onChange={(e) => setLocalFields({ ...localFields, goal: e.target.value })}
                onBlur={() => handleFieldBlur("goal")}
                placeholder="What's the intended call to action or goal?"
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Style Notes</Label>
              <Textarea
                value={localFields.style_notes}
                onChange={(e) => setLocalFields({ ...localFields, style_notes: e.target.value })}
                onBlur={() => handleFieldBlur("style_notes")}
                placeholder="Any specific style directions, mood, color palette..."
                className="bg-secondary/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right column: Platform + Reference Images */}
        <div className="space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Platform & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Platform</Label>
                <Select value={project.platform || ""} onValueChange={handlePlatformChange}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_PRESETS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.icon} {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Input
                    value={localFields.aspect_ratio}
                    onChange={(e) => setLocalFields({ ...localFields, aspect_ratio: e.target.value })}
                    onBlur={() => handleFieldBlur("aspect_ratio")}
                    placeholder="e.g. 16:9"
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Input
                    value={localFields.resolution}
                    onChange={(e) => setLocalFields({ ...localFields, resolution: e.target.value })}
                    onBlur={() => handleFieldBlur("resolution")}
                    placeholder="e.g. 1920x1080"
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prompt Engine</Label>
                <Select
                  value={project.prompt_engine || "claude"}
                  onValueChange={(v) => handleFieldUpdate("prompt_engine", v)}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_ENGINES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Primary Reference */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <div>
                <CardTitle className="text-lg">Primary Reference</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">The main subject or product to generate from</p>
              </div>
            </CardHeader>
            <CardContent>
              {primaryImage ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group aspect-video rounded-xl overflow-hidden border border-border/50"
                >
                  <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={removePrimaryReference}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
                  {uploadingPrimary ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">
                    {uploadingPrimary ? "Uploading..." : "Upload primary image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePrimaryUpload}
                    disabled={uploadingPrimary}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Style References */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <div>
                <CardTitle className="text-lg">Style & Color References</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Mood board, color palette, or style inspiration</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <AnimatePresence>
                  {styleImages.map((url) => (
                    <motion.div
                      key={url}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-border/50"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeStyleReference(url)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {styleImages.length < 4 && (
                <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
                  {uploadingStyle ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {uploadingStyle ? "Uploading..." : `Upload style images (${styleImages.length}/4)`}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleStyleUpload}
                    disabled={uploadingStyle}
                  />
                </label>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated Prompts */}
      <Card className="bg-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Generated Prompts</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {approvedCount} approved · {prompts.length} total
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Prompt Presets */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Prompt Presets</Label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {PROMPT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset)}
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                    activePresets.has(preset.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={generatePrompts} disabled={isGenerating} className="bg-primary hover:bg-primary/90">
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              {isGenerating ? "Generating..." : "Generate Prompts"}
            </Button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {prompts.map((prompt) => (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/50"
                >
                  {editingPromptId === prompt.id ? (
                    <div className="space-y-3">
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="bg-secondary/50 min-h-[80px]" />
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Action Prompt (for video)</Label>
                        <Textarea value={editAction} onChange={(e) => setEditAction(e.target.value)} className="bg-secondary/50" rows={2} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(prompt)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingPromptId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={prompt.status === "approved" ? "default" : "secondary"}
                            className={
                              prompt.status === "approved"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : prompt.status === "rejected"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : ""
                            }
                          >
                            {prompt.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">via {prompt.engine_used || "AI"}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{prompt.prompt_text}</p>
                        {prompt.action_prompt && (
                          <p className="text-xs text-muted-foreground mt-2 italic">🎬 {prompt.action_prompt}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(prompt)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {prompt.status !== "approved" && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:bg-green-500/10" onClick={() => approvePrompt(prompt)}>
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {prompt.status !== "rejected" && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => rejectPrompt(prompt)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deletePrompt(prompt)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {prompts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Wand2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No prompts yet. Fill in project details and generate prompts.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
