export const PLATFORM_PRESETS = {
  tiktok: { label: "TikTok", aspect_ratio: "9:16", resolution: "1080x1920", icon: "📱" },
  youtube_shorts: { label: "YouTube Shorts", aspect_ratio: "9:16", resolution: "1080x1920", icon: "▶️" },
  instagram_reels: { label: "Instagram Reels", aspect_ratio: "9:16", resolution: "1080x1920", icon: "🎬" },
  instagram_post: { label: "Instagram Post", aspect_ratio: "1:1", resolution: "1080x1080", icon: "📸" },
  instagram_story: { label: "Instagram Story", aspect_ratio: "9:16", resolution: "1080x1920", icon: "📖" },
  youtube_thumbnail: { label: "YouTube Thumbnail", aspect_ratio: "16:9", resolution: "1280x720", icon: "🖼️" },
  facebook: { label: "Facebook", aspect_ratio: "16:9", resolution: "1200x630", icon: "👤" },
  twitter: { label: "Twitter/X", aspect_ratio: "16:9", resolution: "1200x675", icon: "🐦" },
  linkedin: { label: "LinkedIn", aspect_ratio: "1.91:1", resolution: "1200x627", icon: "💼" },
  custom: { label: "Custom", aspect_ratio: "", resolution: "", icon: "⚙️" },
};

export const IMAGE_ENGINES = [
  { id: "nanobanana", label: "NanoBanana", available: true, mode: "auto", provider: "fal" },
  { id: "ideogram", label: "Ideogram V3", available: true, mode: "auto", provider: "fal" },
  { id: "flux", label: "Flux Pro 1.1", available: true, mode: "auto", provider: "fal" },
  { id: "minimax", label: "Minimax Image", available: true, mode: "auto", provider: "fal" },
];

export const VIDEO_ENGINES = [
  { id: "kling", label: "Kling", available: true, provider: "fal" },
  { id: "veo", label: "Veo 3.1", available: true, provider: "fal" },
];

export const PROMPT_ENGINES = [
  { id: "claude", label: "Claude", model: "claude-sonnet-4-5" },
  { id: "gemini", label: "Google Gemini", model: "gemini_3_flash" },
];

export const VOICEOVER_ENGINES = [
  { 
    id: 'elevenlabs', 
    label: 'ElevenLabs', 
    voices: [
      { id: 'Rachel', label: 'Rachel (Female)' },
      { id: 'Adam', label: 'Adam (Male)' },
      { id: 'Domi', label: 'Domi (Female)' },
      { id: 'Elli', label: 'Elli (Female)' },
      { id: 'Josh', label: 'Josh (Male)' },
      { id: 'Arnold', label: 'Arnold (Male)' },
    ]
  },
  { 
    id: 'minimax', 
    label: 'Minimax TTS',
    voices: [
      { id: 'Wise_Woman', label: 'Wise Woman' },
      { id: 'Friendly_Person', label: 'Friendly Person' },
      { id: 'Inspirational_girl', label: 'Inspirational Girl' },
      { id: 'Deep_Voice_Man', label: 'Deep Voice Man' },
      { id: 'Calm_Woman', label: 'Calm Woman' },
      { id: 'Casual_Guy', label: 'Casual Guy' },
    ]
  },
];