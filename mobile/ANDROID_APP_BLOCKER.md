# System-Wide App Blocking on Android (Honest Guide)

The in-app lockdown (blocking access to *this* app's features and showing a
full-screen redemption screen) works out of the box with **no special
permissions**. It's implemented in `LockdownOverlay.js` + `PunishmentRepo`.

Blocking **other** apps (Instagram, YouTube, games) system-wide is a different
matter. Android intentionally makes this hard for security. There is **no** way
to do it from pure JavaScript/Expo Go. It requires a native module + a
sensitive permission the user grants manually. Here are the honest options.

## Option A — Accessibility Service (most reliable, what most "app blockers" use)
- Add a native `AccessibilityService` that watches the foreground app
  (`onAccessibilityEvent` / `TYPE_WINDOW_STATE_CHANGED`) and, if the package is
  in the block list and a punishment is active, launches an overlay / sends the
  user back to the home screen.
- The user must enable it in **Settings > Accessibility**. You cannot enable it
  programmatically.
- **Play Store policy:** apps using AccessibilityService for blocking must
  disclose it clearly and justify it in the Play Console (Permissions
  Declaration). "Digital wellbeing / self-control" is an accepted use case, but
  be prepared for extra review. Do **not** hide the purpose.

## Option B — UsageStats + Overlay (lighter, slightly less reliable)
- `PACKAGE_USAGE_STATS` (special access) to poll the current foreground app,
  plus `SYSTEM_ALERT_WINDOW` to draw a blocking overlay.
- Polling costs battery, so use a short foreground service only while a
  punishment is active, and stop it the moment the punishment expires.

## Wiring it to this app
`src/services/appBlocker.js` already defines the bridge contract. Implement a
native module named **`SoloAppBlocker`** exposing:

```
isAccessibilityEnabled(): Promise<boolean>
openAccessibilitySettings(): Promise<void>
setBlockedApps(packageNames: string[], untilIso: string): Promise<void>
clearBlocks(): Promise<void>
```

Create it with an Expo Config Plugin (so it survives `expo prebuild`):
1. `npx create-expo-module --local solo-app-blocker`
2. Implement the `AccessibilityService` in Kotlin (see Android docs:
   `android.accessibilityservice.AccessibilityService`).
3. Map package names ↔ the friendly names in `constants.js`
   (`SOCIAL_MEDIA_APPS`, `ENTERTAINMENT_APPS`). Example:
   `Instagram → com.instagram.android`, `YouTube → com.google.android.youtube`.
4. The app already calls `AppBlockerService.setBlockedApps(...)` when a
   punishment applies — just forward those to the native list.

## Battery note
- The hardware step counter (`expo-sensors` Pedometer) uses the low-power
  sensor hub, not GPS or CPU polling — negligible battery use.
- Only run the foreground-app watcher while a punishment is ACTIVE. When
  `PunishmentRepo.status().isRestricted === false`, call `clearBlocks()` and
  stop the service. This keeps idle battery cost at zero.

## Current behavior WITHOUT the native module
`AppBlockerService.getCapability()` returns `in_app_only` and the UI tells the
user honestly that system-wide blocking needs the optional module +
permission. Nothing pretends to work that doesn't.
