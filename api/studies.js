// GET    /api/studies          -> [ {id, ...study} ]  newest first; requires x-results-key (the unlocked hash)
// POST   /api/studies {study}  -> { id }              anyone with the page can add a study
// DELETE /api/studies?id=...   -> 204                 requires x-results-key
import { ensureSchema, sql, isUnlocked, json, fail } from './_db.js';
import { randomUUID } from 'crypto';

const MAX_BODY = 32 * 1024;

export default async function handler(req, res) {
  try {
    await ensureSchema();
    if (req.method === 'GET') {
      if (!(await isUnlocked(req))) return json(res, 401, { error: 'Results are locked' });
      const rows = await sql()`SELECT id, body FROM studies ORDER BY created_at DESC LIMIT 1000`;
      return json(res, 200, rows.map(r => ({ id: r.id, ...r.body })));
    }
    if (req.method === 'POST') {
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      if (raw.length > MAX_BODY) return json(res, 413, { error: 'Study is too large' });
      const b = JSON.parse(raw || '{}');
      if (!b || typeof b !== 'object' || !b.minutes || typeof b.minutes !== 'object') return json(res, 400, { error: 'A study needs a minutes object' });
      const clean = {
        name: String(b.name || '').slice(0, 80), date: String(b.date || '').slice(0, 10), exp: String(b.exp || '').slice(0, 20), store: String(b.store || '').slice(0, 80),
        minutes: Object.fromEntries(Object.entries(b.minutes).filter(([k, v]) => /^[a-z]{1,16}$/.test(k) && Number.isFinite(Number(v)) && Number(v) >= 0).map(([k, v]) => [k, Number(v)])),
        notes: Object.fromEntries(Object.entries(b.notes || {}).filter(([k, v]) => /^[a-z]{1,16}$/.test(k) && typeof v === 'string' && v).map(([k, v]) => [k, v.slice(0, 300)])),
        hands: Number(b.hands) || 0, wait: Number(b.wait) || 0, total: Number(b.total) || 0,
        uid: b.uid ? String(b.uid).slice(0, 80) : null, createdAt: new Date().toISOString(), v: 1,
      };
      const id = randomUUID();
      await sql()`INSERT INTO studies (id, body) VALUES (${id}, ${JSON.stringify(clean)}::jsonb)`;
      return json(res, 201, { id });
    }
    if (req.method === 'DELETE') {
      if (!(await isUnlocked(req))) return json(res, 401, { error: 'Results are locked' });
      const id = String((req.query && req.query.id) || '');
      if (!id) return json(res, 400, { error: 'id required' });
      await sql()`DELETE FROM studies WHERE id = ${id}`;
      return json(res, 204);
    }
    return json(res, 405, { error: 'Method not allowed' });
  } catch (e) { return fail(res, e); }
}
