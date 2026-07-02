import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb, type DB } from "../server/db.js";
import {
  createActivity,
  createContact,
  createDeal,
  createOrganization,
  deleteActivity,
  deleteContact,
  deleteDeal,
  deleteOrganization,
  getContactDetail,
  getDealDetail,
  getOrganizationDetail,
  listActivities,
  listContacts,
  listDeals,
  listOrganizations,
  setActivityDone,
  updateContact,
  updateDeal,
  updateDealStage,
  updateOrganization,
  HttpError,
} from "../server/repositories.js";
import { seedDatabase } from "../server/seed.js";

let db: DB;

beforeEach(() => {
  db = createMemoryDb();
});

afterEach(() => {
  db.close();
});

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

describe("organizations CRUD + search", () => {
  it("creates, reads, updates and deletes an organization", () => {
    const created = createOrganization(db, {
      name: "Acme Corp",
      website: "acme.example.com",
      industry: "Manufacturing",
      notes: "Big customer",
    });
    expect(created.id).toBeGreaterThan(0);
    expect(created.name).toBe("Acme Corp");
    expect(created.website).toBe("acme.example.com");

    const detail = getOrganizationDetail(db, created.id);
    expect(detail?.industry).toBe("Manufacturing");

    const updated = updateOrganization(db, created.id, {
      name: "Acme Corp II",
      website: "",
      industry: "Retail",
      notes: "",
    });
    expect(updated.name).toBe("Acme Corp II");
    // empty optional strings become null
    expect(updated.website).toBeNull();
    expect(updated.notes).toBeNull();

    expect(deleteOrganization(db, created.id)).toBe(true);
    expect(getOrganizationDetail(db, created.id)).toBeUndefined();
    expect(deleteOrganization(db, created.id)).toBe(false); // already gone
  });

  it("requires a name", () => {
    expect(() => createOrganization(db, { name: "   " })).toThrow(HttpError);
  });

  it("searches organizations by name, industry and website", () => {
    createOrganization(db, { name: "Acme Corp", industry: "Manufacturing", website: "acme.com" });
    createOrganization(db, { name: "Globex", industry: "Logistics", website: "globex.com" });
    createOrganization(db, { name: "Initech", industry: "Software", website: "initech.com" });

    expect(listOrganizations(db, "acme")).toHaveLength(1);
    expect(listOrganizations(db, "logistics")).toHaveLength(1);
    expect(listOrganizations(db, "globex.com")).toHaveLength(1);
    expect(listOrganizations(db, "xyz")).toHaveLength(0);
    expect(listOrganizations(db)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

describe("contacts CRUD + search + status filter", () => {
  function seed() {
    const org1 = createOrganization(db, { name: "Acme" });
    const org2 = createOrganization(db, { name: "Globex" });
    createContact(db, { name: "Alice Lee", email: "alice@acme.com", phone: "555-1", job_title: "CEO", organization_id: org1.id, status: "qualified" });
    createContact(db, { name: "Bob Ray", email: "bob@globex.com", phone: "555-2", job_title: "Engineer", organization_id: org2.id, status: "customer" });
    createContact(db, { name: "Carol Lee", email: "carol@acme.com", phone: "555-3", job_title: "PM", organization_id: org1.id, status: "lead" });
  }

  it("creates a contact linked to an organization", () => {
    const org = createOrganization(db, { name: "Acme" });
    const c = createContact(db, { name: "Alice", email: "alice@acme.com", organization_id: org.id, status: "lead" });
    expect(c.organization_id).toBe(org.id);
    expect(c.organization_name).toBe("Acme");
    expect(c.status).toBe("lead");
  });

  it("defaults status to lead", () => {
    const c = createContact(db, { name: "Solo" });
    expect(c.status).toBe("lead");
  });

  it("filters by status", () => {
    seed();
    expect(listContacts(db, { status: "lead" })).toHaveLength(1);
    expect(listContacts(db, { status: "qualified" })).toHaveLength(1);
    expect(listContacts(db, { status: "customer" })).toHaveLength(1);
  });

  it("searches by name, email and organization name", () => {
    seed();
    expect(listContacts(db, { search: "alice" })).toHaveLength(1); // name Alice
    expect(listContacts(db, { search: "acme.com" })).toHaveLength(2); // two acme emails
    expect(listContacts(db, { search: "acme" })).toHaveLength(2); // org name Acme
    expect(listContacts(db, { search: "lee" })).toHaveLength(2); // Alice Lee + Carol Lee
  });

  it("combines search and status filter", () => {
    seed();
    expect(listContacts(db, { search: "lee", status: "lead" })).toHaveLength(1); // Carol
    expect(listContacts(db, { search: "lee", status: "customer" })).toHaveLength(0);
  });

  it("updates and deletes a contact", () => {
    const org = createOrganization(db, { name: "Acme" });
    const c = createContact(db, { name: "Alice", organization_id: org.id, status: "lead" });
    const updated = updateContact(db, c.id, { name: "Alice Smith", status: "customer" });
    expect(updated.name).toBe("Alice Smith");
    expect(updated.status).toBe("customer");
    expect(deleteContact(db, c.id)).toBe(true);
    expect(getContactDetail(db, c.id)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

describe("deals CRUD + search + stage changes", () => {
  function seedDeal(stage = "new", value = 10000) {
    const org = createOrganization(db, { name: "Acme" });
    const contact = createContact(db, { name: "Alice", organization_id: org.id });
    return createDeal(db, {
      name: "Big Deal",
      organization_id: org.id,
      contact_id: contact.id,
      stage,
      value,
      close_date: "2026-07-15",
    });
  }

  it("creates a deal with stage, value, org and contact", () => {
    const deal = seedDeal("proposal", 42500);
    expect(deal.stage).toBe("proposal");
    expect(deal.value).toBe(42500);
    expect(deal.organization_name).toBe("Acme");
    expect(deal.contact_name).toBe("Alice");
  });

  it("updates a deal", () => {
    const deal = seedDeal();
    const updated = updateDeal(db, deal.id, { name: "Bigger Deal", value: 99000, stage: "qualified" });
    expect(updated.name).toBe("Bigger Deal");
    expect(updated.value).toBe(99000);
    expect(updated.stage).toBe("qualified");
  });

  it("changes a deal's stage to won and lost", () => {
    const deal = seedDeal();
    expect(updateDealStage(db, deal.id, "won").stage).toBe("won");
    expect(updateDealStage(db, deal.id, "lost").stage).toBe("lost");
    // persists on re-read
    expect(getDealDetail(db, deal.id)?.stage).toBe("lost");
  });

  it("rejects an invalid stage", () => {
    const deal = seedDeal();
    expect(() => updateDealStage(db, deal.id, "wat")).toThrow(HttpError);
  });

  it("deletes a deal", () => {
    const deal = seedDeal();
    expect(deleteDeal(db, deal.id)).toBe(true);
    expect(getDealDetail(db, deal.id)).toBeUndefined();
  });

  it("searches deals by name, org and contact", () => {
    const org = createOrganization(db, { name: "Acme" });
    const contact = createContact(db, { name: "Alice", organization_id: org.id });
    createDeal(db, { name: "Platform license", organization_id: org.id, contact_id: contact.id, stage: "won", value: 5000 });
    createDeal(db, { name: "Support contract", organization_id: org.id, contact_id: contact.id, stage: "new", value: 1000 });

    expect(listDeals(db, "platform")).toHaveLength(1);
    expect(listDeals(db, "acme")).toHaveLength(2);
    expect(listDeals(db, "alice")).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

describe("activities CRUD + task toggle + timeline order", () => {
  it("creates an activity on a contact and lists it newest first", () => {
    const org = createOrganization(db, { name: "Acme" });
    const contact = createContact(db, { name: "Alice", organization_id: org.id });
    const older = createActivity(db, { type: "note", contact_id: contact.id, description: "first", occurred_at: "2026-06-01" });
    const newer = createActivity(db, { type: "call", contact_id: contact.id, description: "second", occurred_at: "2026-06-10" });

    const timeline = getContactDetail(db, contact.id)!.activities;
    expect(timeline[0].id).toBe(newer.id);
    expect(timeline[1].id).toBe(older.id);
    expect(timeline[0].type).toBe("call");
  });

  it("creates an activity on a deal", () => {
    const org = createOrganization(db, { name: "Acme" });
    const contact = createContact(db, { name: "Alice", organization_id: org.id });
    const deal = createDeal(db, { name: "Deal", organization_id: org.id, contact_id: contact.id, stage: "new", value: 100 });
    const a = createActivity(db, { type: "email", deal_id: deal.id, description: "Sent proposal", due_date: "2026-07-20" });
    expect(a.deal_name).toBe("Deal");
    expect(a.due_date).toBe("2026-07-20");
    expect(a.done).toBe(false);
  });

  it("toggles task completion and it persists", () => {
    const contact = createContact(db, { name: "Alice" });
    const a = createActivity(db, { type: "note", contact_id: contact.id, description: "follow up", due_date: "2026-07-15" });
    expect(setActivityDone(db, a.id, true).done).toBe(true);
    expect(setActivityDone(db, a.id, false).done).toBe(false);
    // persists on re-read
    expect(listActivities(db, { contactId: contact.id })[0].done).toBe(false);
  });

  it("deletes an activity", () => {
    const contact = createContact(db, { name: "Alice" });
    const a = createActivity(db, { type: "note", contact_id: contact.id, description: "x" });
    expect(deleteActivity(db, a.id)).toBe(true);
    expect(listActivities(db, { contactId: contact.id })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Seed data sanity (Phase 1: app launches populated)
// ---------------------------------------------------------------------------

describe("seed data", () => {
  it("populates organizations, contacts, deals and activities", () => {
    seedDatabase(db);
    const orgs = listOrganizations(db);
    const contacts = listContacts(db);
    const deals = listDeals(db);
    expect(orgs.length).toBeGreaterThanOrEqual(5);
    expect(contacts.length).toBeGreaterThanOrEqual(5);
    expect(deals.length).toBeGreaterThanOrEqual(5);

    // Deals span multiple pipeline stages.
    const stages = new Set(deals.map((d) => d.stage));
    expect(stages.size).toBeGreaterThan(1);
    expect(stages.has("won")).toBe(true);

    // Some activities exist.
    expect(listActivities(db).length).toBeGreaterThan(0);

    // Won deals have close dates across multiple months (for the dashboard chart).
    const wonMonths = new Set(
      deals.filter((d) => d.stage === "won" && d.close_date).map((d) => d.close_date!.slice(0, 7)),
    );
    expect(wonMonths.size).toBeGreaterThan(1);
  });

  it("seedIfEmpty only seeds once", () => {
    seedDatabase(db);
    const n = listOrganizations(db).length;
    seedDatabase(db); // re-seeding wipes + re-inserts, so count stays the same
    expect(listOrganizations(db).length).toBe(n);
  });
});
