export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const KV_READ  = process.env.KV_REST_API_READ_ONLY_TOKEN;
  const KEY = 'junio_lu_state';

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ ok: false, error: 'Missing env vars: ' + KV_URL });
  }

  // GET — cargar estado
  if (req.method === 'GET') {
    try {
      const r = await fetch(`${KV_URL}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${KV_READ || KV_TOKEN}` }
      });
      const text = await r.text();
      const data = JSON.parse(text);
      if (data.result && data.result !== null) {
        const parsed = JSON.parse(data.result);
        return res.status(200).json({ ok: true, data: parsed });
      }
      return res.status(200).json({ ok: true, data: null });
    } catch(e) {
      return res.status(500).json({ ok: false, error: 'GET error: ' + e.message });
    }
  }

  // POST — guardar estado usando pipeline REST de Upstash
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const { data } = body;
      const value = JSON.stringify(data);

      // Upstash REST API: POST /pipeline con comandos
      const r = await fetch(`${KV_URL}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([["SET", KEY, value]])
      });
      const text = await r.text();
      const result = JSON.parse(text);

      // result es array, primer elemento debe ser {result: "OK"}
      if (Array.isArray(result) && result[0]?.result === 'OK') {
        return res.status(200).json({ ok: true });
      } else {
        return res.status(500).json({ ok: false, error: text });
      }
    } catch(e) {
      return res.status(500).json({ ok: false, error: 'POST error: ' + e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
