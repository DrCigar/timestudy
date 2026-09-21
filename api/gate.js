// GET  /api/gate                 -> { set: boolean }          is a results password set?
// POST /api/gate { verify: h }   -> { ok: boolean }           does this hash match?
// POST /api/gate { set: h }      -> { ok: true }              set or change the password hash.
//       Allowed when no password exists yet, or when x-results-key holds the current hash.
import { ensureSchema, sql, currentHash, isUnlocked, json, fail } from './_db.js';

const HEX64 = /^[0-9a-f]{64}$/;

export default async function handler(req, res) {
  try {
    await ensureSchema();
    if (req.method === 'GET') return json(res, 200, { set: !!(await currentHash()) });
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (HEX64.test(String(body.verify || ''))) {
      const h = await currentHash();
      return json(res, 200, { ok: !!h && h === body.verify });
    }
    if (HEX64.test(String(body.set || ''))) {
      const existing = await currentHash();
      if (existing && !(await isUnlocked(req))) return json(res, 401, { error: 'Unlock with the current password first' });
      await sql()`INSERT INTO gate (k, hash, updated_at) VALUES ('results', ${body.set}, now())
                  ON CONFLICT (k) DO UPDATE SET hash = EXCLUDED.hash, updated_at = now()`;
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: 'Send { verify: hash } or { set: hash }' });
  } catch (e) { return fail(res, e); }
}
