# Personal CRM — Requirements

## Summary

Personal CRM is a simple sales CRM you run on your own computer — think of it as your own private
Salesforce. It helps one person keep track of the companies and people they sell to, the deals in
progress, and the conversations and follow-ups along the way. It runs locally, needs no login, and
works entirely on your machine.

The goal is a clean, focused tool that does the everyday CRM essentials really well: clear lists of
your organizations, contacts and deals; a visual sales pipeline you can drag deals through; a place
to jot notes and track follow-ups; and a dashboard that shows how things are going. It should feel
sharp and professional, and be genuinely pleasant to use.

## Platform

The app has five sections in the main navigation. Organizations, Contacts and Deals each support the
same basics: **add, search, edit and delete**. On first launch the app comes pre-loaded with
realistic sample data, so every screen looks alive immediately.

- **Dashboard** (the landing page) — an at-a-glance view of how sales are going: a chart of deals won
  per month, revenue won per month, a feed of recent activity, and a list of upcoming and overdue
  follow-ups.
- **Organizations** — the companies you do business with. A searchable table to add, edit and remove
  organizations. Click one to see its details, including its contacts and deals.
- **Contacts** — the people you deal with. A searchable table you can also filter by status (lead,
  qualified, customer). Click a contact to see their details and a timeline of their activity. (A
  "lead" is simply a contact with the lead status — there's no separate leads list.)
- **Deals** — the potential sales you're working on. A searchable table showing each deal's stage,
  value and close date. Click a deal to see its details and activity.
- **Pipeline** — your sales pipeline as a visual board: deals shown as cards in columns, one column
  per stage. Drag a deal from one column to another to update its stage. Stages, in order:
  **New → Qualified → Proposal → Negotiation → Won → Lost**.

From any contact or deal you can log an activity (a note, call or email) and optionally give it a
follow-up due date, which then shows up as a task on the dashboard.

## What the CRM keeps track of

Four kinds of record. (Plain-English fields — the exact details are up to the build.)

- **Organization** — a company you do business with. Key info: name, website, industry, and notes.
  An organization has many contacts and many deals.
- **Contact** — a person you deal with. Key info: name, email, phone, job title, the organization
  they belong to, and a status (lead, qualified, or customer).
- **Deal** — a potential sale. Key info: a name, the organization and the main contact it's with, its
  stage in the pipeline, its value in US dollars, and its expected or actual close date.
- **Activity** — something that happened, or needs to happen, with a contact or deal. Key info: type
  (note, call or email), the contact and/or deal it relates to, a description, when it happened, and
  optionally a due date and whether it's done (so the same record doubles as a follow-up task).

## High-level technical guidance

Just enough direction to keep things on track — specific choices are left to the Coding Agent.

- Build it as a single web app using **Vite, React and TypeScript**.
- It runs fully locally and starts with **one simple command**; no accounts, no cloud, no internet
  needed to use it.
- It stores its data **locally on the machine** in a **SQLite** database file.
- **Prefer popular, well-supported libraries over custom code** — for the data tables, the charts,
  and the drag-and-drop pipeline. Don't hand-roll what a mature library does well.
- Keep the implementation simple and conventional. Library, data and structure choices are the
  Coding Agent's call, as long as the requirements and the success criteria below are met.

## Not in scope (v1)

Deliberately left out to keep this small and focused. Do not build these:

- No login, user accounts, multiple users or permissions — it's single-user and local.
- No AI features (these come later).
- No email, calendar or phone integrations.
- Single currency only (US dollars); no multi-currency.
- No reporting or analytics beyond the dashboard described above.
- No tags or custom fields.
- Pipeline stages are fixed (not user-configurable).
- No table pagination, and no data import or export.

## Look and feel

Applies to the whole app:

- Make it **sharp and modern, but still clean and professional**.
- Use the color palette **`#ecad0a` (amber), `#209dd7` (blue) and `#753991` (purple)**, together
  with grays.
- **Avoid** these — they read as generic "AI-generated" tells: background gradients, purple
  backgrounds, buttons with gradients, and panels or cards with a single accent border line down one
  side.

## Phases and success criteria

Build in these phases, in order. **Do not start a phase until every success criterion of the
previous phase is demonstrably met** — each criterion must be something you can actually show
working, not just assert.

### Phase 1 — Running skeleton and data

**Features**

- A single local web app with the five navigation sections (Dashboard, Organizations, Contacts,
  Deals, Pipeline).
- A SQLite database storing the four record types (organizations, contacts, deals, activities).
- A seed step that fills the database with realistic sample data.
- Unit tests to create, read, update and delete all four record types.

**Success criteria**

1. One documented command starts the app, and opening the given URL shows Personal CRM with all five
   navigation sections.
2. The app launches already populated with sample data: several organizations, several contacts, and
   deals spread across multiple pipeline stages, plus some activities.
3. The unit tests for creating, reading, updating and deleting each record type all pass.

### Phase 2 — Organizations and Contacts

**Features**

- Table views for Organizations and Contacts listing all records.
- Add, edit and delete for organizations and contacts.
- A search box on each table, and a status filter (lead / qualified / customer) on Contacts.
- Detail pages: a Contact shows its organization; an Organization lists its contacts and deals.
- Unit tests for the add / edit / delete / search behavior.

**Success criteria**

1. Organizations and Contacts each show a table listing the sample records.
2. Adding, editing or deleting a record persists — the change is still there after a browser refresh.
3. Typing in a table's search box narrows the list to matching records; Contacts are searchable by at
   least name and email.
4. Filtering Contacts by a status shows only contacts with that status.
5. Clicking a row opens its detail page; a Contact's detail shows its organization, and an
   Organization's detail lists its contacts and deals.
6. The unit tests for add / edit / delete / search all pass.

### Phase 3 — Deals and Pipeline

**Features**

- A Deals table view with add, edit, delete and search.
- Each deal records its stage, value (US dollars), close date, organization and primary contact.
- A Pipeline board showing deals as cards in columns, one per stage (New, Qualified, Proposal,
  Negotiation, Won, Lost).
- Drag-and-drop of a deal card between columns to change its stage.
- Unit tests for changing a deal's stage, including Won and Lost.

**Success criteria**

1. Deals has a table view with add, edit, delete and search, like the others.
2. Each deal displays its stage, value in US dollars, close date, organization and primary contact.
3. The Pipeline shows one column per stage, with each deal as a card in the correct column.
4. Dragging a deal card to another column changes its stage, and the change persists after a refresh
   and matches the Deals table.
5. The unit tests for changing stage (including Won and Lost) all pass.

### Phase 4 — Activities and tasks

**Features**

- Adding an activity (note / call / email) from a Contact or Deal detail page.
- An activity timeline on each contact and deal, newest first.
- An optional due date and done / not-done state on an activity, so it doubles as a task.
- Unit tests for adding activities and toggling task completion.

**Success criteria**

1. From a Contact or Deal detail page you can add an activity (note, call or email), and it appears
   in that record's timeline, newest first.
2. An activity can be given a due date and marked done or not-done.
3. Marking a task done or not-done persists after a refresh.
4. The unit tests for adding activities and toggling completion all pass.

### Phase 5 — Dashboard

**Features**

- The Dashboard as the landing page.
- A chart of deals won per month.
- Revenue (sum of won deal values) per month.
- A feed of recent activity across all records.
- A list of upcoming and overdue tasks.

**Success criteria**

1. The Dashboard is the landing page and shows: deals won per month, revenue won per month, a
   recent-activity feed, and a list of upcoming and overdue tasks.
2. The figures shown match the underlying data (e.g. the count of won deals in a month equals what's
   in the data).
3. After marking a deal Won, or adding an activity or due-dated task, the dashboard reflects the
   change on refresh.

### Phase 6 — Look and feel, and end-to-end validation

**Features**

- The look-and-feel rules applied across the whole app (brand palette with grays; sharp, modern,
  clean, professional).
- Removal of any banned elements (background gradients, purple backgrounds, gradient buttons,
  single-side accent border lines).
- A full end-to-end walkthrough of the running app in a real browser, with visual inspection of every
  screen.

**Success criteria**

1. The whole app follows the look-and-feel rules and contains none of the banned elements.
2. The Coding Agent has driven the running app in a real browser end to end — created, edited,
   searched and deleted records; moved a deal across the pipeline; logged an activity and a task; and
   viewed the dashboard — visually inspecting every screen, not just running unit tests.
3. No errors appear in the browser console during that walkthrough.

## Final success criteria

The project is complete, and the Coding Agent may stop, when **all** of the following are true:

- A non-technical person can start the app with a single documented command and open it in a browser.
- All five sections work: Dashboard, Organizations, Contacts, Deals, Pipeline.
- Every record type supports add, search, edit and delete, and changes persist across refreshes.
- The Pipeline board supports drag-to-change-stage, and the new stage persists.
- Activities and tasks work, and the dashboard accurately reflects the data.
- The app ships with realistic sample data, so it looks alive on first launch.
- The look-and-feel rules are met and none of the banned elements appear anywhere.
- All unit tests pass.
- **Most importantly: the product has been validated by actually using it end to end in a real
  browser — clicking through every section as a real user would, performing the actions above, and
  visually inspecting each screen. Passing unit tests is necessary but NOT sufficient; the Coding
  Agent must confirm the running product works and looks right, not merely that the tests are green.**
