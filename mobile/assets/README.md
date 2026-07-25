# App Assets

The PNG files here are **1x1 placeholders** so the project builds immediately.
Replace them with real artwork before publishing to the Play Store.

| File | Required Size | Purpose |
|------|---------------|---------|
| `icon.png` | 1024x1024 | App icon (iOS + fallback) |
| `adaptive-icon.png` | 1024x1024 (safe zone 66%) | Android adaptive icon foreground |
| `splash.png` | 1284x2778 (or 1242x2436) | Splash screen, transparent/centered logo |
| `notification-icon.png` | 96x96 white-on-transparent | Android notification icon |
| `favicon.png` | 48x48 | Web favicon |

## Fast way to generate all icons
1. Design one 1024x1024 master icon (dark background `#0a0a0f`, purple `#7c3aed` shield/monarch motif).
2. Run: `npx @expo/configure-splash-screen` or use https://easappicon.com to export all sizes.
3. Drop the exported files here, keeping the same filenames.

Brand palette: background `#0a0a0f`, primary `#7c3aed`, accent `#3b82f6`, gold `#f59e0b`.
