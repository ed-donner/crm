import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createDb, type DB, DEFAULT_DB_PATH, nowIso } from "./db.js";
import { listOrganizations } from "./repositories.js";

// Realistic sample data so the app looks alive on first launch. References
// between records use array indices and are resolved to real ids during
// seeding. Dates are anchored relative to a mid-2026 "today".

interface OrgSeed {
  name: string;
  website: string;
  industry: string;
  notes: string;
}

interface ContactSeed {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  org: number;
  status: string;
}

interface DealSeed {
  name: string;
  org: number;
  contact: number;
  stage: string;
  value: number;
  closeDate: string;
}

interface ActivitySeed {
  type: string;
  contact: number | null;
  deal: number | null;
  description: string;
  occurredAt: string;
  dueDate: string | null;
  done: boolean;
}

const ORGS: OrgSeed[] = [
  { name: "Northwind Traders", website: "northwind.example.com", industry: "Logistics", notes: "Long-standing logistics partner. Strong on reliability, slower to adopt new tech." },
  { name: "Contoso Ltd", website: "contoso.example.com", industry: "Software", notes: "Fast-growing software company. Evaluating a platform-wide upgrade." },
  { name: "Fabrikam Inc", website: "fabrikam.example.com", industry: "Manufacturing", notes: "Manufacturer of precision parts. Seasonal ordering cycles." },
  { name: "Tailspin Toys", website: "tailspin.example.com", industry: "Retail", notes: "Specialty toy retailer expanding into new regions." },
  { name: "Adventure Works", website: "adventure.example.com", industry: "Outdoor Equipment", notes: "Outdoor gear brand. High repeat purchase rate." },
  { name: "Wide World Importers", website: "wideworld.example.com", industry: "Wholesale", notes: "Wholesale distributor with a large warehouse network." },
  { name: "Litware Inc", website: "litware.example.com", industry: "Healthcare", notes: "Healthcare provider. Strict compliance and security requirements." },
  { name: "Proseware Inc", website: "proseware.example.com", industry: "Consulting", notes: "Boutique consulting firm on a monthly retainer." },
];

const CONTACTS: ContactSeed[] = [
  { name: "Alice Chen", email: "alice.chen@contoso.example.com", phone: "+1 (415) 555-0110", jobTitle: "Procurement Manager", org: 1, status: "qualified" },
  { name: "Bob Patel", email: "bob.patel@fabrikam.example.com", phone: "+1 (312) 555-0142", jobTitle: "VP Operations", org: 2, status: "customer" },
  { name: "Carla Rossi", email: "carla.rossi@northwind.example.com", phone: "+1 (206) 555-0173", jobTitle: "Logistics Lead", org: 0, status: "qualified" },
  { name: "David Kim", email: "david.kim@tailspin.example.com", phone: "+1 (646) 555-0188", jobTitle: "Buyer", org: 3, status: "lead" },
  { name: "Emma Johnson", email: "emma.johnson@adventure.example.com", phone: "+1 (720) 555-0199", jobTitle: "CTO", org: 4, status: "customer" },
  { name: "Frank Müller", email: "frank.muller@wideworld.example.com", phone: "+1 (503) 555-0121", jobTitle: "Director of Supply", org: 5, status: "qualified" },
  { name: "Grace Okafor", email: "grace.okafor@litware.example.com", phone: "+1 (617) 555-0156", jobTitle: "Clinical Ops", org: 6, status: "lead" },
  { name: "Henry Davis", email: "henry.davis@proseware.example.com", phone: "+1 (212) 555-0103", jobTitle: "Managing Partner", org: 7, status: "customer" },
  { name: "Ivy Zhang", email: "ivy.zhang@contoso.example.com", phone: "+1 (415) 555-0111", jobTitle: "Software Engineer", org: 1, status: "lead" },
  { name: "Jack Wilson", email: "jack.wilson@northwind.example.com", phone: "+1 (206) 555-0174", jobTitle: "Operations Coordinator", org: 0, status: "lead" },
  { name: "Karen Lee", email: "karen.lee@fabrikam.example.com", phone: "+1 (312) 555-0143", jobTitle: "CFO", org: 2, status: "qualified" },
  { name: "Liam Brown", email: "liam.brown@adventure.example.com", phone: "+1 (720) 555-0200", jobTitle: "Sales Lead", org: 4, status: "lead" },
  { name: "Mia Santos", email: "mia.santos@wideworld.example.com", phone: "+1 (503) 555-0122", jobTitle: "Procurement Specialist", org: 5, status: "lead" },
  { name: "Noah Garcia", email: "noah.garcia@litware.example.com", phone: "+1 (617) 555-0157", jobTitle: "CIO", org: 6, status: "qualified" },
];

const DEALS: DealSeed[] = [
  { name: "Annual logistics contract", org: 0, contact: 2, stage: "won", value: 48000, closeDate: "2026-01-15" },
  { name: "Manufacturing parts supply", org: 2, contact: 1, stage: "won", value: 125000, closeDate: "2026-02-20" },
  { name: "Software platform license", org: 1, contact: 0, stage: "won", value: 62000, closeDate: "2026-03-10" },
  { name: "Outdoor gear bulk order", org: 4, contact: 4, stage: "won", value: 34000, closeDate: "2026-04-05" },
  { name: "Healthcare systems rollout", org: 6, contact: 13, stage: "won", value: 88000, closeDate: "2026-05-22" },
  { name: "Wholesale distribution deal", org: 5, contact: 5, stage: "won", value: 56000, closeDate: "2026-06-18" },
  { name: "Consulting retainer", org: 7, contact: 7, stage: "won", value: 41000, closeDate: "2026-06-30" },
  { name: "Fleet renewal proposal", org: 0, contact: 2, stage: "negotiation", value: 72000, closeDate: "2026-07-20" },
  { name: "Q3 parts order", org: 2, contact: 10, stage: "proposal", value: 38000, closeDate: "2026-08-15" },
  { name: "Premium platform upgrade", org: 1, contact: 0, stage: "qualified", value: 95000, closeDate: "2026-09-01" },
  { name: "Retail expansion", org: 3, contact: 3, stage: "new", value: 27000, closeDate: "2026-07-30" },
  { name: "Expedition equipment", org: 4, contact: 11, stage: "new", value: 19000, closeDate: "2026-08-30" },
  { name: "Clinical data migration", org: 6, contact: 6, stage: "proposal", value: 64000, closeDate: "2026-09-15" },
  { name: "Backup logistics bid", org: 0, contact: 9, stage: "lost", value: 22000, closeDate: "2026-04-30" },
];

const ACTIVITIES: ActivitySeed[] = [
  { type: "call", contact: 2, deal: 0, description: "Intro call to review annual contract terms and SLAs.", occurredAt: "2026-01-08", dueDate: null, done: true },
  { type: "email", contact: 0, deal: 2, description: "Sent the licensing proposal and volume pricing.", occurredAt: "2026-02-25", dueDate: null, done: true },
  { type: "note", contact: 1, deal: 1, description: "Bob confirmed the Q1 delivery schedule for precision parts.", occurredAt: "2026-02-12", dueDate: null, done: true },
  { type: "call", contact: 4, deal: 3, description: "Discussed bulk discount tiers for the seasonal order.", occurredAt: "2026-03-28", dueDate: null, done: true },
  { type: "note", contact: 13, deal: 4, description: "Kickoff scheduled with the clinical implementation team.", occurredAt: "2026-05-05", dueDate: null, done: true },
  { type: "email", contact: 5, deal: 5, description: "Sent the distribution contract for signature.", occurredAt: "2026-06-10", dueDate: null, done: true },
  { type: "note", contact: 7, deal: 6, description: "Retainer scope finalized for the next two quarters.", occurredAt: "2026-06-20", dueDate: null, done: true },
  { type: "call", contact: 2, deal: 7, description: "Negotiating pricing on the fleet renewal proposal.", occurredAt: "2026-06-28", dueDate: "2026-07-05", done: false },
  { type: "email", contact: 0, deal: 9, description: "Sent the platform upgrade comparison sheet.", occurredAt: "2026-07-01", dueDate: "2026-07-10", done: false },
  { type: "note", contact: 3, deal: 10, description: "Need to qualify requirements before sending a quote.", occurredAt: "2026-06-25", dueDate: "2026-06-30", done: false },
  { type: "call", contact: 10, deal: 8, description: "Left voicemail following up on the Q3 parts proposal.", occurredAt: "2026-06-29", dueDate: "2026-07-08", done: false },
  { type: "note", contact: 6, deal: 12, description: "Awaiting IT security review on the data migration plan.", occurredAt: "2026-06-22", dueDate: "2026-07-15", done: false },
  { type: "email", contact: 11, deal: 11, description: "Sent the latest expedition equipment catalog.", occurredAt: "2026-06-30", dueDate: null, done: true },
];

/** Wipe all tables and insert the sample dataset. Runs inside a transaction. */
export function seedDatabase(db: DB): void {
  const now = nowIso();
  db.transaction(() => {
    db.exec("DELETE FROM activities");
    db.exec("DELETE FROM deals");
    db.exec("DELETE FROM contacts");
    db.exec("DELETE FROM organizations");
    // Reset autoincrement so ids are predictable in a fresh seed.
    db.exec("DELETE FROM sqlite_sequence");

    const orgIds: number[] = [];
    const orgStmt = db.prepare(
      "INSERT INTO organizations (name, website, industry, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const o of ORGS) {
      const r = orgStmt.run(o.name, o.website, o.industry, o.notes, now, now);
      orgIds.push(Number(r.lastInsertRowid));
    }

    const contactIds: number[] = [];
    const contactStmt = db.prepare(
      `INSERT INTO contacts (name, email, phone, job_title, organization_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const c of CONTACTS) {
      const r = contactStmt.run(c.name, c.email, c.phone, c.jobTitle, orgIds[c.org], c.status, now, now);
      contactIds.push(Number(r.lastInsertRowid));
    }

    const dealIds: number[] = [];
    const dealStmt = db.prepare(
      `INSERT INTO deals (name, organization_id, contact_id, stage, value, close_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const d of DEALS) {
      const r = dealStmt.run(d.name, orgIds[d.org], contactIds[d.contact], d.stage, d.value, d.closeDate, now, now);
      dealIds.push(Number(r.lastInsertRowid));
    }

    const actStmt = db.prepare(
      `INSERT INTO activities (type, contact_id, deal_id, description, occurred_at, due_date, done, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const a of ACTIVITIES) {
      actStmt.run(
        a.type,
        a.contact !== null ? contactIds[a.contact] : null,
        a.deal !== null ? dealIds[a.deal] : null,
        a.description,
        a.occurredAt,
        a.dueDate,
        a.done ? 1 : 0,
        now,
        now,
      );
    }
  })();
}

/** Seed only when the database is empty (first launch). */
export function seedIfEmpty(db: DB): void {
  if (listOrganizations(db).length === 0) {
    seedDatabase(db);
  }
}

// When run directly (`npm run seed`), wipe and re-seed the default database.
const isMain = fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");
if (isMain) {
  const db = createDb(process.env.DB_PATH ?? DEFAULT_DB_PATH);
  seedDatabase(db);
  console.log(`Seeded database at ${process.env.DB_PATH ?? DEFAULT_DB_PATH}`);
  db.close();
}
