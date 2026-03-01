import type { User } from "../../core/entities/index.js";
import type { UserRow } from "../../infrastructure/database/types.js";

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
