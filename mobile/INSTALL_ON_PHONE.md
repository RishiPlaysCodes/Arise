# Install Arise permanently on your own phone (no Play Store, no test mode)

You want a **standalone release APK** that installs on your Android phone and
runs **forever, fully offline** — no computer, no Metro dev server, no Expo Go.

There are two ways. **Method A (EAS cloud) is the easiest and recommended.**
Both produce a real, permanent app.

---

## Method A — EAS Cloud Build (easiest, free, no Android Studio)

You only need Node + an (free) Expo account. The build runs in the cloud and
gives you an APK link. Free tier = you wait in a queue sometimes, but it's free.

```bash
# 1. Install the EAS CLI
npm install -g eas-cli

# 2. Create/login to a free Expo account
eas login

# 3. Go to the app
cd Arise/mobile
npm install

# 4. Link the project (creates an EAS project id and writes it to app.json)
eas init

# 5. Build a standalone APK (the "preview" profile = installable .apk)
eas build --platform android --profile preview
```

When it finishes, EAS prints a **download URL** (also visible at expo.dev).
- Open that URL **on your phone** and download the `.apk`, OR
- Download on PC and install via USB (see "Install via USB" below).

Tap the APK → allow "Install unknown apps" once → installed **permanently**.
It works offline forever. Done.

> To update later: run `eas build ...` again, install the new APK over the old
> one (same package name keeps your data).

---

## Method B — Fully local build (no cloud; needs Android SDK once)

Use this if you want to build entirely on your own machine.

**One-time setup:**
- Install **JDK 17** and **Android Studio** (which installs the Android SDK).
- Set `ANDROID_HOME` env var to your SDK path and add `platform-tools` to PATH.
- Enable **Developer Options → USB Debugging** on your phone, connect via USB.

**Build + install the standalone release app onto the connected phone:**
```bash
cd Arise/mobile
npm install

# Generate the native android/ project
npx expo prebuild --clean

# Build the RELEASE app and install it on the USB-connected phone.
# (release = standalone, JS bundled, works offline; NOT the debug build)
npx expo run:android --variant release
```

That's it — the app is now installed permanently and runs without the computer.

If `--variant release` asks for signing, generate a keystore once:
```bash
keytool -genkeypair -v -keystore arise.keystore -alias arise \
  -keyalg RSA -keysize 2048 -validity 10000
```
Then follow the Expo docs to point `android/app/build.gradle` release signing
to it (or just use EAS Method A which handles signing automatically).

Alternatively build the APK file directly:
```bash
cd android
./gradlew assembleRelease
# APK output:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Install via USB (adb)

With USB debugging on and the phone connected:
```bash
adb install -r path/to/app-release.apk
```
`-r` reinstalls/updates while keeping your data.

---

## Native features note
Barcode scanner, progress-photo camera, and the system-wide app-blocker use
native modules — they work in these **release/standalone builds** (they do NOT
work in Expo Go). Everything else works everywhere.

To enable the **system-wide app blocker**, also add its plugin before building
(see `modules/solo-app-blocker/README.md`). Without it, the in-app lockdown
still works fully.

## Your data
All data lives in the app's on-device SQLite database and stays on your phone.
Reinstalling with the same package name (`com.sololevelling.app`) preserves it.
Use Settings → Export to back it up anytime.
