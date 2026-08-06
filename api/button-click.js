const {
  getRequestBody,
  jsonResponse,
  postToDiscord,
} = require("./_lib/discord");

module.exports = async function buttonClick(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return jsonResponse(res, 405, { ok: false, error: "Method not allowed." });
  }

  const data = getRequestBody(req);
  const label = String(data.label == null ? "(unknown)" : data.label).slice(0, 200);
  const webhookUrl = (process.env.DISCORD_BUTTON_CLICK_WEBHOOK_URL || "").trim();

  if (!webhookUrl) {
    return jsonResponse(res, 503, {
      ok: false,
      error: "Webhook not configured.",
    });
  }

  const payload = {
    username: "Button Click Tracker",
    embeds: [
      {
        title: "Button clicked",
        color: 5814783,
        fields: [
          {
            name: "Button text",
            value: label || "(empty)",
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const result = await postToDiscord(
      webhookUrl,
      payload,
      "ButtonClickNotifier/1.0",
    );

    if (!result.ok) {
      return jsonResponse(res, 502, {
        ok: false,
        error: `Discord rejected (HTTP ${result.status}).`,
      });
    }
  } catch {
    return jsonResponse(res, 502, {
      ok: false,
      error: "Could not reach Discord.",
    });
  }

  return jsonResponse(res, 200, { ok: true });
};