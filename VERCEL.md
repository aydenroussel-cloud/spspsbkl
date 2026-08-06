# Deploying on Vercel

This project is a static HTML page plus two Vercel Python functions. Vercel
serves `index.html` from the project root and maps these files automatically:

- `api/password-reset-notification.py` → `POST /api/password-reset-notification`
- `api/button-click.py` → `POST /api/button-click`

## Environment variables

Configure these values in the Vercel project settings. Keep both values
server-side and do not put webhook URLs in `index.html`.

| Variable | Used by |
| --- | --- |
| `DISCORD_PASSWORD_RESET_WEBHOOK_URL` | Password-reset status notifications |
| `DISCORD_BUTTON_CLICK_WEBHOOK_URL` | Non-sensitive button-label notifications |

The password-reset route never reads, stores, logs, or forwards password
values. The browser performs matching and length validation locally, then sends
an empty JSON object to the route.

The five-second duplicate-notification throttle is kept in function memory,
matching the original server behavior while a Vercel function instance is
warm. It is intentionally not used as account state.

## Deploy

1. Import this repository into Vercel.
2. Leave the framework preset as **Other** (there is no frontend build step).
3. Set the two environment variables above for the environments you use.
4. Deploy.

No Python package installation or build command is required; the API routes use
only Python's standard library.