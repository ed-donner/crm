# Personal CRM

A simple sales CRM you run on your own computer — think of it as your own private
Salesforce. It runs locally, needs no login, and works entirely on your machine.

It tracks the everyday CRM essentials: organizations, contacts and deals; a visual
sales pipeline you can drag deals through; notes and follow-ups; and a dashboard
that shows how things are going. It ships pre-loaded with realistic sample data, so
every screen looks alive on first launch.

See [`AGENTS.md`](./AGENTS.md) for the full requirements.

## One-command start

```bash
npm start
```

Then open **http://localhost:5173** in your browser.

That's it — no accounts, no cloud, no internet. The app auto-seeds itself with
sample data (organizations, contacts, deals spread across the pipeline, and
activities) the first time it runs, so it looks alive immediately.

> **Want the live dev experience** (hot reload while you edit)? Use `npm run dev`
> instead — it starts both the Vite dev server and the API together.

## What's inside

Five sections, all in the sidebar:

- **Dashboard** (the landing page) — deals won per month, revenue won per month,
  a recent-activity feed, and a list of upcoming & overdue tasks.
- **Organizations** — searchable table; click a row to see its contacts and deals.
- **Contacts** — searchable table, filterable by status (lead / qualified / customer);
  click a contact for its activity timeline.
- **Deals** — searchable table showing stage, value, close date, org and contact.
- **Pipeline** — drag-and-drop board: drag a deal card between columns to change
  its stage (New → Qualified → Proposal → Negotiation → Won → Lost).

From any contact or deal detail page you can log an activity (note / call / email)
and give it an optional due date, which turns it into a task that shows on the
dashboard.

Every record type supports **add, search, edit and delete**, and all changes
persist to a local SQLite database file (`data/crm.sqlite`), so they survive a
browser refresh or an app restart.

## Commands

| Command           | What it does                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `npm start`       | Start the production server (built frontend + API on port 5173).    |
| `npm run dev`     | Start Vite dev server + API together (hot reload).                 |
| `npm run build`   | Build the frontend into `dist/`.                                   |
| `npm test`        | Run the unit tests (CRUD, search, stage changes, activities).     |
| `npm run seed`    | Wipe and re-seed the database with the sample dataset.             |
| `npm run typecheck` | Type-check the whole project (app + server).                     |

## How it's built

- **Vite + React + TypeScript** for a single web app.
- **Express + better-sqlite3** for a small local API and a SQLite database file.
- **TanStack Table** for the data tables, **Recharts** for the dashboard charts,
  and **dnd-kit** for the drag-and-drop pipeline — all popular, well-supported
  libraries rather than hand-rolled code.
- Stores its data locally on your machine in `data/crm.sqlite` (gitignored).

### Project layout

```
server/          Express API + SQLite data layer (repositories, dashboard, seed)
  db.ts          open/create the SQLite database + schema
  schema.ts       table definitions
  repositories.ts all CRUD + search + validation for the four record types
  dashboard.ts    dashboard aggregation (deals won/revenue per month, tasks)
  seed.ts         realistic sample data + CLI (`npm run seed`)
  routes.ts       REST routes → /api/*
  index.ts        the server (serves API + built frontend on one port)
src/             React frontend (pages, components, forms, api client)
tests/           unit tests (vitest)
```

## Notes

- Single currency only (US dollars). Pipeline stages are fixed.
- No login or user accounts — single-user and local.
- The database file is created on first run. To reset to the sample data, run
  `npm run seed`, or just delete `data/crm.sqlite` and restart.
