import { hashPassword, verifyPassword, generateToken, verifySession } from './auth';

function j(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function guard(request: Request, env: any): Promise<{ user: any } | Response> {
  const auth = await verifySession(request, env);
  if (!auth.ok) return j({ error: 'Unauthorized' }, 401);
  if (auth.user.role !== 'admin') return j({ error: 'Forbidden' }, 403);
  return { user: auth.user };
}

export async function handleAdminRoutes(
  request: Request,
  url: URL,
  method: string,
  env: any
): Promise<Response | null> {
  const path = url.pathname;

  // ── Login / session ───────────────────────────────────────────────────────
  if (path === '/api/admin/login' && method === 'POST') {
    const { email, password } = await request.json() as any;
    const user = await env.embark_db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').bind(email).first() as any;
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return j({ error: 'Invalid credentials' }, 401);
    }
    const token = generateToken();
    const expires = new Date(Date.now() + 7 * 86_400_000).toISOString();
    await env.embark_db.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), user.id, token, expires).run();
    return j({ token, role: user.role, email: user.email });
  }

  if (path === '/api/admin/logout' && method === 'POST') {
    const header = request.headers.get('Authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (token) await env.embark_db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return j({ ok: true });
  }

  if (path === '/api/admin/me' && method === 'GET') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    return j(g.user);
  }

  if (path === '/api/admin/me/password' && method === 'PUT') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const { current_password, new_password } = await request.json() as any;
    if (!current_password || !new_password) return j({ error: 'Both current_password and new_password are required' }, 400);
    if (new_password.length < 8) return j({ error: 'New password must be at least 8 characters' }, 400);
    const row = await env.embark_db.prepare('SELECT password_hash FROM users WHERE id = ?').bind(g.user.id).first() as any;
    if (!row || !(await verifyPassword(current_password, row.password_hash))) return j({ error: 'Current password is incorrect' }, 401);
    const newHash = await hashPassword(new_password);
    await env.embark_db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, g.user.id).run();
    // Invalidate all other sessions so any stolen tokens stop working
    const currentToken = (request.headers.get('Authorization') ?? '').slice(7).trim();
    await env.embark_db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').bind(g.user.id, currentToken).run();
    return j({ ok: true });
  }

  // ── Modes ─────────────────────────────────────────────────────────────────
  if (path === '/api/admin/modes' && method === 'GET') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const { results } = await env.embark_db.prepare('SELECT * FROM modes ORDER BY position').all();
    return j(results);
  }

  if (path === '/api/admin/modes' && method === 'POST') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const body = await request.json() as any;
    const id = crypto.randomUUID();
    await env.embark_db.prepare('INSERT INTO modes (id, slug, name, position) VALUES (?, ?, ?, ?)').bind(id, body.slug, body.name, body.position ?? 0).run();
    return j({ id, ...body });
  }

  if (path.startsWith('/api/admin/modes/') && method === 'PUT') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const id = path.split('/api/admin/modes/')[1];
    const body = await request.json() as any;
    const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
    await env.embark_db.prepare(`UPDATE modes SET ${fields} WHERE id = ?`).bind(...Object.values(body), id).run();
    return j({ id, ...body });
  }

  if (path.startsWith('/api/admin/modes/') && method === 'DELETE') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const id = path.split('/api/admin/modes/')[1];
    await env.embark_db.prepare('DELETE FROM modes WHERE id = ?').bind(id).run();
    return j({ ok: true });
  }

  // ── Categories ────────────────────────────────────────────────────────────
  if (path === '/api/admin/categories' && method === 'GET') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const modeId = url.searchParams.get('mode_id');
    const query = modeId
      ? 'SELECT * FROM categories WHERE mode_id = ? ORDER BY position'
      : 'SELECT * FROM categories ORDER BY position';
    const { results } = modeId
      ? await env.embark_db.prepare(query).bind(modeId).all()
      : await env.embark_db.prepare(query).all();
    return j(results);
  }

  if (path === '/api/admin/categories' && method === 'POST') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const body = await request.json() as any;
    const id = crypto.randomUUID();
    await env.embark_db.prepare(
      'INSERT INTO categories (id, mode_id, slug, name, position) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, body.mode_id, body.slug, body.name, body.position ?? 0).run();
    // Auto-create an empty fragment for this category
    await env.embark_db.prepare(
      "INSERT INTO prompt_fragments (id, category_id, system_prompt, updated_at) VALUES (?, ?, '', datetime('now'))"
    ).bind(crypto.randomUUID(), id).run();
    return j({ id, ...body });
  }

  if (path.startsWith('/api/admin/categories/') && method === 'PUT') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const id = path.split('/api/admin/categories/')[1];
    const body = await request.json() as any;
    const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
    await env.embark_db.prepare(`UPDATE categories SET ${fields} WHERE id = ?`).bind(...Object.values(body), id).run();
    return j({ id, ...body });
  }

  if (path.startsWith('/api/admin/categories/') && method === 'DELETE') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const id = path.split('/api/admin/categories/')[1];
    await env.embark_db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return j({ ok: true });
  }

  // ── Prompt fragments ──────────────────────────────────────────────────────
  if (path === '/api/admin/fragments' && method === 'GET') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const { results } = await env.embark_db.prepare(
      `SELECT pf.*, c.name as category_name, c.slug as category_slug, m.name as mode_name, m.slug as mode_slug
       FROM prompt_fragments pf
       JOIN categories c ON c.id = pf.category_id
       JOIN modes m ON m.id = c.mode_id
       ORDER BY m.position, c.position`
    ).all();
    return j(results);
  }

  if (path.startsWith('/api/admin/fragments/') && method === 'PUT') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const id = path.split('/api/admin/fragments/')[1];
    const { system_prompt } = await request.json() as any;
    await env.embark_db.prepare(
      "UPDATE prompt_fragments SET system_prompt = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(system_prompt, id).run();
    return j({ id, system_prompt });
  }

  // ── Flavors ───────────────────────────────────────────────────────────────
  if (path === '/api/admin/flavors' && method === 'GET') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const { results } = await env.embark_db.prepare('SELECT * FROM flavors ORDER BY position').all();
    return j(results);
  }

  if (path === '/api/admin/flavors' && method === 'POST') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const body = await request.json() as any;
    const id = crypto.randomUUID();
    await env.embark_db.prepare(
      'INSERT INTO flavors (id, slug, name, description, position) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, body.slug, body.name, body.description ?? '', body.position ?? 0).run();
    return j({ id, ...body });
  }

  if (path.startsWith('/api/admin/flavors/') && method === 'PUT') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const id = path.split('/api/admin/flavors/')[1];
    const body = await request.json() as any;
    const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
    await env.embark_db.prepare(`UPDATE flavors SET ${fields} WHERE id = ?`).bind(...Object.values(body), id).run();
    return j({ id, ...body });
  }

  if (path.startsWith('/api/admin/flavors/') && method === 'DELETE') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const id = path.split('/api/admin/flavors/')[1];
    await env.embark_db.prepare('DELETE FROM flavors WHERE id = ?').bind(id).run();
    return j({ ok: true });
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  if (path === '/api/admin/users' && method === 'GET') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const { results } = await env.embark_db.prepare(
      'SELECT id, email, role, active, created_at FROM users ORDER BY created_at DESC'
    ).all();
    return j(results);
  }

  if (path === '/api/admin/users' && method === 'POST') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const { email, password, role = 'user' } = await request.json() as any;
    const existing = await env.embark_db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return j({ error: 'Email already in use' }, 409);
    const id = crypto.randomUUID();
    const hash = await hashPassword(password);
    const now = new Date().toISOString();
    await env.embark_db.prepare(
      'INSERT INTO users (id, email, password_hash, role, created_at, active) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(id, email, hash, role, now).run();
    return j({ id, email, role, active: 1, created_at: now });
  }

  if (path.startsWith('/api/admin/users/') && method === 'PUT') {
    const g = await guard(request, env);
    if (g instanceof Response) return g;
    const id = path.split('/api/admin/users/')[1];
    const body = await request.json() as any;
    // Never update password_hash through this route — use a dedicated endpoint
    const { password_hash: _drop, ...safeBody } = body;
    const fields = Object.keys(safeBody).map(k => `${k} = ?`).join(', ');
    if (!fields) return j({ error: 'Nothing to update' }, 400);
    await env.embark_db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).bind(...Object.values(safeBody), id).run();
    return j({ id, ...safeBody });
  }

  return null; // no admin route matched
}
