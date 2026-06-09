# DohaPulse — Event Operations Platform

A full-stack platform for planning, staffing, and operating global sporting
events across their entire lifecycle — from bidding to legacy. Built for the
**Asian Games 2030, Doha, Qatar**, and reusable for future events.

## Features

- **Staff & Engineers** — register personnel, capture specializations, search &
  filter, and view per-person assignment and task history.
- **Events & Lifecycle** — manage events through 7 phases
  (Bidding → Planning → Construction → Testing → Readiness → Games-time → Legacy)
  with auto-generated phase timelines and progress derived from tasks.
- **Venues** — manage competition and operational venues with type, capacity,
  and status.
- **Tasks** — full task management with subtasks, dependencies, priorities, and
  three views: **Kanban board** (drag-and-drop), **List**, and **Gantt chart**.
- **Event Journey** — a multi-year visual timeline of every event's phases with
  a live "now" marker.
- **Dashboards** — operational KPIs, upcoming deadlines, and task breakdowns.
- **Notifications** — in-app alerts on task assignment, comments, and assignments.
- **Role-based access** — Admin, Manager, and Engineer/Staff tiers.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** ORM + **PostgreSQL**
- **NextAuth.js** (credentials, JWT sessions)
- **Tailwind CSS** + a lightweight in-house component kit
- **Recharts**, **lucide-react**, **date-fns**, **zod**

## Getting Started

### 1. Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database (Docker recommended)

### 2. Configure environment

```bash
cp .env.example .env
# edit DATABASE_URL and NEXTAUTH_SECRET as needed
```

### 3. Start the database

```bash
docker compose up -d        # starts PostgreSQL on localhost:5432
```

### 4. Install, migrate, and seed

```bash
npm install
npm run db:push             # creates the schema
npm run db:seed             # loads Asian Games 2030 sample data
```

### 5. Run the app

```bash
npm run dev                 # http://localhost:3000
```

## Demo Accounts (after seeding)

| Role     | Email                          | Password   |
| -------- | ------------------------------ | ---------- |
| Admin    | admin@asiangames2030.qa        | `Passw0rd!` |
| Manager  | manager@asiangames2030.qa      | `Passw0rd!` |
| Engineer | engineer@asiangames2030.qa     | `Passw0rd!` |

## Useful Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Generate Prisma client + build       |
| `npm run db:push`   | Push the Prisma schema to the DB     |
| `npm run db:migrate`| Create & apply a migration           |
| `npm run db:seed`   | Seed sample data                     |
| `npm run db:studio` | Open Prisma Studio                   |

## Project Structure

```
prisma/
  schema.prisma         # data model (Users, Events, Phases, Venues, Tasks, …)
  seed.ts               # Asian Games 2030 sample data
src/
  app/
    (dashboard)/        # authenticated app (dashboard, events, tasks, …)
    login/              # auth screen
    api/                # REST route handlers
  components/           # UI kit + feature components
  lib/                  # prisma client, auth, helpers, validations
  services/             # business logic (events, tasks, notifications)
```

## Roadmap (post-MVP)

- Email notifications & deadline cron jobs
- Arabic (RTL) localization
- Budget / finance and ticketing modules
- Real-time collaboration
