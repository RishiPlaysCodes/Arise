# ARISE — Complete Documentation

> A zero-to-hero guide. If you know nothing about code, read this and you'll understand every single piece of this app — what it does, why it exists, and how to build it yourself from scratch.

---

## Table of Contents

1. [What is Arise?](#what-is-arise)
2. [Tech Stack (Tools Used)](#tech-stack)
3. [Project Structure (File Map)](#project-structure)
4. [How the App Works (Flow)](#how-the-app-works)
5. [Every Feature Explained](#every-feature-explained)
6. [Code Explained — File by File](#code-explained-file-by-file)
7. [How to Build & Install (All Methods)](#how-to-build--install)
8. [How to Modify / Add Features](#how-to-modify)
9. [Troubleshooting](#troubleshooting)

---

## What is Arise?

Arise is an **offline-first Android fitness transformation app** inspired by the anime "Solo Leveling." You input your body details, pick a target physique, and the app generates daily quests (workouts, diet, steps). Complete them → earn XP → level up (E-Rank to SS-Rank). Miss them → get punished (apps blocked, XP drained).

**Key principle:** Everything runs on YOUR phone. No server needed. No internet needed. Your data never leaves your device unless you explicitly enable cloud sync.

---

## Tech Stack

| Technology | What it does | Why we chose it |
|-----------|--------------|-----------------|
| **React Native** | Write one codebase, runs on Android (and iOS) | Industry standard for cross-platform mobile apps |
| **Expo (SDK 51)** | Toolkit on top of React Native — handles builds, native modules, permissions | Makes development 10x faster, handles complexities |
| **expo-sqlite** | On-device database (SQLite) | All data stored locally, works offline, fast |
| **expo-sensors (Pedometer)** | Reads the phone's hardware step-counter chip | Battery-efficient step counting without GPS |
| **expo-notifications** | Schedule local reminders | Quest reminders work offline, no server push needed |
| **expo-camera** | Barcode scanning for food items | Scan product → auto-fill nutrition from Open Food Facts |
| **expo-image-picker** | Take/select progress photos | Track visual transformation |
| **React Navigation** | Move between screens (tabs, stacks) | Industry standard for React Native navigation |
| **react-native-svg** | Draw charts and the logo | Lightweight vector graphics, crisp at any size |
| **Node.js + Express** (optional) | Backend server for cloud sync | Only needed if you want multi-device sync |
| **better-sqlite3** (server) | Server-side database | Fast embedded SQL for the sync backend |

---

## Project Structure

```
Arise/
├── mobile/                          ← THE APP (this is what becomes the APK)
│   ├── App.js                       ← Entry point: navigation setup, providers, modals
│   ├── index.js                     ← Very first file that runs: registers App + crash patches
│   ├── app.json                     ← App config: name, icon, permissions, plugins
│   ├── package.json                 ← Dependencies list (what libraries we use)
│   ├── babel.config.js              ← JavaScript compiler config
│   ├── eas.json                     ← Cloud build configuration (EAS)
│   │
│   ├── assets/                      ← Images: app icon, splash screen, logo
│   │   ├── icon.png                 ← App launcher icon (1024x1024)
│   │   ├── adaptive-icon.png        ← Android adaptive icon (foreground)
│   │   ├── splash.png               ← Splash screen shown on app open
│   │   ├── notification-icon.png    ← Small icon for notifications
│   │   └── logo.svg                 ← Vector version of the Arise mark
│   │
│   ├── scripts/
│   │   └── generate-icons.js        ← Script that creates the PNG icons from code
│   │
│   ├── modules/
│   │   └── solo-app-blocker/        ← Native Android module for system-wide app blocking
│   │       ├── app.plugin.js        ← Expo plugin that injects the native code during build
│   │       ├── android/             ← Kotlin source code for the AccessibilityService
│   │       └── README.md            ← How to enable it
│   │
│   └── src/                         ← ALL APP SOURCE CODE
│       ├── engine/                  ← Pure math/logic (no UI, no database)
│       │   ├── constants.js         ← All game constants: ranks, body types, combat types
│       │   ├── transformationEngine.js ← BMR/TDEE/macros/plan generation + meal plans
│       │   ├── bodyMetrics.js       ← Navy body fat, natural potential, muscle-gain rates
│       │   ├── adaptiveEngine.js    ← Self-correcting calorie calibration from real data
│       │   └── combatEngine.js      ← Combat training session generator
│       │
│       ├── db/                      ← Database layer (offline storage)
│       │   ├── database.js          ← Creates/opens SQLite DB, defines ALL tables
│       │   └── repositories.js      ← ALL data operations (CRUD) + business logic
│       │
│       ├── data/
│       │   └── foods.js             ← Offline food database (120+ items with macros)
│       │
│       ├── services/                ← Background services (sensors, notifications, sync)
│       │   ├── pedometer.js         ← Hardware step counter (throttled, battery-safe)
│       │   ├── notifications.js     ← Local scheduled notifications (offline)
│       │   ├── backgroundTasks.js   ← OS-scheduled periodic tasks (step sync, day processing)
│       │   ├── sync.js              ← Optional cloud sync (pushes to backend when online)
│       │   ├── appBlocker.js        ← App-blocking bridge (in-app + native if available)
│       │   └── monetization.js      ← Freemium/paywall logic (RevenueCat scaffold)
│       │
│       ├── store/
│       │   └── AppContext.js        ← Global app state + startup bootstrap logic
│       │
│       ├── theme/
│       │   └── theme.js             ← Colors, spacing, fonts, shadows (design system)
│       │
│       ├── components/              ← Reusable UI pieces
│       │   ├── ui.js                ← Card, Button, ProgressBar, Badge, etc.
│       │   ├── Logo.js              ← SVG logo component
│       │   ├── LineChart.js         ← Weight/strength trend chart
│       │   ├── LevelUpModal.js      ← Celebration popup on level-up
│       │   ├── AchievementModal.js  ← Celebration popup on achievement unlock
│       │   ├── LockdownOverlay.js   ← Full-screen punishment lockdown
│       │   ├── ErrorBoundary.js     ← Catches JS crashes, shows reason instead of blank
│       │   └── BarcodeScanner.js    ← Camera barcode scanner modal
│       │
│       └── screens/                 ← Full pages (what the user sees)
│           ├── OnboardingScreen.js  ← First-time setup wizard (name, body, goals)
│           ├── DashboardScreen.js   ← Home: stats, quests progress, quick loggers
│           ├── QuestsScreen.js      ← Today's daily quests (tap to complete)
│           ├── DietScreen.js        ← Food logging + AI meal plan + barcode
│           ├── StepsScreen.js       ← Step counter ring + weekly chart
│           ├── CombatScreen.js      ← Combat training (pick art, generate session)
│           ├── StrengthScreen.js    ← Strength/1RM tracking + progression charts
│           ├── ProgressScreen.js    ← Adaptive calibration, measurements, photos, achievements
│           ├── ProfileScreen.js     ← Player card, stats, body info, weight update
│           ├── SystemScreen.js      ← Punishment status, blocked apps, rules
│           ├── SettingsScreen.js    ← Units, diet prefs, sync, notifications, export, reset
│           ├── PaywallScreen.js     ← Hunter Pro upgrade (freemium)
│           └── MoreScreen.js        ← Menu linking to Combat, Strength, System, etc.
│
├── server/                          ← OPTIONAL backend (only for cloud sync)
│   ├── index.js                     ← Express server entry point
│   ├── config/
│   │   ├── database.js              ← Server-side SQLite setup + schema
│   │   └── constants.js             ← Same game constants (shared logic)
│   ├── middleware/
│   │   └── auth.js                  ← JWT authentication
│   ├── routes/                      ← API endpoints
│   │   ├── auth.js                  ← Register/login/me
│   │   ├── profile.js               ← Body setup, transformation plan, weight, stats
│   │   ├── quests.js                ← Daily quest CRUD
│   │   ├── diet.js                  ← Food logging + meal plans
│   │   ├── steps.js                 ← Step tracking
│   │   ├── combat.js                ← Combat training
│   │   ├── punishment.js            ← Punishment system
│   │   ├── activity.js              ← General activity logging
│   │   └── sync.js                  ← Mobile app sync endpoint
│   └── services/                    ← Server-side business logic
│       ├── transformationEngine.js  ← Same as mobile engine
│       ├── questEngine.js           ← Quest generation + XP
│       ├── stepTracker.js           ← Step calculations
│       ├── combatTraining.js        ← Combat session generator
│       └── punishmentSystem.js      ← Punishment enforcement
│
├── client/                          ← OPTIONAL web dashboard (React + Vite)
│   └── (web UI — mirrors mobile features for browser access)
│
├── DOCUMENTATION.md                 ← THIS FILE
├── README.md                        ← Quick project overview
└── .gitignore                       ← Files Git should ignore
```

---

## How the App Works

### Startup Flow:
```
User opens app
    → index.js runs (patches crash bugs)
    → App.js loads
    → AppContext.bootstrap() runs:
        → Opens SQLite database (creates tables if first time)
        → Checks: does a player profile exist?
            → NO  → Show OnboardingScreen (setup wizard)
            → YES → Generate today's quests if not already done
                   → Start pedometer (step counting)
                   → Schedule notifications
                   → Show DashboardScreen
```

### Daily Loop:
```
Morning:
    → App generates daily quests based on your plan + level
    → Notification reminds you

During day:
    → Steps auto-counted by phone's hardware sensor
    → You log food (search DB or scan barcode)
    → You complete workouts (tap quests or log activities)
    → You log water/sleep with quick buttons
    → Quest progress bars update in real-time

End of day (11:59 PM or next app open):
    → System evaluates: did you complete ≥70% of quests?
        → YES → Streak +1, XP awarded, maybe level up
        → NO  → Punishment applied (apps blocked, XP drained, lockdown)
```

### Data Flow:
```
User action (e.g., logs food)
    → Repository function called (e.g., DietRepo.log())
    → Data written to SQLite (on-device, instant, offline)
    → Quest sync triggered (checks if diet quest is now complete)
    → If quest completed → XP awarded → check level up
    → UI refreshes to show new state
```

---

## Every Feature Explained

### 1. Body Assessment & Transformation Plan
**What:** User enters height, weight, age, gender, activity level, optional measurements (neck, waist, hip, wrist, ankle).
**How:** `transformationEngine.js` uses Mifflin-St Jeor equation for BMR, multiplies by activity factor for TDEE, calculates target weight from chosen body type, determines calorie surplus/deficit, splits into macros.
**Accuracy trick:** If user provides tape measurements → uses US Navy body-fat formula (±3-4% vs DEXA scan). Else estimates from BMI correlation.

### 2. 12 Body Types
**What:** Lean Athletic, Muscular Bulk, Aesthetic V-Taper, Swimmer's Build, Combat Fighter, Calisthenics Master, Powerlifter, Shredded Model, Functional Athlete, Endurance Runner, Spartan Warrior, Superhero.
**How:** Each body type has a target BMI range, target body-fat %, training split, and step multiplier defined in `constants.js`. The engine uses these to generate the plan.

### 3. Daily Quests (Solo Leveling Style)
**What:** 6-7 quests per day: training session, steps, protein target, hydration, calorie target, sleep, bonus combat.
**How:** `transformationEngine.generateDailyQuestTemplates()` creates quests based on the day's training split, player level (harder quests at higher levels), and body type. Stored in `daily_quests` table.

### 4. XP / Level / Rank System
**What:** Complete quests → earn XP → level up → unlock stat points → rank up (E→D→C→B→A→S→SS).
**How:** XP formula: `100 * 1.15^(level-1)` per level (exponential curve). Rank thresholds in `constants.js`. On level-up: +3 stat points, rank recalculated, title updated, modal shown.

### 5. Stat Points (RPG System)
**What:** 8 stats: Strength, Agility, Endurance, Vitality, Discipline, Combat Power, Intelligence, Perception. Allocate 3 points per level-up.
**How:** Stored in `player_stats` table. UI in ProfileScreen lets you +/- and confirm.

### 6. Diet Monitoring
**What:** Log food → tracks calories, protein, carbs, fats → auto-completes diet quests.
**How:** Three ways to log: (a) search offline food database, (b) manual entry, (c) barcode scan (Open Food Facts API when online). All stored in `diet_logs` table. `DietRepo.syncQuests()` checks if protein/calorie targets met.

### 7. AI Meal Plans
**What:** App suggests 4 meals/day matching your calorie/macro targets AND dietary preferences (veg/vegan/eggetarian + allergies).
**How:** `transformationEngine.generateMealPlan()` has tagged meal templates, filters by diet preference, scales portions to match your calorie target.

### 8. Step Counter
**What:** Counts steps using phone's hardware sensor. Shows daily progress ring, weekly chart.
**How:** `pedometer.js` subscribes to `expo-sensors Pedometer.watchStepCount`. THROTTLED: accumulates in memory, writes to DB every 6 seconds (not every tick — prevents lag). Calculates distance (stride length × steps) and calories (0.57 kcal/kg/km).

### 9. Combat Training (8 Disciplines)
**What:** Boxing, Muay Thai, BJJ, MMA, Wrestling, Karate, Kickboxing, Krav Maga. Pick skill level + duration → get a generated workout session.
**How:** `combatEngine.js` has exercise databases per sport per skill level. Scales exercise durations to fit requested total. Tracks stats (sessions, minutes, calories).

### 10. Strength / 1RM Tracking
**What:** Log sets (exercise, weight, reps) → app calculates estimated 1-Rep Max using Epley formula. Tracks personal records and progression over time.
**How:** Epley: `1RM = weight × (1 + reps/30)`. Stored in `strength_logs`. `StrengthRepo.personalRecords()` finds max 1RM per exercise.

### 11. Punishment System
**What:** Miss ≥30% of daily quests → punishments activate:
- 30-50% missed → Entertainment blocked (12h)
- 50-70% missed → Social media blocked (24h) + extra workout
- 70%+ missed → FULL LOCKDOWN + XP drain
- Break a 7-day streak → Cold shower penalty
**How:** `DayProcessor.processDate()` evaluates completion rate, calls `PunishmentRepo.apply()` which writes to `punishments` + `blocked_apps` tables. `LockdownOverlay` component shows a full-screen blocker requiring a 30-min redemption workout.

### 12. App Blocking (System-Wide)
**What:** When punished, specific apps (Instagram, YouTube, etc.) are blocked.
**How:** Two layers:
- **In-app lockdown** (always works): Shows full-screen overlay, user can't use Arise until redeemed.
- **System-wide** (optional native module): Kotlin `AccessibilityService` watches which app is in foreground → if it's on the block list → sends user back to home screen. Requires user to grant Accessibility permission manually.

### 13. Adaptive Calibration (The Accuracy Core)
**What:** After 10-14 days of logging, the app learns your TRUE maintenance calories from real data (not just formula guess) and recalibrates targets.
**How:** `adaptiveEngine.js`:
1. Smooths daily weight with EMA (removes water noise)
2. Calculates: `real_maintenance = avg_intake - (weight_change_kcal / days)`
3. Compares to formula TDEE → adjusts calorie target
4. Projects new goal date from observed rate (not planned)
Reports confidence: insufficient/low/medium/high.

### 14. Natural Muscular Potential (Casey Butt)
**What:** Predicts your realistic drug-free maximum muscle mass from wrist + ankle circumference.
**How:** Casey Butt formula: `LBM = H^1.5 × (√wrist/22.667 + √ankle/17.0104) × (bf/224 + 1)`. Keeps goals honest — shows what's genuinely achievable naturally.

### 15. Progress Photos
**What:** Take/import photos to visually track transformation. Stored only on device.
**How:** `expo-image-picker` for camera/gallery → URI stored in `progress_photos` table → displayed in a horizontal scroll gallery.

### 16. Achievements
**What:** Badges for milestones (first quest, 7-day streak, level 50, 1M steps, etc.)
**How:** `AchievementRepo.check()` evaluates conditions against current stats. Newly-unlocked ones trigger a modal + notification.

### 17. Background Sync
**What:** Even when app is closed, OS periodically wakes it to sync steps + process missed days + push sync queue.
**How:** `expo-background-fetch` + `expo-task-manager` register a periodic task (OS controls frequency, ~15 min minimum). Task defined in `backgroundTasks.js`.

### 18. Cloud Sync (Optional)
**What:** If enabled, changes push to a backend server for multi-device backup.
**How:** `sync.js` service queues changes in `sync_queue` table → `pushQueue()` POSTs them to `/api/sync` when online. Backend stores in `sync_data` table.

### 19. Monetization (Freemium)
**What:** Free tier = full offline tracking. Pro = unlimited meal plans, all combat arts, analytics, themes, export.
**How:** `monetization.js` has product definitions + feature gates. `PaywallScreen` shows plans. Wire to RevenueCat for real IAP.

### 20. Data Export
**What:** Export all your data as JSON + weight history as CSV.
**How:** `ExportRepo.allData()` reads every table → `toCSV()` formats it → `expo-file-system` writes → `expo-sharing` shares.

---

## Code Explained — File by File

### `index.js` — The Very First File
```javascript
// Patches a crash bug where React Navigation v6 sends 'accessibilityState'
// as an object, but React Native 0.74 expects aria-* props instead.
// Without this patch, app crashes immediately on Android.
if (Platform.OS === 'android') {
  UIManager.updateView = function(tag, className, props) {
    // Convert legacy format to new format before it reaches native layer
    if (props.accessibilityState) {
      props['aria-selected'] = state.selected;  // etc.
      delete props.accessibilityState;
    }
    return original(tag, className, props);
  }
}
registerRootComponent(App);  // Tell Expo "this is the root component"
```

### `App.js` — Navigation Structure
```javascript
// 5 bottom tabs + a "More" menu that links to extra screens
// Tab screens: Dashboard, Quests, Diet, Steps, Progress, More
// Stack screens (from More): Combat, Strength, System, Profile, Settings, Paywall
// Modals: LevelUpModal, AchievementModal, LockdownOverlay
// ErrorBoundary wraps everything → catches crashes, shows reason
```

### `engine/constants.js` — Game Rules
```javascript
// Defines: ranks (E to SS with level ranges), 12 body types (with target body fat,
// training focus), activity level multipliers, combat sport calorie burns,
// punishment types and their severity/duration, XP curve formula.
// Pure data — no logic, no side effects.
```

### `engine/transformationEngine.js` — The Brain
```javascript
// calculateBMR(weight, height, age, gender)
//   → Mifflin-St Jeor: (10 × kg) + (6.25 × cm) - (5 × age) + 5 (male) or -161 (female)
//
// calculateTDEE(bmr, activityLevel)
//   → BMR × multiplier (1.2 to 1.9)
//
// generateTransformationPlan(profile)
//   → Computes everything: target weight, calorie target, macros, phases,
//     step target, training split. Uses realistic muscle-gain and fat-loss rates.
//
// generateDailyQuestTemplates(plan, dayOfWeek, playerLevel)
//   → Creates 6-7 quest objects based on today's training split and targets.
//
// generateMealPlan(nutrition, prefs)
//   → Picks meals matching diet preference + allergies, scales to calorie target.
```

### `db/database.js` — Storage Schema
```javascript
// Opens/creates 'sololevelling.db' on the device
// Creates 15+ tables: player_profile, body_profile, player_stats, daily_quests,
//   diet_logs, step_logs, activity_logs, combat_training, punishments,
//   blocked_apps, weight_history, body_measurements, checkins, strength_logs,
//   sleep_logs, water_logs, achievements, progress_photos, settings, sync_queue
// Runs migrations (adds new columns to existing tables without data loss)
```

### `db/repositories.js` — All Business Logic
```javascript
// ProfileRepo    → create hunter, setup body, update weight, allocate stats, award XP
// QuestRepo      → generate daily quests, track progress, complete, process end-of-day
// DietRepo       → log food, get totals, sync diet quests, generate meal plan
// StepRepo       → set/add steps, compute distance/calories, sync step quests
// ActivityRepo   → log any exercise, sync exercise quests
// CombatRepo     → generate sessions, log combat, track stats
// PunishmentRepo → apply punishments, block apps, check status, redeem lockdown
// DayProcessor   → evaluate a day's quests, update streak, apply punishments
// MeasurementRepo→ log body measurements, compute Navy BF, track changes
// CheckinRepo    → run adaptive calibration, store results
// WaterRepo      → quick water logging, sync hydration quests
// SleepRepo      → quick sleep logging, sync sleep quests
// StrengthRepo   → log sets, compute 1RM (Epley), track PRs
// PhotoRepo      → add/list progress photos
// ExportRepo     → dump all data as JSON/CSV
// SettingsRepo   → key-value settings storage
// AchievementRepo→ check conditions, unlock badges
```

### `services/pedometer.js` — Step Counting
```javascript
// Key design: THROTTLED writes
// Problem: sensor fires every step (100+/minute while walking)
// If we write to DB every tick → app freezes
// Solution: accumulate in memory variable, flush to DB every 6 seconds
//   or when +40 steps accumulated (whichever comes first)
// This keeps UI smooth and DB writes serialized (no "database locked")
```

### `store/AppContext.js` — Global State
```javascript
// Provides to all screens: profile, stats, body, punishmentStatus
// bootstrap() → called once on app start, initializes everything (crash-safe)
// handleRewards() → called after any XP-earning action, checks level-ups + achievements
// Every side-effect is wrapped in try/catch ("safe" function) so one failure
//   never blocks the entire app from loading
```

---

## How to Build & Install

### Method A: EAS Cloud (no setup, free, slow queue)
```bash
cd Arise/mobile
npm install
npx expo install --fix
eas login                    # free Expo account
eas init                     # link project
eas build --platform android --profile preview   # wait for cloud build
# Download APK from link → install on phone
```

### Method B: Local Build via Android Studio GUI (NO COMMANDS)
1. Open **Android Studio**
2. File → Open → select `C:\Users\gurud\Arise\mobile\android` folder
3. Wait for Gradle sync to complete (first time downloads a lot)
4. Connect phone via USB (USB Debugging ON)
5. Top toolbar → select your device from the dropdown
6. Click the **green play button ▶** (or Build → Build Bundle(s)/APK(s) → Build APK)
7. Wait → APK builds → installs on phone automatically

### Method C: Local Build via Command (what we've been doing)
```bash
cd C:\Users\gurud\Arise\mobile
git pull
npm install
npx expo prebuild --clean
npx expo run:android --variant release
```

### Method D: Generate APK file only (then manually install)
```bash
cd C:\Users\gurud\Arise\mobile\android
.\gradlew assembleRelease
# APK at: android\app\build\outputs\apk\release\app-release.apk
# Install: adb install app-release.apk
```

---

## How to Modify

### Add a new screen:
1. Create `src/screens/MyScreen.js`
2. Add it to `App.js` in the navigator
3. Add a link to it in `MoreScreen.js`

### Add a new food to the database:
1. Open `src/data/foods.js`
2. Add an entry: `{ name: 'My Food', unit: 'g', cal: 200, p: 20, c: 25, f: 5 }`

### Change calorie/macro formulas:
1. Open `src/engine/transformationEngine.js`
2. Modify `calculateBMR()`, `calculateMacros()`, etc.

### Add a new quest type:
1. In `transformationEngine.js` → `generateDailyQuestTemplates()` → add a quest object
2. In `repositories.js` → ensure the quest's category syncs correctly

### Change punishment rules:
1. In `transformationEngine.js` → `determinePunishment()` → adjust thresholds
2. In `repositories.js` → `DayProcessor.processDate()` → adjust completion rate checks

### Change the logo:
1. Edit `scripts/generate-icons.js` (colors, shapes)
2. Run `node scripts/generate-icons.js` → regenerates all PNGs
3. Or edit `src/components/Logo.js` for the in-app SVG version

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App crashes on open ("keeps stopping") | Check `adb logcat` for FATAL EXCEPTION. Usually a native module version mismatch → run `npx expo install --fix` |
| "Signatures do not match" on install | Run `adb uninstall com.sololevelling.app` first, then reinstall |
| Build fails at "downloadSQLite" | Internet issue — SQLite source needs to download once. Retry with stable connection |
| Steps not counting | Ensure "Activity Recognition" permission is granted in phone Settings |
| Notifications not coming | Ensure "Notifications" permission granted + battery optimization disabled for Arise |
| App is slow/laggy | Likely too many DB writes — we've throttled pedometer and achievements, should be smooth now |
| "Module not found" error | Run `npm install` again, then `npx expo prebuild --clean` |
| Barcode not working | Needs a dev/release build (not Expo Go). Grant camera permission |

---

## Scientific Formulas Used

| Formula | Purpose | Accuracy |
|---------|---------|----------|
| Mifflin-St Jeor | Calculate BMR (calories at rest) | ±10% for most people |
| Katch-McArdle | BMR from lean body mass (when BF% known) | ±5% (more accurate) |
| US Navy Method | Body fat % from tape measurements | ±3-4% vs DEXA |
| Casey Butt | Natural muscular potential ceiling | Well-validated for drug-free |
| Epley | Estimated 1-Rep Max from submaximal set | ±5% for 1-10 rep range |
| Energy Balance | maintenance = intake - (Δweight × 7700) / days | Self-correcting over 14+ days |
| EMA Smoothing | Remove daily water-weight noise from trend | Standard in quantitative finance/health |

---

## Credits & License

Built by **RishiPlaysCodes**. All code in this repository.
Inspired by "Solo Leveling" (나 혼자만 레벨업) by Chugong.
MIT License — use it however you want.
