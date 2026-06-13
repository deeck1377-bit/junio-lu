export default async function handler(req, res) {
  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const KEY = 'junio_lu_state';

  // Solo acepta GET con password
  const { pw } = req.query;
  if (pw !== 'oscar2026') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    const r = await fetch(`${KV_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([["DEL", KEY]])
    });
    const result = await r.json();
    return res.status(200).json({ ok: true, result });
  } catch(e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
