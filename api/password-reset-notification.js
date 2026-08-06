const {
  timestampWithoutMilliseconds,
  postToDiscord,
  isReachabilityError,
} = require("../lib/discord");

const MIN_NOTIFICATION_INTERVAL_MS = 5000;
let lastNotificationAt = 0;

function json(res, status, body) {
  res.status(status).json(body);
}

function discordRejectionMessage(response, responseBody) {
  const message = responseBody?.message;
  const code = responseBody?.code;
  let reason = "";

  if (message && code) {
    reason = `: ${message} (code ${code})`;
  } else if (message) {
    reason = `: ${message}`;
  }

  return `Discord rejected the notification (HTTP ${response.status})${reason}.`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method not allowed." });
  }

  const now = Date.now();
  if (now - lastNotificationAt < MIN_NOTIFICATION_INTERVAL_MS) {
    return json(res, 429, {
      ok: false,
      error: "Please wait before retrying.",
    });
  }

  const webhookUrl = (process.env.DISCORD_PASSWORD_RESET_WEBHOOK_URL || "").trim();
  if (!webhookUrl) {
    return json(res, 503, {
      ok: false,
      error: "Notification service is not configured.",
    });
  }

  // Deliberately do not read or inspect req.body. Password values are not
  // accepted by this endpoint and must never be forwarded to Discord.
  const payload = {
    username: "Password Reset Notifications",
    embeds: [
      {
        title: "Password reset submitted",
        color: 3900219,
        fields: [
          {
            name: "Account",
            value: "Lstro (@Lynstroz)",
            inline: true,
          },
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
        timestamp: timestampWithoutMilliseconds(),
      },
    ],
  };

  try {
    const { response, responseBody } = await postToDiscord(
      webhookUrl,
      payload,
      "PasswordResetNotifier/1.0",
    );

    if (!response.ok) {
      return json(res, 502, {
        ok: false,
        error: discordRejectionMessage(response, responseBody),
      });
    }
  } catch (error) {
    if (isReachabilityError(error)) {
      return json(res, 502, {
        ok: false,
        error: "Discord could not be reached from the server.",
      });
    }
    throw error;
  }

  lastNotificationAt = now;
  return json(res, 200, { ok: true });
};