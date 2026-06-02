export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.GH_TOKEN;
  const repo  = 'deeck1377-bit/junio-lu';
  const file  = 'data.json';

  try {
    const { data } = req.body;

    // Get current SHA
    const metaRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${file}`,
      { headers: { Authorization: `token ${token}`, 'User-Agent': 'junio-lu' } }
    );
    
    let sha = null;
    if (metaRes.ok) {
      const meta = await metaRes.json();
      sha = meta.sha;
    }

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const body = { message: 'Sync datos junio Lu', content };
    if (sha) body.sha = sha;

    const pushRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${file}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'junio-lu'
        },
        body: JSON.stringify(body)
      }
    );

    if (pushRes.ok) {
      res.status(200).json({ ok: true });
    } else {
      const err = await pushRes.json();
      res.status(500).json({ error: err.message });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
