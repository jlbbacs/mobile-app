# Installation Guide

## Prerequisites

- Node.js 18+ and npm
- The **Expo Go** app on your Android phone (from Google Play), for the
  fastest way to test on a real device
- A Google account (to deploy the backend — see `DEPLOYMENT.md`)

## 1. Install dependencies

```bash
git clone <your-repo-url>
cd mobile-app
npm install
```

## 2. Configure environment variables (optional)

```bash
cp .env.example .env
```

Fill in `EXPO_PUBLIC_API_ENDPOINT` once you've deployed the Apps Script
backend (see `DEPLOYMENT.md`). This is optional — you can also paste the
endpoint directly into the app's **Settings** screen at runtime, which is
easier while testing since it doesn't require a rebuild.

## 3. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go on Android, or press `a` to launch an Android
emulator if you have one configured.

> Use `npx expo start`, not a globally installed `expo-cli` — the modern
> Expo CLI ships inside the `expo` package itself and the old global
> `expo-cli` package is deprecated and incompatible with current Node
> versions.

## 4. Point the app at your backend

Open the app → **Settings** → paste your Google Apps Script Web App URL into
**"Google Apps Script API Endpoint"** → Save. See `DEPLOYMENT.md` for how to
get that URL.

## 5. Try the flow

Home → New Registration → fill the form → take/upload a photo → Submit. You
should see a success screen, and a new row should appear in your Google
Sheet with the image uploaded to your "Personal Registrations" Drive folder.

## Building for production (Android)

This project uses [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

Set your production `EXPO_PUBLIC_API_ENDPOINT` in `eas.json` under the
`production` build profile's `env` block, or in an `.env` file consumed at
build time, before running the build.
