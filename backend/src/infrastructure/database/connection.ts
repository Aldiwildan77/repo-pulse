import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "./types.js";

export function createDatabase(databaseUrl: string): Kysely<Database> {
  const dialect = new PostgresDialect({
    pool: new pg.Pool({ connectionString: databaseUrl }),
  });

  return new Kysely<Database>({ dialect });
}
