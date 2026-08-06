# Project overview

This project is a static HTML password-reset page served by the configured Python
HTTP server. The page includes a responsive reset-password card and local form
validation.

## User preferences

- Keep the reset card centered across desktop and mobile viewport sizes.
- Treat password values as sensitive: never transmit them to third-party
  services or expose them in client-side logs.