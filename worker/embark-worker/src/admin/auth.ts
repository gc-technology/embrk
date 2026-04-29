const ITERATIONS = 100_000;

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key, 256
  );
  return `pbkdf2:${toHex(salt.buffer)}:${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;
  const salt = fromHex(parts[1]);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key, 256
  );
  return toHex(bits) === parts[2];
}

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes.buffer);
}

export type AuthResult =
  | { ok: true; user: { id: string; email: string; role: string } }
  | { ok: false };

export async function verifySession(request: Request, env: any): Promise<AuthResult> {
  const header = request.headers.get('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) return { ok: false };
  const token = header.slice(7).trim();
  const row = await env.embark_db
    .prepare(
      `SELECT u.id, u.email, u.role, u.active
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')`
    )
    .bind(token)
    .first() as any;
  if (!row || !row.active) return { ok: false };
  return { ok: true, user: { id: row.id, email: row.email, role: row.role } };
}
