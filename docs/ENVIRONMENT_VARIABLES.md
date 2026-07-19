# Environment Variables

Copy `.env.example` to `.env` in the project root and fill in what you need.
Expo automatically inlines any variable prefixed with `EXPO_PUBLIC_` into the
JS bundle at build/start time — nothing further to configure.

| Variable                       | Required | Description                                                                                   |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_ENDPOINT`     | No       | Default Google Apps Script Web App URL, pre-fills Settings. Users can still override at runtime. |
| `EXPO_PUBLIC_GOOGLE_SHEET_URL` | No       | Default Google Sheet URL, shown for reference in Settings.                                       |
| `EXPO_PUBLIC_DRIVE_FOLDER_ID`  | No       | Default Google Drive folder ID, shown for reference in Settings.                                 |
| `EXPO_PUBLIC_API_TOKEN`        | No       | Shared-secret sent as `apiKey` with every submission; must match the `API_TOKEN` script property in `apps-script/Code.gs`. Leave unset to disable the check entirely. |

## Important: these are not secrets

`EXPO_PUBLIC_*` variables ship inside the compiled app and are readable by
anyone who inspects the bundle. This is fine here because:

- The Apps Script Web App URL is not a credential — access to your actual
  Google Sheet/Drive is controlled entirely server-side, via the script's
  own Google account authorization (see `docs/DEPLOYMENT.md`).
- `EXPO_PUBLIC_API_TOKEN`, if you set one, is a **light deterrent** against
  casual abuse of a leaked URL, not a substitute for real authentication. Do
  not treat it as protecting sensitive data.

No Google API keys, OAuth client secrets, or service account credentials are
ever needed in this app — all Drive/Sheets access happens inside your Apps
Script project, under your own Google account.

## Local development without a `.env`

Everything in `.env.example` is optional. If you skip it entirely, just
paste your Apps Script Web App URL into the app's **Settings** screen after
first launch — it's saved to on-device storage (`AsyncStorage`) and persists
across restarts.
