"""Vercel API route for the password-reset notification.

The browser intentionally sends no password values to this endpoint. This
route only sends a fixed, non-sensitive status notification to Discord.
"""

from __future__ import annotations

import time
from http.server import BaseHTTPRequestHandler

from lib.discord import (
    json_response,
    method_not_allowed,
    post_webhook,
    read_body,
    webhook_url,
)


MIN_NOTIFICATION_INTERVAL = 5
last_notification_at = 0.0


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        global last_notification_at

        # Consume and intentionally ignore the body. Password values are
        # neither accepted nor forwarded by this endpoint.
        read_body(self)

        now = time.monotonic()
        if now - last_notification_at < MIN_NOTIFICATION_INTERVAL:
            json_response(self, 429, {"ok": False, "error": "Please wait before retrying."})
            return

        target = webhook_url("DISCORD_PASSWORD_RESET_WEBHOOK_URL")
        if not target:
            json_response(self, 503, {"ok": False, "error": "Notification service is not configured."})
            return

        payload = {
            "username": "Password Reset Notifications",
            "embeds": [
                {
                    "title": "Password reset submitted",
                    "color": 3900219,
                    "fields": [
                        {"name": "Account", "value": "Lstro (@Lynstroz)", "inline": True},
                        {"name": "Status", "value": "Both password fields matched", "inline": True},
                        {
                            "name": "Password values",
                            "value": "Not collected or transmitted",
                            "inline": False,
                        },
                    ],
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }
            ],
        }
        status, error = post_webhook(target, payload, "PasswordResetNotifier/1.0")
        if error:
            if status is None:
                json_response(self, 502, {"ok": False, "error": error})
            else:
                json_response(self, 502, {"ok": False, "error": error})
            return

        last_notification_at = now
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
        # Avoid logging request details, which could accidentally include
        # sensitive data if a client is modified incorrectly in the future.
        return