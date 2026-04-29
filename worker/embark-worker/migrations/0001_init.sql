-- Embark admin schema
-- wrangler 4.x: defaults to local. Use --remote for production.
-- Run locally:     wrangler d1 migrations apply embark-db
-- Run production:  wrangler d1 migrations apply embark-db --remote

CREATE TABLE IF NOT EXISTS modes (
  id       TEXT PRIMARY KEY,
  slug     TEXT UNIQUE NOT NULL,
  name     TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id      TEXT PRIMARY KEY,
  mode_id TEXT NOT NULL,
  slug    TEXT NOT NULL,
  name    TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (mode_id) REFERENCES modes(id) ON DELETE CASCADE,
  UNIQUE(mode_id, slug)
);

CREATE TABLE IF NOT EXISTS prompt_fragments (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL DEFAULT '',
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flavors (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Seed modes ────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO modes (id, slug, name, position) VALUES
  ('mode-technical', 'technical', 'Technical', 1),
  ('mode-marketing', 'marketing', 'Marketing',  2);

-- ── Seed categories ───────────────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (id, mode_id, slug, name, position) VALUES
  ('cat-logo',          'mode-technical', 'logo',                 'Logo',                          1),
  ('cat-product-photo', 'mode-technical', 'product-photography',  'Product Photography',           2),
  ('cat-industrial',    'mode-technical', 'industrial',           'Industrial / Conceptualization', 3),
  ('cat-promotional',   'mode-marketing', 'promotional',          'Promotional Content',           1),
  ('cat-ugc',           'mode-marketing', 'ugc',                  'User Generated Content',        2);

-- ── Seed prompt fragments ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO prompt_fragments (id, category_id, system_prompt, updated_at) VALUES
  ('frag-logo', 'cat-logo',
   'You are a creative director specializing in brand identity and logo design.
When generating image prompts, emphasize: geometric precision, negative space, scalable mark systems, typographic harmony, and timeless symbolism. Prompts should guide AI image generators toward clean, vector-suitable concepts with strong silhouette readability. Avoid photographic realism — favor bold, structured forms.',
   CURRENT_TIMESTAMP),

  ('frag-product-photo', 'cat-product-photo',
   'You are a creative director specializing in high-end commercial product photography.
When generating image prompts, emphasize: controlled studio or environmental lighting setups, precise surface texture rendering, deliberate composition and lens choice (macro, tilt-shift, wide aperture bokeh), color accuracy, and hero-product framing. Each prompt should specify light source direction, shadow quality, and background treatment.',
   CURRENT_TIMESTAMP),

  ('frag-industrial', 'cat-industrial',
   'You are a creative director specializing in industrial design visualization and conceptualization.
When generating image prompts, emphasize: engineering aesthetics, material honesty (metal, polymer, glass), functional form language, section views or exploded perspectives where appropriate, and the interplay between utility and visual sophistication.',
   CURRENT_TIMESTAMP),

  ('frag-promotional', 'cat-promotional',
   'You are a creative director specializing in performance-driven promotional content.
When generating image prompts, emphasize: immediate visual hook, audience-resonant scenarios, platform-native compositions (scroll-stopping first frame), clear focal hierarchy that supports a CTA, and brand color/energy integration.',
   CURRENT_TIMESTAMP),

  ('frag-ugc', 'cat-ugc',
   'You are a creative director specializing in authentic user-generated content (UGC) style visuals.
When generating image prompts, emphasize: natural handheld framing, imperfect-but-intentional lighting, real-person relatability, lifestyle context that matches the product daily-use scenario, and the lo-fi aesthetic that drives trust and conversion. Avoid studio polish.',
   CURRENT_TIMESTAMP);

-- ── Seed flavors ──────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO flavors (id, slug, name, description, position) VALUES
  ('flav-literal',     'literal',     'Literal',     'Faithful, clear depiction of the brief',                  1),
  ('flav-stylized',    'stylized',    'Stylized',    'Visually distinctive with strong artistic choices',       2),
  ('flav-abstract',    'abstract',    'Abstract',    'Conceptual, non-literal representation',                  3),
  ('flav-conceptual',  'conceptual',  'Conceptual',  'Idea-driven, metaphorical interpretation',               4);
