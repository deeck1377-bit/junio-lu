export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const KV_READ  = process.env.KV_REST_API_READ_ONLY_TOKEN;
  const KEY = 'junio_lu_state';

  // GET
  if (req.method === 'GET') {
    try {
      const r = await fetch(`${KV_URL}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${KV_READ || KV_TOKEN}` }
      });
      const data = await r.json();
      if (!data.result) return res.status(200).json({ ok: true, data: null });

      // result puede ser string JSON o un objeto con {value: "..."}
      let parsed = data.result;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      // Si aun tiene formato {value: "..."}, desempaquetar
      if (parsed && typeof parsed.value === 'string') parsed = JSON.parse(parsed.value);

      return res.status(200).json({ ok: true, data: parsed });
    } catch(e) {
      return res.status(500).json({ ok: false, error: 'GET: ' + e.message });
    }
  }

  // POST
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const { data } = body;

      const r = await fetch(`${KV_URL}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([["SET", KEY, JSON.stringify(data)]])
      });
      const result = await r.json();
      if (Array.isArray(result) && result[0]?.result === 'OK') {
        return res.status(200).json({ ok: true });
      }
      return res.status(500).json({ ok: false, error: JSON.stringify(result) });
    } catch(e) {
      return res.status(500).json({ ok: false, error: 'POST: ' + e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
