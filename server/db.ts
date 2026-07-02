import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { SCHEMA_SQL } from "./schema.js";

export type DB = Database.Database;

// Where the database file lives. Overridable via DB_PATH for tests/scripts.
export const DEFAULT_DB_PATH = join(process.cwd(), "data", "crm.sqlite");

/** Create (or open) a SQLite database at `path` and ensure the schema exists. */
export function createDb(path: string): DB {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  return db;
}

/** Convenience: an in-memory database with the schema applied, for tests. */
export function createMemoryDb(): DB {
  return createDb(":memory:");
}

/** Current UTC timestamp as an ISO string. */
export function nowIso(): string {
  return new Date().toISOString();
}
