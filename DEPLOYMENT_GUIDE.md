# Zenith: Dual Deployment Guide (Website + Android App)

This guide covers deploying Zenith as both a **web application** (Vercel) and **Android app** (Google Play Store). Both use the same React/Vite codebase — single source of truth.

---

## Architecture Overview

```
┌──────────────────────────┐
│   React/Vite Codebase    │
│      (src/ folder)       │
└────────────┬─────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
  Website      Android App
  (Vercel)     (Capacitor)
  
Both share:
- Same UI components
- Same business logic
- Same Supabase backend
- Same authentication
```

---

## Part 1: Website Deployment (Vercel)

### Setup (One-time)

1. **Connect GitHub to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repo: `SKIcut/Zenith`
   - Vercel auto-detects Vite setup ✓

2. **Configure Environment Variables:**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
     ```

3. **Verify Build Settings:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - (Vercel auto-detects these from `package.json` and `vite.config.ts`)

### Deploy Website

```bash
# Every push to main automatically deploys
git add .
git commit -m "Feature: Add markdown support"
git push origin main

# Vercel automatically:
# 1. Runs npm install
# 2. Runs npm run build
# 3. Deploys to production at yourdomain.vercel.app
# ✓ Done!
```

**Website URL:** `https://zenith.vercel.app` (or custom domain)

### Monitor Deployments

- Vercel Dashboard shows build logs, deployment history
- Visit `https://zenith.vercel.app` to test live site
- Rollback to previous version anytime

---

## Part 2: Android App Deployment (Google Play Store)

### Prerequisites

Before building the app, ensure:

1. **Android SDK & Tools**
   - Download [Android Studio](https://developer.android.com/studio)
   - Install JDK 17+
   - Set `ANDROID_HOME` environment variable
   - Create Android emulator or connect physical device

2. **Google Play Developer Account**
   - Create account at [play.google.com/console](https://play.google.com/console)
   - Pay $25 one-time registration fee
   - Add payment method

3. **Create a Keystore (for signing)**
   ```bash
   # One-time: Create signing keystore
   keytool -genkey -v -keystore zenith-release.keystore \
     -alias zenith-key \
     -keyalg RSA -keysize 2048 \
     -validity 10000
   
   # Save this file securely — you'll need it for ALL future releases!
   # Store in: ~/.keystore/zenith-release.keystore (or your preferred location)
   ```

### Build & Test Locally

```bash
# 1. Build web assets
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. In Android Studio:
#    - Select device/emulator
#    - Click "Run" (▶️)
#    - Test on device for 5-10 minutes
```

### Build Release APK

```bash
cd android

# Build unsigned release APK
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release-unsigned.apk
```

### Sign the APK

```bash
cd android

# Sign the APK with your keystore
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ~/.keystore/zenith-release.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  zenith-key

# Align (required for Play Store)
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  zenith-release.apk

# Result: android/zenith-release.apk ✓ Ready for upload
```

### Upload to Google Play

1. **Go to Google Play Console:**
   - https://play.google.com/console
   - Select your app: "Zenith"

2. **Create Release:**
   - Left menu → "Release" → "Create new release"
   - Choose track: "Internal Testing" (first time), then "Production"

3. **Upload APK:**
   - Click "Upload APK"
   - Select `zenith-release.apk`
   - Add release notes (e.g., "v1.0.0: Initial launch with chat, tasks, memory")

4. **Fill Store Info:**
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (min 2, max 8)
   - Icon (512×512 PNG)
   - Feature graphic (1024×500 PNG)
   - Content rating questionnaire

5. **Review & Publish:**
   - Check all details
   - Click "Review release"
   - Click "Publish to Production"

Google Play reviews typically take **24-48 hours**. Once approved, your app appears in Play Store.

---

## Development Workflow

### Making Changes

```bash
# 1. Make code changes in src/
vim src/components/MentorChat.tsx

# 2. Test locally (web)
npm run dev
# Open http://localhost:5173

# 3. Test locally (Android)
npm run build
npx cap sync android
npx cap open android
# Run in Android Studio emulator/device

# 4. Commit & push
git add .
git commit -m "Fix: Improve task parsing"
git push origin main

# Website auto-deploys to Vercel ✓
```

### Updating the Android App

```bash
# After code changes:
npm run build
npx cap sync android
cd android

# Test in emulator first
./gradlew assembleDebug
# Use Android Studio to install on emulator

# Once tested, build release
./gradlew assembleRelease

# Sign & upload to Play Store (see "Sign the APK" section above)
```

---

## Version Management

### Web (Vercel)

- Auto-versioned by commit SHA
- Previous versions accessible in Vercel Dashboard
- Rollback anytime: Dashboard → Deployments → Click previous version

### Android (Google Play)

- Update `versionCode` and `versionName` in `android/app/build.gradle`:
  ```gradle
  android {
    defaultConfig {
      versionCode 1      // Increment by 1 for each release
      versionName "1.0.0" // Semantic versioning
    }
  }
  ```
- Google Play enforces: each release must have a higher `versionCode`
- Changelog shown in Play Store with each update

---

## Environment Variables

Both platforms read from `.env` at build time (for web) or from `capacitor.config.json` (for Android).

### Web (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
```

### Android (automatic)
- Reads from `capacitor.config.json` (created by Capacitor)
- Web bundle embedded in APK includes the same `.env` variables

---

## Troubleshooting

### Vercel Deployment Fails

**Check build logs:**
- Vercel Dashboard → Deployments → Click failed deployment
- Common issues:
  - Missing env vars → add to Vercel Settings
  - Dependencies not installed → `npm install` runs auto
  - Type errors → run `npm run build` locally first

### Android Build Fails

**Gradle sync fails:**
```bash
cd android
./gradlew clean
./gradlew sync
```

**SDK issues:**
```bash
# Verify Android SDK path
echo $ANDROID_HOME  # should print path

# Update SDK
$ANDROID_HOME/tools/bin/sdkmanager --list_installed
```

**Emulator not recognized:**
```bash
adb devices  # list connected devices
# If not listed, restart adb:
adb kill-server
adb start-server
```

### App Rejected by Google Play

**Common reasons:**
- **Crashes on startup** → test in Android Studio emulator first
- **Permissions not declared** → check `android/app/src/main/AndroidManifest.xml`
- **Target API too old** → update in `android/app/build.gradle`: `targetSdkVersion 34`
- **Privacy policy missing** → add URL in Play Console app listing
- **Content rating incomplete** → fill questionnaire in Play Console

---

## Maintenance

### Weekly

- Monitor Vercel deployments (check for build errors)
- Monitor Google Play reviews (user feedback)
- Test both web and app manually

### Monthly

- Review Supabase usage (database, auth, functions)
- Check error logs in Vercel & Play Console
- Plan next features based on user feedback

### When Releasing Updates

1. **Make changes** in `src/`
2. **Test web**: `npm run dev`
3. **Test Android**: build locally, test in emulator
4. **Bump versions:**
   - Android: increment `versionCode` in `build.gradle`
   - (Web auto-versioned by Vercel)
5. **Commit & push**
6. **Upload to Google Play** (if Android changes need Play Store update)

---

## Useful Commands

```bash
# Web
npm run dev                 # Local dev server
npm run build              # Build for production
npm run preview            # Preview production build locally

# Android
npx cap sync android       # Sync web assets to Android
npx cap open android       # Open in Android Studio
cd android
./gradlew assembleDebug    # Build debug APK (testing)
./gradlew assembleRelease  # Build release APK (Play Store)

# Deployment
git push origin main       # Deploy web to Vercel (auto)
# (Then manually upload signed APK to Google Play)
```

---

## Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Google Play Console:** https://play.google.com/console
- **Supabase Dashboard:** https://app.supabase.com
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Android Studio:** https://developer.android.com/studio

---

## Summary

| Platform | Deployment | Auto-Update | Public URL |
|----------|-----------|------------|-----------|
| Website  | Vercel    | On git push | zenith.vercel.app |
| Android  | Google Play | Manual upload | Google Play Store |

**Key Point:** The same React/Vite code powers both. Update once, deploy everywhere.
