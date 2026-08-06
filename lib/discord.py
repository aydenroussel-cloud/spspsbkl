"""Small, dependency-free Discord webhook client used by Vercel functions."""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def json_response(
    handler: BaseHTTPRequestHandler,
    status: int,
    body: dict[str, Any],
    extra_headers: dict[str, str] | None = None,
) -> None:
    """Write a JSON response without logging request contents."""
    encoded = json.dumps(body).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    for name, value in (extra_headers or {}).items():
        handler.send_header(name, value)
    handler.send_header("Content-Length", str(len(encoded)))
    handler.end_headers()
    handler.wfile.write(encoded)


def method_not_allowed(handler: BaseHTTPRequestHandler) -> None:
    json_response(
        handler,
        405,
        {"ok": False, "error": "Method not allowed."},
        extra_headers={"Allow": "POST"},
    )


def read_body(handler: BaseHTTPRequestHandler, limit: int = 4096) -> bytes:
    """Consume at most the same small request body accepted by server.py."""
    try:
        content_length = int(handler.headers.get("Content-Length", "0"))
    except (TypeError, ValueError):
        content_length = 0
    if content_length <= 0:
        return b""
    return handler.rfile.read(min(content_length, limit))


def post_webhook(
    webhook_url: str, payload: dict[str, Any], user_agent: str
) -> tuple[int | None, str | None]:
    """Post a JSON notification and return (HTTP status, human-safe error)."""
    request = Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": user_agent,
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=8) as response:
            if response.status < 200 or response.status >= 300:
                return response.status, f"Discord rejected the notification (HTTP {response.status})."
            return response.status, None
    except HTTPError as error:
        reason = ""
        try:
            error_body = error.read(2048).decode("utf-8", errors="replace")
            discord_error = json.loads(error_body)
            message = discord_error.get("message")
            code = discord_error.get("code")
            if message and code:
                reason = f": {message} (code {code})"
            elif message:
                reason = f": {message}"
        except (OSError, ValueError, TypeError):
            pass
        return error.code, f"Discord rejected the notification (HTTP {error.code}){reason}."
    except (URLError, TimeoutError, OSError):
        return None, "Discord could not be reached from the server."


def webhook_url(name: str) -> str:
    """Read a webhook URL only on the server; never expose it to the browser."""
    return os.environ.get(name, "").strip()