# Building Zenith as an Android App

This project has been converted to an Android app using **Capacitor**, which wraps the React/Vite web app in a native Android shell.

## Prerequisites

Before building for Android, ensure you have:

1. **Node.js & npm** (already installed)
2. **Java Development Kit (JDK) 17+**
   - Download from [oracle.com](https://www.oracle.com/java/technologies/downloads/) or use [OpenJDK](https://jdk.java.net/)
   - Set `JAVA_HOME` environment variable

3. **Android SDK** (via Android Studio)
   - Download [Android Studio](https://developer.android.com/studio)
   - Install via Android Studio or [cmdline-tools](https://developer.android.com/studio#command-tools)
   - Set `ANDROID_HOME` environment variable (e.g., `C:\Users\YourUser\AppData\Local\Android\sdk`)

4. **Gradle** (bundled with Android SDK, or standalone)

### Quick Setup on Windows

```powershell
# Install JDK via Chocolatey (if you have it)
choco install openjdk17

# OR download manually and set JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17.0.X", "User")

# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:USERPROFILE\AppData\Local\Android\sdk", "User")

# Verify
java -version
```

## Build Steps

### 1. Build the Web App
```bash
npm run build
```
This creates the optimized web assets in `dist/`.

### 2. Sync Web Assets to Android
```bash
npx cap sync android
```
Copies the latest web build to the Android project.

### 3. Build the APK (Debug)
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Build the APK (Release - for App Stores)
```bash
cd android
./gradlew assembleRelease
```
You'll need to sign it with your keystore. See "Signing for Release" below.

### 5. Install on Android Device/Emulator
```bash
# Make sure device is connected via USB (with debugging enabled)
# or emulator is running

# Debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or let Capacitor handle it
npx cap open android
# Then build/run in Android Studio
```

## Development Workflow

### Live Development with Hot Reload
```bash
npm run dev
```
This starts the Vite dev server. Open in browser at `http://localhost:5173` for web development.

For Android hot reload:
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Sync and open in Android Studio
npx cap sync android
npx cap open android
```
Then in Android Studio, run on device/emulator. Changes to React code will hot-reload.

### Update Android After Code Changes
```bash
npm run build
npx cap sync android
```

## Signing for Release (App Store Distribution)

To release on Google Play Store, you must sign the APK with a keystore.

### Create a Keystore
```bash
keytool -genkey -v -keystore my-app.keystore -alias zenith-key -keyalg RSA -keysize 2048 -validity 10000
```
Keep this file safe — you'll need it for all future updates.

### Sign the Release APK
```bash
cd android

# Build unsigned release APK
./gradlew assembleRelease

# Sign it
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ../my-app.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  zenith-key

# Align it (for Play Store)
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/app-release.apk
```

Output: `android/app/build/outputs/apk/release/app-release.apk` — ready for Google Play Console.

## Capacitor Config

Edit `capacitor.config.ts` to customize:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',  // Change to your domain
  appName: 'Zenith',
  webDir: 'dist',
  android: {
    // Optional: customize Android-specific settings
  }
};

export default config;
```

## Troubleshooting

### Gradle Build Fails
- Ensure `JAVA_HOME` and `ANDROID_HOME` are set correctly
- Run `./gradlew clean` in the `android/` folder, then retry
- Check `android/local.properties` has correct SDK path

### Web Assets Don't Update
- Run `npx cap sync android` after `npm run build`
- Clear Android app cache: `adb shell pm clear com.example.app`

### APK Too Large
- The production bundle is ~835KB (minified). Consider:
  - Code splitting with dynamic imports
  - Using a release build (smaller than debug)
  - ProGuard/R8 rules in `android/app/build.gradle`

### Device Not Recognized
- Enable USB debugging: Settings > Developer Options > USB Debugging
- On Windows, install [ADB drivers](https://developer.android.com/studio/run/oem-usb)
- Run `adb devices` to list connected devices

## Resources

- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Google Play Console](https://play.google.com/console) — for publishing

## Environment Variables

Before building, ensure your `.env.local` has Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

These are embedded in the web bundle at build time and will work in the Android app.

---

**Quick TL;DR:**

```bash
# One-time setup
npm install
npm run build
npx cap add android

# Ongoing development
npm run dev          # for web
npx cap sync android # after changes
cd android && ./gradlew assembleDebug  # for APK
```
