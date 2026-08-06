const DEFAULT_TIMEOUT_MS = 8000;

function jsonResponse(res, status, body) {
  res.status(status).json(body);
}

function getRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

async function postToDiscord(webhookUrl, payload, userAgent) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let errorDetails = "";
    if (!response.ok) {
      try {
        const discordError = await response.json();
        const message = discordError && discordError.message;
        const code = discordError && discordError.code;
        if (message && code) {
          errorDetails = `: ${message} (code ${code})`;
        } else if (message) {
          errorDetails = `: ${message}`;
        }
      } catch {
        // Discord may return an empty or non-JSON error response.
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      errorDetails,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  getRequestBody,
  jsonResponse,
  postToDiscord,
};