const {
  jsonResponse,
  postToDiscord,
} = require("./_lib/discord");

const MIN_NOTIFICATION_INTERVAL_MS = 5000;
let lastNotificationAt = 0;

module.exports = async function passwordResetNotification(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return jsonResponse(res, 405, { ok: false, error: "Method not allowed." });
  }

  // The request body is intentionally ignored. Password values must never be
  // accepted by, logged by, or forwarded from this endpoint.
  const now = Date.now();
  if (now - lastNotificationAt < MIN_NOTIFICATION_INTERVAL_MS) {
    return jsonResponse(res, 429, {
      ok: false,
      error: "Please wait before retrying.",
    });
  }

  const webhookUrl = (process.env.DISCORD_PASSWORD_RESET_WEBHOOK_URL || "").trim();
  if (!webhookUrl) {
    return jsonResponse(res, 503, {
      ok: false,
      error: "Notification service is not configured.",
    });
  }

  const payload = {
    username: "Password Reset Notifications",
    embeds: [
      {
        title: "Password reset submitted",
        color: 3900219,
        fields: [
          { name: "Account", value: "Lstro (@Lynstroz)", inline: true },
          {
            name: "Status",
            value: "Both password fields matched",
            inline: true,
          },
          {
            name: "Password values",
            value: "Not collected or transmitted",
            inline: false,
          },
        ],
        timestamp: new Date(now).toISOString(),
      },
    ],
  };

  try {
    const result = await postToDiscord(
      webhookUrl,
      payload,
      "PasswordResetNotifier/1.0",
    );

    if (!result.ok) {
      return jsonResponse(res, 502, {
        ok: false,
        error: `Discord rejected the notification (HTTP ${result.status})${result.errorDetails}.`,
      });
    }
  } catch (error) {
    if (error && error.name === "AbortError") {
      return jsonResponse(res, 502, {
        ok: false,
        error: "Discord could not be reached from the server.",
      });
    }

    return jsonResponse(res, 502, {
      ok: false,
      error: "Discord could not be reached from the server.",
    });
  }

  lastNotificationAt = now;
  return jsonResponse(res, 200, { ok: true });
};