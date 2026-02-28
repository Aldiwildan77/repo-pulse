import type { UserTotp } from "../../core/entities/user-totp.js";
import type { UserTotpRow } from "../../infrastructure/database/types.js";

export function toUserTotp(row: UserTotpRow): UserTotp {
  return {
    id: row.id,
    userId: row.user_id,
    totpSecretEncrypted: row.totp_secret_encrypted,
    isEnabled: row.is_enabled,
    backupCodesHash: row.backup_codes_hash as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
