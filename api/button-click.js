const {
  timestampWithoutMilliseconds,
  postToDiscord,
  isReachabilityError,
} = require("../lib/discord");

function json(res, status, body) {
  res.status(status).json(body);
}

function getLabel(body) {
  let data = body;
  if (typeof body === "string") {
    try {
      data = JSON.parse(body);
    } catch {
      data = {};
    }
  }

  if (!data || typeof data !== "object") {
    return "(unknown)";
  }

  const label =
    data.label === undefined || data.label === null
      ? "(unknown)"
      : String(data.label).slice(0, 200);
  return label;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method not allowed." });
  }

  const webhookUrl = (process.env.DISCORD_BUTTON_CLICK_WEBHOOK_URL || "").trim();
  if (!webhookUrl) {
    return json(res, 503, { ok: false, error: "Webhook not configured." });
  }

  const label = getLabel(req.body);
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
        timestamp: timestampWithoutMilliseconds(),
      },
    ],
  };

  try {
    const { response } = await postToDiscord(
      webhookUrl,
      payload,
      "ButtonClickNotifier/1.0",
    );

    if (!response.ok) {
      return json(res, 502, {
        ok: false,
        error: `Discord rejected (HTTP ${response.status}).`,
      });
    }
  } catch (error) {
    if (isReachabilityError(error)) {
      return json(res, 502, {
        ok: false,
        error: "Could not reach Discord.",
      });
    }
    throw error;
  }

  return json(res, 200, { ok: true });
};