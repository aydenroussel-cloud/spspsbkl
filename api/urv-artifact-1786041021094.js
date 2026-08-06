export default async function handler(req, res) {
  const { text } = req.body;
  await fetch('https://discord.com/api/webhooks/1534990501223071911/82w8e156E0GFFo7h1-oI_0CtUuLbvh5maffUNZ1EvnOFRO3ulcYs9uxFUTcGtDfyPslB', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `Button clicked: ${text}` }),
  });
  return res.status(200).json({ sent: true });
}