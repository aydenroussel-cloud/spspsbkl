"""Vercel API route for non-sensitive button-click notifications."""

from __future__ import annotations

import json
import time
from http.server import BaseHTTPRequestHandler

from lib.discord import (
    json_response,
    method_not_allowed,
    post_webhook,
    read_body,
    webhook_url,
)


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        try:
            data = json.loads(read_body(self).decode("utf-8", errors="replace") or "{}")
            label = str(data.get("label", "(unknown)"))[:200]
        except (ValueError, TypeError, AttributeError):
            label = "(unknown)"

        target = webhook_url("DISCORD_BUTTON_CLICK_WEBHOOK_URL")
        if not target:
            json_response(self, 503, {"ok": False, "error": "Webhook not configured."})
            return

        payload = {
            "username": "Button Click Tracker",
            "embeds": [
                {
                    "title": "Button clicked",
                    "color": 5814783,
                    "fields": [
                        {"name": "Button text", "value": label or "(empty)", "inline": False},
                    ],
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }
            ],
        }
        status, error = post_webhook(target, payload, "ButtonClickNotifier/1.0")
        if error:
            json_response(
                self,
                502,
                {"ok": False, "error": "Could not reach Discord." if status is None else error},
            )
            return

        json_response(self, 200, {"ok": True})

    def do_GET(self) -> None:
        method_not_allowed(self)

    def do_PUT(self) -> None:
        method_not_allowed(self)

    def do_PATCH(self) -> None:
        method_not_allowed(self)

    def do_DELETE(self) -> None:
        method_not_allowed(self)

    def log_message(self, format: str, *args: object) -> None:
        return