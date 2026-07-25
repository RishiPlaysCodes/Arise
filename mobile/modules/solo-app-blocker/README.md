# solo-app-blocker (native Android module)

Makes system-wide app blocking **real** during punishments. Without this module
the app still runs — it just falls back to the in-app lockdown and reports
`in_app_only` in the UI (honest, no fake blocking).

## What it does
- Exposes `NativeModules.SoloAppBlocker` (matches `src/services/appBlocker.js`):
  `isAccessibilityEnabled`, `openAccessibilitySettings`, `setBlockedApps`, `clearBlocks`.
- Ships an `AccessibilityService` that, while a punishment window is active,
  sends the user back to Home when they open a blocked app (a soft, policy-
  friendly block that keeps the user in control).

## Enable it (requires a prebuild / dev build — not Expo Go)
1. Add the plugin to `app.json`:
   ```json
   "plugins": [ "./modules/solo-app-blocker/app.plugin.js", ... ]
   ```
2. Map friendly names → package names. Extend `AppBlockerService.setBlockedApps`
   to pass real Android package names, e.g.
   `Instagram → com.instagram.android`, `YouTube → com.google.android.youtube`,
   `TikTok → com.zhiliaoapp.musically`, `Facebook → com.facebook.katana`.
3. `npx expo prebuild --clean`
4. Register the package in `android/app/src/main/java/.../MainApplication.kt`:
   ```kotlin
   import com.sololevelling.appblocker.SoloAppBlockerPackage
   // inside getPackages():
   packages.add(SoloAppBlockerPackage())
   ```
5. `npx expo run:android`
6. In-app, open **The System → Enable System-Wide Blocking**, then grant the
   Accessibility permission in Settings.

## Google Play policy (important)
Apps using `AccessibilityService` must declare it in the Play Console and
justify the use. "Digital wellbeing / self-control app blocker" is an accepted
use case — describe it clearly. Do **not** obscure the purpose. Expect extra
review. This is a legitimate, disclosed use.

## Battery
The service only reacts to `typeWindowStateChanged` events (event-driven, no
polling) and the block window auto-expires via a timestamp, so idle cost is
effectively zero.
