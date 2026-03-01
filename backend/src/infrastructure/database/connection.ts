import { Kysely, PostgresDialect } from "kysely";
import type { LogEvent } from "kysely";
import pg from "pg";
import type { Database } from "./types.js";
import { AppLogger } from "../logger/logger.js";

const logger = new AppLogger("repo-pulse").child({ module: "kysely" });

export function createDatabase(databaseUrl: string, debugQueryLog = false): Kysely<Database> {
  const dialect = new PostgresDialect({
    pool: new pg.Pool({ connectionString: databaseUrl }),
  });

  return new Kysely<Database>({
    dialect,
    log: debugQueryLog
      ? (event: LogEvent) => {
          if (event.level === "query") {
            logger.info("query", {
              sql: event.query.sql,
              params: event.query.parameters as unknown[],
              duration: event.queryDurationMillis,
            });
          } else {
            logger.error("query error", {
              sql: event.query.sql,
              error: String(event.error),
            });
          }
        }
      : (event: LogEvent) => {
          if (event.level === "error") {
            logger.error("query error", {
              sql: event.query.sql,
              error: String(event.error),
            });
          }
        },
  });
}
