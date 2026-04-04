CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  platform TEXT,
  aspect_ratio TEXT,
  resolution TEXT,
  style_notes TEXT,
  reference_images TEXT,
  current_phase INTEGER DEFAULT 1,
  prompt_engine TEXT DEFAULT 'claude',
  status TEXT DEFAULT 'draft',
  created_date TEXT
);

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  action_prompt TEXT,
  status TEXT DEFAULT 'draft',
  "order" INTEGER DEFAULT 0,
  engine_used TEXT,
  created_date TEXT
);

CREATE TABLE IF NOT EXISTS generated_images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  prompt_id TEXT,
  image_url TEXT,
  engine TEXT,
  status TEXT DEFAULT 'generated',
  variation_index INTEGER DEFAULT 1,
  created_date TEXT
);

CREATE TABLE IF NOT EXISTS generated_videos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  image_id TEXT,
  prompt_id TEXT,
  video_url TEXT,
  engine TEXT,
  duration INTEGER DEFAULT 5,
  status TEXT DEFAULT 'generating',
  action_prompt TEXT,
  created_date TEXT
);