const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const FAL_ENDPOINTS: Record<string, { text: string; image: string; reframe?: string }> = {
  nanobanana: {
    text: 'fal-ai/nano-banana-2',
    image: 'fal-ai/nano-banana-2/edit',
  },
ideogram: {
  text: 'fal-ai/ideogram/v3',
  image: 'fal-ai/ideogram/v3',
},
  flux: {
    text: 'fal-ai/flux-pro/v1.1',
    image: 'fal-ai/flux-2-pro/edit',
  },
  minimax: {
  text: 'fal-ai/minimax/image-01',
  image: 'fal-ai/minimax/image-01',
  },
};

const VIDEO_ENDPOINTS: Record<string, string> = {
  kling: 'fal-ai/kling-video/v2.1/standard/image-to-video',
  veo: 'fal-ai/veo3.1/image-to-video',
};

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === '/') {
      return json({ status: 'EMBARK Worker running' });
    }

    // ─── IMAGE GENERATION ───────────────────────────────────
    if (url.pathname === '/api/generate-image' && method === 'POST') {
      const body = await request.json() as any;
      const engine = body.engine || 'nanobanana';
      const hasReferenceImage = body.reference_image_url && body.reference_image_url.length > 0;
      const endpoints = FAL_ENDPOINTS[engine] || FAL_ENDPOINTS.nanobanana;
      const endpoint = hasReferenceImage ? endpoints.image : endpoints.text;

      const imageSize = body.aspect_ratio === '9:16' ? 'portrait_16_9' :
                        body.aspect_ratio === '1:1' ? 'square' :
                        body.aspect_ratio === '4:5' ? 'portrait_4_5' : 'landscape_16_9';

      const falBody: any = {
        prompt: body.prompt,
        image_size: imageSize,
        num_images: 1,
      };

      if (hasReferenceImage) {
        // Different engines use different parameter names
        if (engine === 'nanobanana') {
          falBody.image_urls = [body.reference_image_url];
        } else if (engine === 'ideogram') {
		// Uses text-to-image only
		} else if (engine === 'flux') {
          falBody.image_urls = [body.reference_image_url];
       } else if (engine === 'minimax') {
		// Minimax subject-reference is for person consistency
		// Using text-to-image for product shots
		}
      }

      console.log(`Calling: ${endpoint}, hasRef: ${hasReferenceImage}, body: ${JSON.stringify(falBody)}`);

      const response = await fetch(`https://fal.run/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${env.FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(falBody),
      });

      const result = await response.json() as any;
      console.log('FAL RESULT:', JSON.stringify(result));

      const imageUrl = result.images?.[0]?.url || result.image?.url || '';
      return json({ image_url: imageUrl, mode: hasReferenceImage ? 'image-to-image' : 'text-to-image', endpoint });
    }

    // ─── VIDEO GENERATION ───────────────────────────────────
    if (url.pathname === '/api/generate-video' && method === 'POST') {
      const body = await request.json() as any;
      const engine = body.engine || 'kling';
      const endpoint = VIDEO_ENDPOINTS[engine] || VIDEO_ENDPOINTS.kling;

      const falBody: any = {
        prompt: body.action_prompt || '',
      };

      if (engine === 'kling') {
        falBody.image_url = body.image_url;
        falBody.duration = String(body.duration || 5);
      } else if (engine === 'veo') {
        falBody.image_url = body.image_url;
        falBody.duration = body.duration ? `${body.duration}s` : '8s';
      }

      const response = await fetch(`https://fal.run/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${env.FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(falBody),
      });

      const result = await response.json() as any;
      console.log('VIDEO RESULT:', JSON.stringify(result));

      const videoUrl = result.video?.url || result.video_url || '';
      return json({ video_url: videoUrl });
    }

    // ─── VOICEOVER GENERATION ───────────────────────────────
    if (url.pathname === '/api/generate-voiceover' && method === 'POST') {
      const body = await request.json() as any;
      const engine = body.engine || 'elevenlabs';

      let endpoint = '';
      let falBody: any = {};

      if (engine === 'elevenlabs') {
        endpoint = 'fal-ai/elevenlabs/tts/multilingual-v2';
        falBody = {
          text: body.text,
          voice_id: body.voice_id || 'Rachel',
        };
      } else if (engine === 'minimax') {
        endpoint = 'fal-ai/minimax/speech-02-hd';
        falBody = {
          text: body.text,
          voice_id: body.voice_id || 'Wise_Woman',
        };
      }

      const response = await fetch(`https://fal.run/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${env.FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(falBody),
      });

      const result = await response.json() as any;
      console.log('VOICEOVER RESULT:', JSON.stringify(result));
      const audioUrl = result.audio?.url || result.audio_url || '';
      return json({ audio_url: audioUrl });
    }

    // ─── FILE UPLOAD TO R2 ──────────────────────────────────
    if (url.pathname === '/api/upload' && method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return json({ error: 'No file provided' }, 400);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `uploads/${crypto.randomUUID()}.${fileExt}`;
      const fileBuffer = await file.arrayBuffer();

      await env.embark_assets.put(fileName, fileBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
      });

      const publicUrl = `https://pub-a71dd0083195419690b0497d3e902083.r2.dev/${fileName}`;
      return json({ url: publicUrl });
    }

    // ─── PROJECTS ───────────────────────────────────────────
    if (url.pathname === '/api/projects' && method === 'GET') {
      const { results } = await env.embark_db.prepare(
        'SELECT * FROM projects ORDER BY created_date DESC'
      ).all();
      return json(results);
    }

    if (url.pathname === '/api/projects' && method === 'POST') {
      const body = await request.json() as any;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.embark_db.prepare(
        `INSERT INTO projects (id, title, description, goal, platform, aspect_ratio, resolution, style_notes, current_phase, prompt_engine, status, created_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, body.title, body.description || '', body.goal || '', body.platform || '', body.aspect_ratio || '', body.resolution || '', body.style_notes || '', body.current_phase || 1, body.prompt_engine || 'claude', body.status || 'draft', now).run();
      return json({ id, ...body, created_date: now });
    }

    if (url.pathname.startsWith('/api/projects/') && method === 'GET') {
      const id = url.pathname.split('/api/projects/')[1];
      const project = await env.embark_db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
      if (!project) return json({ error: 'Not found' }, 404);
      return json(project);
    }

    if (url.pathname.startsWith('/api/projects/') && method === 'PUT') {
      const id = url.pathname.split('/api/projects/')[1];
      const body = await request.json() as any;
      const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
      const values = Object.values(body);
      await env.embark_db.prepare(`UPDATE projects SET ${fields} WHERE id = ?`).bind(...values, id).run();
      return json({ id, ...body });
    }

    if (url.pathname.startsWith('/api/projects/') && method === 'DELETE') {
      const id = url.pathname.split('/api/projects/')[1];
      await env.embark_db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ─── PROMPTS ────────────────────────────────────────────
    if (url.pathname === '/api/prompts' && method === 'GET') {
      const projectId = url.searchParams.get('project_id');
      const { results } = await env.embark_db.prepare(
        'SELECT * FROM prompts WHERE project_id = ? ORDER BY "order" ASC'
      ).bind(projectId).all();
      return json(results);
    }

    if (url.pathname === '/api/prompts' && method === 'POST') {
      const body = await request.json() as any;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.embark_db.prepare(
        `INSERT INTO prompts (id, project_id, prompt_text, action_prompt, status, "order", engine_used, created_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, body.project_id, body.prompt_text, body.action_prompt || '', body.status || 'draft', body.order || 0, body.engine_used || 'claude', now).run();
      return json({ id, ...body, created_date: now });
    }

    if (url.pathname.startsWith('/api/prompts/') && method === 'PUT') {
      const id = url.pathname.split('/api/prompts/')[1];
      const body = await request.json() as any;
      const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
      const values = Object.values(body);
      await env.embark_db.prepare(`UPDATE prompts SET ${fields} WHERE id = ?`).bind(...values, id).run();
      return json({ id, ...body });
    }

    if (url.pathname.startsWith('/api/prompts/') && method === 'DELETE') {
      const id = url.pathname.split('/api/prompts/')[1];
      await env.embark_db.prepare('DELETE FROM prompts WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ─── IMAGES ─────────────────────────────────────────────
    if (url.pathname === '/api/images' && method === 'GET') {
      const projectId = url.searchParams.get('project_id');
      const { results } = await env.embark_db.prepare(
        'SELECT * FROM generated_images WHERE project_id = ?'
      ).bind(projectId).all();
      return json(results);
    }

    if (url.pathname === '/api/images' && method === 'POST') {
      const body = await request.json() as any;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.embark_db.prepare(
        `INSERT INTO generated_images (id, project_id, prompt_id, image_url, engine, status, variation_index, created_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, body.project_id, body.prompt_id, body.image_url || '', body.engine || '', body.status || 'generated', body.variation_index || 1, now).run();
      return json({ id, ...body, created_date: now });
    }

    if (url.pathname.startsWith('/api/images/') && method === 'PUT') {
      const id = url.pathname.split('/api/images/')[1];
      const body = await request.json() as any;
      const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
      const values = Object.values(body);
      await env.embark_db.prepare(`UPDATE generated_images SET ${fields} WHERE id = ?`).bind(...values, id).run();
      return json({ id, ...body });
    }

    if (url.pathname.startsWith('/api/images/') && method === 'DELETE') {
      const id = url.pathname.split('/api/images/')[1];
      await env.embark_db.prepare('DELETE FROM generated_images WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ─── VIDEOS ─────────────────────────────────────────────
    if (url.pathname === '/api/videos' && method === 'GET') {
      const projectId = url.searchParams.get('project_id');
      const { results } = await env.embark_db.prepare(
        'SELECT * FROM generated_videos WHERE project_id = ?'
      ).bind(projectId).all();
      return json(results);
    }

    if (url.pathname === '/api/videos' && method === 'POST') {
      const body = await request.json() as any;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.embark_db.prepare(
        `INSERT INTO generated_videos (id, project_id, image_id, prompt_id, video_url, engine, duration, status, action_prompt, created_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, body.project_id, body.image_id, body.prompt_id || '', body.video_url || '', body.engine || '', body.duration || 5, body.status || 'generating', body.action_prompt || '', now).run();
      return json({ id, ...body, created_date: now });
    }

    if (url.pathname.startsWith('/api/videos/') && method === 'PUT') {
      const id = url.pathname.split('/api/videos/')[1];
      const body = await request.json() as any;
      const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
      const values = Object.values(body);
      await env.embark_db.prepare(`UPDATE generated_videos SET ${fields} WHERE id = ?`).bind(...values, id).run();
      return json({ id, ...body });
    }

    if (url.pathname.startsWith('/api/videos/') && method === 'DELETE') {
      const id = url.pathname.split('/api/videos/')[1];
      await env.embark_db.prepare('DELETE FROM generated_videos WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

	// ─── CLAUDE PROMPT GENERATION ───────────────────────────────
	if (url.pathname === '/api/generate-prompts' && method === 'POST') {
	const body = await request.json() as any;

	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
		'Content-Type': 'application/json',
		'x-api-key': env.ANTHROPIC_API_KEY,
		'anthropic-version': '2023-06-01',
		},
		body: JSON.stringify({
		model: 'claude-sonnet-4-5',
		max_tokens: 2000,
		messages: [{ role: 'user', content: body.prompt }],
		}),
	});

	const data = await response.json() as any;
	return json({ content: data.content });
	}

    return json({ error: 'Not found' }, 404);
  },
};