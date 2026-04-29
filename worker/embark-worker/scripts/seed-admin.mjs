#!/usr/bin/env node
/**
 * Create an admin user in the Embark D1 database.
 *
 * Usage:
 *   node scripts/seed-admin.mjs              # local dev D1 (default — safe)
 *   node scripts/seed-admin.mjs --remote     # production D1 (requires confirmation)
 *
 * Email may be set via EMBARK_ADMIN_EMAIL env var.
 * Password is ALWAYS prompted interactively — never read from env or args.
 * Exits with error if stdin is not a TTY.
 */

import { webcrypto } from 'node:crypto';
import { execSync } from 'node:child_process';
import * as rl from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const isRemote = process.argv.includes('--remote');
const DB_NAME = 'embark-db';

if (!process.stdin.isTTY) {
  console.error('Error: stdin is not a TTY. Run this script in an interactive terminal.');
  process.exit(1);
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const key = await webcrypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key, 256
  );
  const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${toHex(salt.buffer)}:${toHex(bits)}`;
}

function uuid() {
  return webcrypto.randomUUID();
}

async function promptLine(question) {
  const iface = rl.createInterface({ input: stdin, output: stdout });
  const answer = await iface.question(question);
  iface.close();
  return answer.trim();
}

function promptPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let password = '';

    function onData(char) {
      switch (char) {
        case '\r':
        case '\n':
        case '': // Ctrl+D
          process.stdout.write('\n');
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          resolve(password);
          break;
        case '': // Ctrl+C
          process.stdout.write('\n');
          process.stdin.setRawMode(false);
          process.exit(0);
          break;
        case '': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
          }
          break;
        default:
          password += char;
      }
    }

    process.stdin.on('data', onData);
  });
}

async function main() {
  if (isRemote) {
    console.warn('\n⚠  WARNING: This will write to the PRODUCTION D1 database.');
    const confirm = await promptLine('Type "yes" to continue: ');
    if (confirm !== 'yes') {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  const email = process.env.EMBARK_ADMIN_EMAIL || await promptLine('Admin email: ');
  if (!email) {
    console.error('Email is required.');
    process.exit(1);
  }

  const password = await promptPassword('Admin password (hidden): ');
  if (!password) {
    console.error('Password is required.');
    process.exit(1);
  }

  const confirm = await promptPassword('Confirm password (hidden): ');
  if (password !== confirm) {
    console.error('Passwords do not match.');
    process.exit(1);
  }

  console.log('Hashing password…');
  const hash = await hashPassword(password);
  const id = uuid();
  const now = new Date().toISOString();

  const sql = `INSERT OR REPLACE INTO users (id, email, password_hash, role, created_at, active) VALUES ('${id}', '${email}', '${hash}', 'admin', '${now}', 1);`;

  const flags = isRemote ? '' : '--local';
  const target = isRemote ? 'production D1' : 'local D1';
  const cmd = `npx wrangler d1 execute ${DB_NAME} ${flags} --command "${sql}"`;

  console.log(`\nRunning against ${target}…`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: new URL('..', import.meta.url).pathname });
    console.log(`\n✓ Admin user created: ${email}`);
  } catch {
    console.error('\nFailed. Make sure the migration has been applied first:');
    console.error(`  wrangler d1 migrations apply ${DB_NAME}${isRemote ? '' : ' --local'}`);
    process.exit(1);
  }
}

main();
