# Insta Planner

Instagram-style content planner built with React, TypeScript, Vite, Tailwind, and a small Node API server.

## Run Locally

Start the API server:

```bash
npm run dev:api
```

Start the frontend in another terminal:

```bash
npm run dev:web
```

The frontend proxies `/api` to `http://localhost:4000`.

## Instagram OAuth Setup

Create `.env.local` in the project root:

```env
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_REDIRECT_URI=http://localhost:4000/api/instagram/auth/callback
FRONTEND_URL=http://127.0.0.1:5173
INSTAGRAM_SCOPES=instagram_business_basic
SESSION_SECRET=replace_with_a_long_random_string
TOKEN_ENCRYPTION_KEY=replace_with_a_long_random_string
```

In Meta Developers, add this redirect URI to the Instagram product settings:

```txt
http://localhost:4000/api/instagram/auth/callback
```

Then users connect through the `Connect Instagram` button in the app.

Use the Instagram product/client credentials for `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`. Do not use a generic app ID from an app that has not been configured for Instagram login.

## API Routes

```txt
GET /api/instagram/auth/start
GET /api/instagram/auth/callback
GET /api/instagram/account
GET /api/instagram/media
DELETE /api/instagram/connect
```

## Production Checklist

- Host the API server on HTTPS.
- Set `INSTAGRAM_REDIRECT_URI` to the production callback URL.
- Store connected accounts in a real database instead of `.data`.
- Keep tokens encrypted at rest.
- Add your own user auth and link each Instagram account to a user.
- Submit your Meta app for review/live mode so regular external users can connect.
- Add Privacy Policy and Terms URLs in Meta app settings.
- Add a token refresh job before long-lived tokens expire.
