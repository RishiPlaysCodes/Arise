# Solo Levelling — Mobile App (Play Store target)

Offline-first, battery-efficient fitness transformation game built with **Expo
(React Native)**. This is the primary, production deliverable for the Play Store.

## Why this architecture

| Requirement | How it's met |
|-------------|--------------|
| **Play Store ready** | Expo + EAS Build produces a signed `.aab` app bundle |
| **Works offline** | Everything runs on-device via `expo-sqlite`. No server required. |
| **Also works online** | Optional cloud sync layer (`services/sync.js`) pushes to the included Node backend when enabled |
| **Battery efficient** | Steps use the phone's low-power hardware step-counter sensor (no GPS, no CPU polling). Notifications use the OS scheduler. App-block watcher only runs while a punishment is active. |
| **Nothing half-baked** | Every feature is wired end-to-end. The one OS-level limit (blocking *other* apps) is documented honestly in `ANDROID_APP_BLOCKER.md` and surfaced truthfully in the UI. |

## Features (all functional offline)

- **Onboarding**: body assessment + choose from 12 target physiques
- **AI transformation engine**: BMR (Mifflin-St Jeor / Katch-McArdle), TDEE, target weight, macros, phased plan, step target — 100% deterministic, on-device
- **Daily quests**: generated from your plan + level, XP, level-ups, E→SS ranks, stat points
- **Diet tracking**: calorie/macro logging, quest auto-completion, AI meal plans
- **Step counter**: real hardware-sensor auto-tracking + manual adjust, weekly charts
- **Combat training**: 8 disciplines, skill levels, generated sessions, stats
- **Punishment system**: streak logic, social/entertainment/full lockdown, XP drain, in-app lockdown with redemption task
- **Offline day catch-up**: missed days are evaluated automatically on next open
- **Local notifications**: quest reminders + punishment alerts (no server)
- **Monetization**: freemium scaffold (`services/monetization.js`) ready for RevenueCat / Play Billing

## Run it

```bash
cd mobile
npm install          # or: yarn
npx expo start       # scan QR with Expo Go (dev), or:
npx expo run:android # local native build
```

> Step counting and notifications need a **real device** (sensors aren't in the
> simulator). The rest works everywhere.

## Build for Play Store

```bash
npm install -g eas-cli
eas login
eas build:configure
# set your projectId in app.json > expo.extra.eas.projectId
eas build --platform android --profile production   # produces .aab
eas submit --platform android                        # uploads to Play Console
```

See `ANDROID_APP_BLOCKER.md` for the optional native app-blocking module and
the Play Console permission declaration you'll need for it.

## Project structure

```
mobile/
  App.js                    # navigation + providers + lockdown overlay
  src/
    engine/                 # pure logic (transformation, combat, constants)
    db/                     # expo-sqlite schema + repositories (offline store)
    services/               # pedometer, notifications, sync, appBlocker, monetization
    store/                  # AppContext global state
    screens/                # Onboarding, Dashboard, Quests, Diet, Steps, Combat, System, Profile
    components/              # UI primitives + modals
    theme/                  # design system
```
