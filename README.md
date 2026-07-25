# Solo Levelling - Fitness Transformation Game

An enterprise-level fitness transformation system inspired by Solo Leveling anime. Transform your body like Sung Jin-Woo transformed from the weakest hunter to the Shadow Monarch.

## Two apps in this repo

| Folder | What it is | Status |
|--------|-----------|--------|
| **`mobile/`** | **Offline-first Expo (React Native) app — the Play Store deliverable.** Works fully offline, battery-efficient hardware step counting, on-device SQLite, local notifications. | Primary |
| `client/` + `server/` | Web app + Node/SQLite backend. Doubles as the **optional cloud-sync backend** for the mobile app's online mode. | Optional |

**Start here → [`mobile/README.md`](./mobile/README.md)** for setup, run, and Play Store build instructions.

---


## Features

### Core System
- **Body Assessment** - Input height, weight, age, body fat %, and activity level
- **12 Body Types** - Choose your target: Lean Athletic, Muscular Bulk, Aesthetic V-Taper, Swimmer's Build, Combat Fighter, Calisthenics Master, Powerlifter, Shredded Model, Functional Athlete, Endurance Runner, Spartan Warrior, Superhero Build
- **AI Transformation Engine** - 99% accurate path calculation using Mifflin-St Jeor, Katch-McArdle formulas
- **Progressive Phases** - Scientifically-designed training phases to reach your goal

### Daily Quest System (Solo Leveling Style)
- Daily quests generated based on your body type and level
- XP rewards for completing quests
- Level-up system with rank progression (E → D → C → B → A → S → SS)
- Stat points allocation on level up (STR, AGI, END, VIT, DIS, CMB, INT, PER)

### Diet Monitoring
- Calorie and macro tracking (Protein, Carbs, Fats)
- AI-generated daily meal plans
- Automatic quest completion based on nutrition intake
- Food logging with meal type categorization

### Step Counter & Activity Monitoring
- Daily step tracking with distance and calorie calculation
- Weekly summaries and progress visualization
- Activity logging for all exercise types
- Automatic verification and quest updates

### Combat Sports Training
- 8 combat disciplines: Boxing, Muay Thai, BJJ, MMA, Wrestling, Karate, Kickboxing, Krav Maga
- Skill-level based training sessions (Beginner/Intermediate/Advanced)
- Technique progressions and exercise breakdowns
- Combat stats tracking

### Punishment System
- **Social Media Block** - Instagram, Twitter, TikTok, etc. blocked
- **Entertainment Blackout** - Netflix, gaming, streaming blocked
- **Full Device Lockdown** - All non-essential apps blocked
- **XP Drain** - Lose experience points
- **Rank Demotion Threat** - Consecutive failures = rank loss
- **Penalty Workouts** - Extra sessions required
- **Ice Penalty** - Cold shower punishment

### Ranking System
| Rank | Level Range | Title |
|------|------------|-------|
| E | 1-10 | Weakest Hunter |
| D | 11-25 | Novice Hunter |
| C | 26-50 | Intermediate Hunter |
| B | 51-75 | Advanced Hunter |
| A | 76-100 | Elite Hunter |
| S | 101-150 | National Level Hunter |
| SS | 151-200 | Shadow Monarch |

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: Node.js, Express, Better-SQLite3
- **Auth**: JWT (JSON Web Tokens)
- **Scheduling**: node-cron for automated end-of-day processing

## Getting Started

```bash
# Install all dependencies
npm run setup

# Start development
npm run dev

# Or start production server (after building client)
npm run build
npm start
```

## API Endpoints

### Auth
- POST `/api/auth/register` - Register new hunter
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Profile
- GET `/api/profile/body-types` - List all body types
- POST `/api/profile/setup` - Set up body profile
- GET `/api/profile/transformation-plan` - Get transformation plan
- PUT `/api/profile/update-weight` - Update weight
- GET `/api/profile/weight-history` - Weight history
- PUT `/api/profile/allocate-stats` - Allocate stat points

### Quests
- GET `/api/quests/today` - Get/generate today's quests
- PUT `/api/quests/:id/progress` - Update quest progress
- POST `/api/quests/:id/complete` - Complete quest
- POST `/api/quests/end-of-day` - Process end of day

### Diet
- POST `/api/diet/log` - Log food
- GET `/api/diet/today` - Today's diet log
- GET `/api/diet/meal-plan` - AI meal plan
- GET `/api/diet/history` - Diet history

### Steps
- POST `/api/steps/log` - Log steps (set total)
- POST `/api/steps/add` - Add incremental steps
- GET `/api/steps/today` - Today's steps
- GET `/api/steps/weekly` - Weekly summary

### Combat
- GET `/api/combat/types` - Combat sport types
- GET `/api/combat/session` - Generate training session
- POST `/api/combat/log` - Log combat session
- GET `/api/combat/stats` - Combat statistics

### Punishment
- GET `/api/punishment/status` - Current restrictions
- GET `/api/punishment/blocked-apps` - Blocked apps list
- POST `/api/punishment/check-daily` - Run punishment check

## The System's Rules

1. Complete 70%+ of daily quests to avoid punishment
2. Steps, diet, and exercises are tracked and verified
3. Punishments are automatic and cannot be bypassed
4. Consistency builds streaks, streaks build rank
5. The System sees all. No cheating.

## Arise.
