const DISCORD_TIMEOUT_MS = 8000;

function timestampWithoutMilliseconds() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function postToDiscord(webhookUrl, payload, userAgent) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DISCORD_TIMEOUT_MS);

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

    let responseBody = null;
    if (!response.ok && response.status !== 204) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }
    }

    return { response, responseBody };
  } finally {
    clearTimeout(timeout);
  }
}

function isReachabilityError(error) {
  return error?.name === "AbortError" || error instanceof TypeError;
}

module.exports = {
  timestampWithoutMilliseconds,
  postToDiscord,
  isReachabilityError,
};