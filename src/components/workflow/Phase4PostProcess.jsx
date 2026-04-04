import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Type, Palette, Music, Download, Loader2, CheckCircle2, Sparkles, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { VOICEOVER_ENGINES } from "@/lib/platformPresets";

const WORKER_URL = 'https://embark-worker.gideonconcepts7.workers.dev';

export default function Phase4PostProcess({ project, images, videos }) {
  const [features, setFeatures] = useState({
    voiceover: false,
    captions: false,
    colorGrading: false,
    bgMusic: false,
  });
  const [voiceoverText, setVoiceoverText] = useState("");
  const [selectedVoiceEngine, setSelectedVoiceEngine] = useState("elevenlabs");
  const [selectedVoice, setSelectedVoice] = useState("Rachel");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const approvedImages = images.filter((img) => img.status === "approved");
  const approvedVideos = videos.filter((v) => v.status === "approved");

  const toggleFeature = (key) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentEngine = VOICEOVER_ENGINES.find(e => e.id === selectedVoiceEngine);

  const handleEngineChange = (engine) => {
    setSelectedVoiceEngine(engine);
    const eng = VOICEOVER_ENGINES.find(e => e.id === engine);
    if (eng) setSelectedVoice(eng.voices[0].id);
    setGeneratedAudioUrl("");
  };

  const generateVoiceover = async () => {
    if (!voiceoverText.trim()) return;
    setIsGeneratingVoice(true);
    setGeneratedAudioUrl("");

    try {
      const res = await fetch(`${WORKER_URL}/api/generate-voiceover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voiceoverText,
          engine: selectedVoiceEngine,
          voice_id: selectedVoice,
        }),
      });

      const data = await res.json();
      if (data.audio_url) {
        setGeneratedAudioUrl(data.audio_url);
      } else {
        alert('Voiceover generation failed. Check console for details.');
      }
    } catch (err) {
      console.error('Voiceover error:', err);
      alert('Voiceover generation failed.');
    }

    setIsGeneratingVoice(false);
  };

  const togglePlayback = () => {
    if (!generatedAudioUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(generatedAudioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
  };

  const featureList = [
    { key: "voiceover", label: "AI Voiceover", description: "Generate a voiceover from text", icon: Mic },
    { key: "captions", label: "Auto Captions", description: "Generate and overlay captions", icon: Type },
    { key: "colorGrading", label: "Color Grading", description: "Apply cinematic color grading", icon: Palette },
    { key: "bgMusic", label: "Background Music", description: "Add AI-generated background music", icon: Music },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Project Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/30 text-center">
              <p className="text-2xl font-bold text-primary">{approvedImages.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Approved Images</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 text-center">
              <p className="text-2xl font-bold text-accent">{approvedVideos.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Approved Videos</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 text-center">
              <p className="text-2xl font-bold">{project.platform || "—"}</p>
              <p className="text-sm text-muted-foreground mt-1">Platform</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 text-center">
              <p className="text-2xl font-bold">{project.aspect_ratio || "—"}</p>
              <p className="text-sm text-muted-foreground mt-1">Aspect Ratio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Final Assets Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {approvedImages.map((img) => (
              <motion.div
                key={img.id}
                whileHover={{ scale: 1.02 }}
                className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-secondary/30"
              >
                {img.image_url ? (
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-green-500/90 text-white text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                </div>
              </motion.div>
            ))}
            {approvedImages.length === 0 && (
              <div className="col-span-4 text-center py-8 text-muted-foreground text-sm">
                No approved assets yet. Complete previous phases first.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Post-Processing Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureList.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.key}>
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{feature.label}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={features[feature.key]}
                    onCheckedChange={() => toggleFeature(feature.key)}
                  />
                </div>

                {feature.key === 'voiceover' && features.voiceover && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 ml-4 space-y-4 p-4 bg-secondary/20 rounded-xl border border-border/30"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Voice Engine</Label>
                        <Select value={selectedVoiceEngine} onValueChange={handleEngineChange}>
                          <SelectTrigger className="bg-secondary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VOICEOVER_ENGINES.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Voice</Label>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                          <SelectTrigger className="bg-secondary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentEngine?.voices.map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Voiceover Script</Label>
                      <Textarea
                        value={voiceoverText}
                        onChange={(e) => setVoiceoverText(e.target.value)}
                        placeholder="Enter the text to be spoken as a voiceover..."
                        className="bg-secondary/50 min-h-[100px]"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={generateVoiceover}
                        disabled={isGeneratingVoice || !voiceoverText.trim()}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isGeneratingVoice ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Mic className="w-4 h-4 mr-2" />
                        )}
                        {isGeneratingVoice ? "Generating..." : "Generate Voiceover"}
                      </Button>

                      {generatedAudioUrl && (
                        <Button
                          variant="outline"
                          onClick={togglePlayback}
                          className="gap-2"
                        >
                          {isPlaying ? (
                            <><Pause className="w-4 h-4" /> Pause</>
                          ) : (
                            <><Play className="w-4 h-4" /> Play</>
                          )}
                        </Button>
                      )}

                      {generatedAudioUrl && (
                        <button
                          onClick={() => window.open(generatedAudioUrl, '_blank')}
                          className="text-sm text-primary hover:underline"
                        >
                          Download
                        </button>
                      )}
                    </div>

                    {generatedAudioUrl && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm text-green-400">Voiceover generated successfully!</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          {Object.values(features).filter(Boolean).length} features enabled
        </div>
        <div className="flex gap-3">
          <Button variant="outline" disabled={approvedImages.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Assets
          </Button>
          <Button
            onClick={handleProcess}
            disabled={isProcessing || Object.values(features).every((v) => !v)}
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? "Processing..." : "Apply Post-Processing"}
          </Button>
        </div>
      </div>
    </div>
  );
}