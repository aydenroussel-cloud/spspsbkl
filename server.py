import json
import os
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


HOST = "0.0.0.0"
PORT = 5000
NOTIFICATION_PATH = "/api/password-reset-notification"
BUTTON_CLICK_PATH = "/api/button-click"
MIN_NOTIFICATION_INTERVAL = 5
last_notification_at = 0.0


class AppHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        global last_notification_at

        if self.path == BUTTON_CLICK_PATH:
            self._handle_button_click()
            return

        if self.path != NOTIFICATION_PATH:
            self.send_error(404)
            return

        # Consume the request body but intentionally ignore it. Password values
        # are never accepted by or forwarded from this endpoint.
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        if content_length:
            self.rfile.read(min(content_length, 4096))

        now = time.monotonic()
        if now - last_notification_at < MIN_NOTIFICATION_INTERVAL:
            self._json_response(429, {"ok": False, "error": "Please wait before retrying."})
            return

        webhook_url = os.environ.get("DISCORD_PASSWORD_RESET_WEBHOOK_URL", "").strip()
        if not webhook_url:
            self._json_response(503, {"ok": False, "error": "Notification service is not configured."})
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
                        {"name": "Password values", "value": "Not collected or transmitted", "inline": False},
                    ],
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }
            ],
        }

        request = Request(
            webhook_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "PasswordResetNotifier/1.0",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=8) as response:
                if response.status < 200 or response.status >= 300:
                    self._json_response(
                        502,
                        {"ok": False, "error": f"Discord rejected the notification (HTTP {response.status})."},
                    )
                    return
        except HTTPError as error:
            discord_reason = ""
            try:
                error_body = error.read(2048).decode("utf-8", errors="replace")
                discord_error = json.loads(error_body)
                message = discord_error.get("message")
                code = discord_error.get("code")
                if message and code:
                    discord_reason = f": {message} (code {code})"
                elif message:
                    discord_reason = f": {message}"
            except (OSError, ValueError, TypeError):
                pass
            self._json_response(
                502,
                {
                    "ok": False,
                    "error": f"Discord rejected the notification (HTTP {error.code}){discord_reason}.",
                },
            )
            return
        except (URLError, TimeoutError):
            self._json_response(502, {"ok": False, "error": "Discord could not be reached from the server."})
            return

        last_notification_at = now
        self._json_response(200, {"ok": True})

    def _handle_button_click(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        body_bytes = self.rfile.read(min(content_length, 4096)) if content_length else b"{}"
        try:
            data = json.loads(body_bytes.decode("utf-8", errors="replace"))
            label = str(data.get("label", "(unknown)"))[:200]
        except (ValueError, TypeError):
            label = "(unknown)"

        webhook_url = os.environ.get("DISCORD_BUTTON_CLICK_WEBHOOK_URL", "").strip()
        if not webhook_url:
            self._json_response(503, {"ok": False, "error": "Webhook not configured."})
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

        request = Request(
            webhook_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "ButtonClickNotifier/1.0",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=8) as response:
                if response.status < 200 or response.status >= 300:
                    self._json_response(502, {"ok": False, "error": f"Discord rejected (HTTP {response.status})."})
                    return
        except (HTTPError, URLError, TimeoutError):
            self._json_response(502, {"ok": False, "error": "Could not reach Discord."})
            return

        self._json_response(200, {"ok": True})

    def _json_response(self, status, body):
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format, *args):
        # Avoid logging request details, which could accidentally include
        # sensitive data if a client is modified incorrectly in the future.
        if self.path == NOTIFICATION_PATH:
            return
        super().log_message(format, *args)


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), AppHandler).serve_forever()