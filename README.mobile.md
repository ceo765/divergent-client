# Mobile Runtime

Current native runtime uses Expo entrypoint:

- `src/index.native.tsx`
- `src/app/native/NativeAppRoot.tsx`

Required env vars for standalone mobile runs:

- `EXPO_PUBLIC_APP_ENV` (`development`, `staging`, or `production`)
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_PUBLIC_URL` (recommended for share links; falls back to API URL)
- `EXPO_PUBLIC_APP_SCHEME` (used for payment return deep links; defaults to `divergent`)
- `EXPO_PUBLIC_TELEGRAM_BOT_URL` (optional)

Recommended first run:

1. Copy `.env.example` to `.env`
2. Point `EXPO_PUBLIC_API_BASE_URL` to a reachable backend origin
3. Confirm `EXPO_PUBLIC_APP_SCHEME` matches `app.json`
4. Run `npm run expo:start`
5. Open the app in Expo Go / emulator

Notes:

- web still uses `public/config/*.json`
- native uses `Config.native.ts` and does not fetch `/config/*.json`
- development and staging builds fail closed when API/public URLs are missing, so they cannot silently use production
- mobile session persistence already goes through native session adapter
- native payments now request return URLs like `divergent://challenges`, and the backend appends `paymentId` and `id`
- isolated web preview now has its own entrypoint at `native-preview.html`
