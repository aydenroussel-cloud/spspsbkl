# Vercel deployment

This project is a static HTML site with two Vercel-compatible serverless API
routes:

- `POST /api/password-reset-notification`
- `POST /api/button-click`

The original `server.py` remains available for the existing local/Replit
workflow. Vercel serves `index.html` as the site root and automatically deploys
the JavaScript files in `api/` as serverless functions.

## Environment variables

Add these variables in the Vercel project settings for the environments where
they are needed:

- `DISCORD_PASSWORD_RESET_WEBHOOK_URL`
- `DISCORD_BUTTON_CLICK_WEBHOOK_URL`

They must be stored as Vercel environment variables, not in `index.html`,
`.replit`, or source control. The browser only calls the same-origin API routes;
it never receives either webhook URL.

The password-reset route deliberately ignores its request body and never
collects or forwards password values. The five-second notification throttle is
kept in warm function memory, matching the behavior of the original in-process
Python server for requests handled by the same Vercel instance.