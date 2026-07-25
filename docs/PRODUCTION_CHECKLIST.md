# Production Checklist

Use this before pointing `riveriq.app` at production.

## Runtime

- Use Node `22.22.0` or newer.
- Run `npm ci` in both `backend/` and `frontend/`.
- Run the full test suite before deploy:
  - `cd backend && npm test`
  - `cd frontend && npm test`
  - `cd frontend && npm run build`
  - `cd frontend && npm run test:e2e`

## Backend Environment

Copy `backend/.env.example` into your production host settings and replace every placeholder.

Required in production:

- `NODE_ENV=production`
- `PORT`
- `FRONTEND_URL=https://riveriq.app`
- `COOKIE_SAME_SITE=none` when frontend and backend are on different domains
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_YEARLY_PRICE_ID`
- `CLOUDFLARE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME_HH`
- `R2_BUCKET_NAME_AVATAR`
- `R2_PUBLIC_URL`

## Frontend Environment

Copy `frontend/.env.example` into your frontend host settings and replace every placeholder.

Required in production:

- `VITE_API_URL=https://your-backend-url`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY`

## Stripe

- Use live Stripe keys only in production.
- Set `STRIPE_PRICE_ID` to the live RiverIQ Pro monthly recurring price.
- Set `STRIPE_YEARLY_PRICE_ID` to the live RiverIQ Pro yearly recurring price.
- Set `VITE_STRIPE_PUBLISHABLE_KEY` to the matching live publishable key.
- Confirm the payment page can create a subscription and upgrade the user to `pro`.
- Confirm canceling a subscription downgrades the user to `free`.

## Google Login

- Add `https://riveriq.app` to authorized JavaScript origins.
- Add your production callback/origin settings in Google Cloud.
- Use the same production Google client ID in both backend and frontend env vars.

## Cloudflare R2

- Confirm hand history and avatar buckets exist.
- Confirm API token/key permissions allow object write/delete for the correct buckets.
- Confirm public avatar URLs resolve from `R2_PUBLIC_URL_AVATAR` or `R2_PUBLIC_URL`.

## Final Smoke Test

- Register a new account.
- Verify email.
- Log in with email/password.
- Log in with Google.
- Upload a small PokerStars fixture.
- Confirm bankroll updates.
- Create/cancel a Stripe test subscription in staging, then repeat with live keys in production.
- Delete the uploaded session and confirm bankroll reverses.
