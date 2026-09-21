// Shared Neon Postgres access for the API routes. Expects DATABASE_URL, which the
// Neon integration in the Vercel Marketplace sets automatically.
import { neon } from '@neondatabase/serverless';

let sqlClient = null;
let ready = null;

export function sql() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error('DATABASE_URL is not set'), { status: 500 });
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export function ensureSchema() {
  if (!ready) {
    const q = sql();
    ready = (async () => {
      await q`CREATE TABLE IF NOT EXISTS studies (id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), body jsonb NOT NULL)`;
      await q`CREATE TABLE IF NOT EXISTS gate (k text PRIMARY KEY, hash text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`;
    })().catch(e => { ready = null; throw e; });
  }
  return ready;
}

export async function currentHash() {
  const rows = await sql()`SELECT hash FROM gate WHERE k = 'results'`;
  return rows.length ? rows[0].hash : null;
}

// The client sends the SHA-256 it computed from the password; it must match the stored hash.
export async function isUnlocked(req) {
  const key = String(req.headers['x-results-key'] || '');
  if (!/^[0-9a-f]{64}$/.test(key)) return false;
  const h = await currentHash();
  return !!h && h === key;
}

export function json(res, status, body) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.status(status).send(body === undefined ? '' : JSON.stringify(body));
}

export function fail(res, e) {
  const status = e && e.status ? e.status : 500;
  json(res, status, { error: status === 500 ? 'Storage is not available. Check that the Neon database is attached and DATABASE_URL is set.' : (e.message || 'Request failed') });
}
