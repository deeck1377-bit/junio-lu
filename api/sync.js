export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const KV_READ  = process.env.KV_REST_API_READ_ONLY_TOKEN;
  const KEY = 'junio_lu_state';

  // GET — load state
  if (req.method === 'GET') {
    try {
      const r = await fetch(`${KV_URL}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${KV_READ}` }
      });
      const data = await r.json();
      const value = data.result ? JSON.parse(data.result) : null;
      return res.status(200).json({ ok: true, data: value });
    } catch(e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // POST — save state
  if (req.method === 'POST') {
    try {
      const { data } = req.body;
      const encoded = encodeURIComponent(JSON.stringify(data));
      const r = await fetch(`${KV_URL}/set/${KEY}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: JSON.stringify(data) })
      });
      const result = await r.json();
      if (result.result === 'OK') {
        return res.status(200).json({ ok: true });
      } else {
        return res.status(500).json({ ok: false, error: result });
      }
    } catch(e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
