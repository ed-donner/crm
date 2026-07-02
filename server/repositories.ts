import { isActivityType, isContactStatus, isStage } from "./constants.js";
import { type DB, nowIso } from "./db.js";
import type {
  Activity,
  ActivityInput,
  ActivityRow,
  Contact,
  ContactDetail,
  ContactInput,
  Deal,
  DealDetail,
  DealInput,
  Organization,
  OrganizationDetail,
  OrganizationInput,
} from "./types.js";

/** Convert a value that might be "" or whitespace into null (for optional text fields). */
function nullable(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

function like(value: string): string {
  return `%${value.toLowerCase()}%`;
}

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export function listOrganizations(db: DB, search?: string): Organization[] {
  const q = (search ?? "").trim();
  const base =
    `SELECT o.*,
            (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) AS contact_count,
            (SELECT COUNT(*) FROM deals d WHERE d.organization_id = o.id) AS deal_count
     FROM organizations o`;
  if (q) {
    return db
      .prepare(
        `${base}
         WHERE LOWER(o.name) LIKE ? OR LOWER(COALESCE(o.industry,'')) LIKE ? OR LOWER(COALESCE(o.website,'')) LIKE ?
         ORDER BY o.name COLLATE NOCASE`,
      )
      .all(like(q), like(q), like(q)) as Organization[];
  }
  return db.prepare(`${base} ORDER BY o.name COLLATE NOCASE`).all() as Organization[];
}

export function getOrganization(db: DB, id: number): Organization | undefined {
  return db.prepare("SELECT * FROM organizations WHERE id = ?").get(id) as Organization | undefined;
}

export function getOrganizationDetail(db: DB, id: number): OrganizationDetail | undefined {
  const org = getOrganization(db, id);
  if (!org) return undefined;
  const contacts = db
    .prepare(
      `SELECT c.*, o.name AS organization_name
       FROM contacts c LEFT JOIN organizations o ON o.id = c.organization_id
       WHERE c.organization_id = ? ORDER BY c.name COLLATE NOCASE`,
    )
    .all(id) as Contact[];
  const deals = db
    .prepare(
      `SELECT d.*, o.name AS organization_name, c.name AS contact_name
       FROM deals d
       LEFT JOIN organizations o ON o.id = d.organization_id
       LEFT JOIN contacts c ON c.id = d.contact_id
       WHERE d.organization_id = ? ORDER BY d.close_date IS NULL, d.close_date, d.name COLLATE NOCASE`,
    )
    .all(id) as Deal[];
  return { ...org, contacts, deals };
}

export function createOrganization(db: DB, input: OrganizationInput): Organization {
  const name = (input.name ?? "").trim();
  if (!name) throw httpError(400, "Name is required");
  const now = nowIso();
  const res = db
    .prepare(
      "INSERT INTO organizations (name, website, industry, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(name, nullable(input.website), nullable(input.industry), nullable(input.notes), now, now);
  return getOrganization(db, Number(res.lastInsertRowid))!;
}

export function updateOrganization(db: DB, id: number, input: OrganizationInput): Organization {
  const existing = getOrganization(db, id);
  if (!existing) throw httpError(404, "Organization not found");
  const name = (input.name ?? "").trim();
  if (!name) throw httpError(400, "Name is required");
  db.prepare(
    "UPDATE organizations SET name=?, website=?, industry=?, notes=?, updated_at=? WHERE id=?",
  ).run(name, nullable(input.website), nullable(input.industry), nullable(input.notes), nowIso(), id);
  return getOrganization(db, id)!;
}

export function deleteOrganization(db: DB, id: number): boolean {
  const res = db.prepare("DELETE FROM organizations WHERE id = ?").run(id);
  return res.changes > 0;
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export function listContacts(
  db: DB,
  opts: { search?: string; status?: string } = {},
): Contact[] {
  const { search, status } = opts;
  const where: string[] = [];
  const params: unknown[] = [];
  if (status) {
    if (!isContactStatus(status)) throw httpError(400, `Invalid status: ${status}`);
    where.push("c.status = ?");
    params.push(status);
  }
  const q = (search ?? "").trim();
  if (q) {
    where.push(
      "(LOWER(c.name) LIKE ? OR LOWER(COALESCE(c.email,'')) LIKE ? OR LOWER(COALESCE(c.phone,'')) LIKE ? OR LOWER(COALESCE(c.job_title,'')) LIKE ? OR LOWER(COALESCE(o.name,'')) LIKE ?)",
    );
    const l = like(q);
    params.push(l, l, l, l, l);
  }
  const sql = `SELECT c.*, o.name AS organization_name
               FROM contacts c LEFT JOIN organizations o ON o.id = c.organization_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY c.name COLLATE NOCASE`;
  return db.prepare(sql).all(...params) as Contact[];
}

export function getContact(db: DB, id: number): Contact | undefined {
  return db
    .prepare(
      `SELECT c.*, o.name AS organization_name
       FROM contacts c LEFT JOIN organizations o ON o.id = c.organization_id
       WHERE c.id = ?`,
    )
    .get(id) as Contact | undefined;
}

export function getContactDetail(db: DB, id: number): ContactDetail | undefined {
  const contact = getContact(db, id);
  if (!contact) return undefined;
  const activities = listActivities(db, { contactId: id });
  return { ...contact, activities };
}

export function createContact(db: DB, input: ContactInput): Contact {
  const name = (input.name ?? "").trim();
  if (!name) throw httpError(400, "Name is required");
  const status = input.status ?? "lead";
  if (!isContactStatus(status)) throw httpError(400, `Invalid status: ${status}`);
  const orgId = input.organization_id ?? null;
  const now = nowIso();
  const res = db
    .prepare(
      `INSERT INTO contacts (name, email, phone, job_title, organization_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      name,
      nullable(input.email),
      nullable(input.phone),
      nullable(input.job_title),
      orgId,
      status,
      now,
      now,
    );
  return getContact(db, Number(res.lastInsertRowid))!;
}

export function updateContact(db: DB, id: number, input: ContactInput): Contact {
  const existing = getContact(db, id);
  if (!existing) throw httpError(404, "Contact not found");
  const name = (input.name ?? "").trim();
  if (!name) throw httpError(400, "Name is required");
  const status = input.status ?? existing.status;
  if (!isContactStatus(status)) throw httpError(400, `Invalid status: ${status}`);
  db.prepare(
    `UPDATE contacts SET name=?, email=?, phone=?, job_title=?, organization_id=?, status=?, updated_at=? WHERE id=?`,
  ).run(
    name,
    nullable(input.email),
    nullable(input.phone),
    nullable(input.job_title),
    input.organization_id ?? null,
    status,
    nowIso(),
    id,
  );
  return getContact(db, id)!;
}

export function deleteContact(db: DB, id: number): boolean {
  const res = db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  return res.changes > 0;
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export function listDeals(db: DB, search?: string): Deal[] {
  const q = (search ?? "").trim();
  if (q) {
    const l = like(q);
    return db
      .prepare(
        `SELECT d.*, o.name AS organization_name, c.name AS contact_name
         FROM deals d
         LEFT JOIN organizations o ON o.id = d.organization_id
         LEFT JOIN contacts c ON c.id = d.contact_id
         WHERE LOWER(d.name) LIKE ? OR LOWER(COALESCE(o.name,'')) LIKE ? OR LOWER(COALESCE(c.name,'')) LIKE ?
         ORDER BY d.created_at DESC`,
      )
      .all(l, l, l) as Deal[];
  }
  return db
    .prepare(
      `SELECT d.*, o.name AS organization_name, c.name AS contact_name
       FROM deals d
       LEFT JOIN organizations o ON o.id = d.organization_id
       LEFT JOIN contacts c ON c.id = d.contact_id
       ORDER BY d.created_at DESC`,
    )
    .all() as Deal[];
}

export function getDeal(db: DB, id: number): Deal | undefined {
  return db
    .prepare(
      `SELECT d.*, o.name AS organization_name, c.name AS contact_name
       FROM deals d
       LEFT JOIN organizations o ON o.id = d.organization_id
       LEFT JOIN contacts c ON c.id = d.contact_id
       WHERE d.id = ?`,
    )
    .get(id) as Deal | undefined;
}

export function getDealDetail(db: DB, id: number): DealDetail | undefined {
  const deal = getDeal(db, id);
  if (!deal) return undefined;
  const activities = listActivities(db, { dealId: id });
  return { ...deal, activities };
}

export function createDeal(db: DB, input: DealInput): Deal {
  const name = (input.name ?? "").trim();
  if (!name) throw httpError(400, "Name is required");
  const stage = input.stage ?? "new";
  if (!isStage(stage)) throw httpError(400, `Invalid stage: ${stage}`);
  const value = numberOrZero(input.value);
  if (value < 0) throw httpError(400, "Value must be a non-negative number");
  const now = nowIso();
  const res = db
    .prepare(
      `INSERT INTO deals (name, organization_id, contact_id, stage, value, close_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      name,
      input.organization_id ?? null,
      input.contact_id ?? null,
      stage,
      value,
      nullable(input.close_date),
      now,
      now,
    );
  return getDeal(db, Number(res.lastInsertRowid))!;
}

export function updateDeal(db: DB, id: number, input: DealInput): Deal {
  const existing = getDeal(db, id);
  if (!existing) throw httpError(404, "Deal not found");
  const name = (input.name ?? "").trim();
  if (!name) throw httpError(400, "Name is required");
  const stage = input.stage ?? existing.stage;
  if (!isStage(stage)) throw httpError(400, `Invalid stage: ${stage}`);
  const value = numberOrZero(input.value);
  if (value < 0) throw httpError(400, "Value must be a non-negative number");
  db.prepare(
    `UPDATE deals SET name=?, organization_id=?, contact_id=?, stage=?, value=?, close_date=?, updated_at=? WHERE id=?`,
  ).run(
    name,
    input.organization_id ?? null,
    input.contact_id ?? null,
    stage,
    value,
    nullable(input.close_date),
    nowIso(),
    id,
  );
  return getDeal(db, id)!;
}

/** Update only the stage of a deal (used by the pipeline drag-and-drop). */
export function updateDealStage(db: DB, id: number, stage: string): Deal {
  if (!isStage(stage)) throw httpError(400, `Invalid stage: ${stage}`);
  const existing = getDeal(db, id);
  if (!existing) throw httpError(404, "Deal not found");
  db.prepare("UPDATE deals SET stage=?, updated_at=? WHERE id=?").run(stage, nowIso(), id);
  return getDeal(db, id)!;
}

export function deleteDeal(db: DB, id: number): boolean {
  const res = db.prepare("DELETE FROM deals WHERE id = ?").run(id);
  return res.changes > 0;
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export function listActivities(
  db: DB,
  opts: { contactId?: number; dealId?: number } = {},
): Activity[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.contactId !== undefined) {
    where.push("a.contact_id = ?");
    params.push(opts.contactId);
  }
  if (opts.dealId !== undefined) {
    where.push("a.deal_id = ?");
    params.push(opts.dealId);
  }
  const sql = `SELECT a.*, c.name AS contact_name, d.name AS deal_name
               FROM activities a
               LEFT JOIN contacts c ON c.id = a.contact_id
               LEFT JOIN deals d ON d.id = a.deal_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY a.occurred_at DESC, a.created_at DESC`;
  const rows = db.prepare(sql).all(...params) as ActivityRow[];
  return rows.map((r) => ({ ...r, done: Boolean(r.done) }));
}

export function getActivity(db: DB, id: number): Activity | undefined {
  const row = db
    .prepare(
      `SELECT a.*, c.name AS contact_name, d.name AS deal_name
       FROM activities a
       LEFT JOIN contacts c ON c.id = a.contact_id
       LEFT JOIN deals d ON d.id = a.deal_id
       WHERE a.id = ?`,
    )
    .get(id) as ActivityRow | undefined;
  return row ? { ...row, done: Boolean(row.done) } : undefined;
}

export function createActivity(db: DB, input: ActivityInput): Activity {
  const description = (input.description ?? "").trim();
  if (!description) throw httpError(400, "Description is required");
  const type = input.type ?? "note";
  if (!isActivityType(type)) throw httpError(400, `Invalid activity type: ${type}`);
  const now = nowIso();
  const occurredAt = input.occurred_at ?? now.slice(0, 10);
  const res = db
    .prepare(
      `INSERT INTO activities (type, contact_id, deal_id, description, occurred_at, due_date, done, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      type,
      input.contact_id ?? null,
      input.deal_id ?? null,
      description,
      occurredAt,
      nullable(input.due_date),
      input.done ? 1 : 0,
      now,
      now,
    );
  return getActivity(db, Number(res.lastInsertRowid))!;
}

export function updateActivity(db: DB, id: number, input: Partial<ActivityInput>): Activity {
  const existing = getActivity(db, id);
  if (!existing) throw httpError(404, "Activity not found");
  const description =
    input.description !== undefined ? input.description.trim() : existing.description;
  if (!description) throw httpError(400, "Description is required");
  const type = input.type ?? existing.type;
  if (!isActivityType(type)) throw httpError(400, `Invalid activity type: ${type}`);
  db.prepare(
    `UPDATE activities SET type=?, contact_id=?, deal_id=?, description=?, occurred_at=?, due_date=?, done=?, updated_at=? WHERE id=?`,
  ).run(
    type,
    input.contact_id !== undefined ? input.contact_id ?? null : existing.contact_id,
    input.deal_id !== undefined ? input.deal_id ?? null : existing.deal_id,
    description,
    input.occurred_at ?? existing.occurred_at,
    input.due_date !== undefined ? nullable(input.due_date) : existing.due_date,
    input.done !== undefined ? (input.done ? 1 : 0) : existing.done ? 1 : 0,
    nowIso(),
    id,
  );
  return getActivity(db, id)!;
}

export function setActivityDone(db: DB, id: number, done: boolean): Activity {
  const existing = getActivity(db, id);
  if (!existing) throw httpError(404, "Activity not found");
  db.prepare("UPDATE activities SET done=?, updated_at=? WHERE id=?").run(done ? 1 : 0, nowIso(), id);
  return getActivity(db, id)!;
}

export function deleteActivity(db: DB, id: number): boolean {
  const res = db.prepare("DELETE FROM activities WHERE id = ?").run(id);
  return res.changes > 0;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function numberOrZero(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function httpError(status: number, message: string): HttpError {
  return new HttpError(status, message);
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}
