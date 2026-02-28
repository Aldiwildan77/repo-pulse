import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { UserTotpRepository } from "../../core/repositories/user-totp.repository.js";
import type { UserTotp } from "../../core/entities/user-totp.js";
import { toUserTotp } from "./dto.js";

export class KyselyUserTotpRepository implements UserTotpRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findByUserId(userId: number): Promise<UserTotp | null> {
    const row = await this.db
      .selectFrom("user_totp")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirst();

    return row ? toUserTotp(row) : null;
  }

  async create(data: {
    userId: number;
    totpSecretEncrypted: string;
    backupCodesHash: string[];
  }): Promise<UserTotp> {
    const row = await this.db
      .insertInto("user_totp")
      .values({
        user_id: data.userId,
        totp_secret_encrypted: data.totpSecretEncrypted,
        backup_codes_hash: JSON.stringify(data.backupCodesHash),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUserTotp(row);
  }

  async enable(userId: number): Promise<void> {
    await this.db
      .updateTable("user_totp")
      .set({ is_enabled: true, updated_at: new Date() })
      .where("user_id", "=", userId)
      .execute();
  }

  async deleteByUserId(userId: number): Promise<void> {
    await this.db
      .deleteFrom("user_totp")
      .where("user_id", "=", userId)
      .execute();
  }

  async updateBackupCodes(userId: number, backupCodesHash: string[]): Promise<void> {
    await this.db
      .updateTable("user_totp")
      .set({
        backup_codes_hash: JSON.stringify(backupCodesHash),
        updated_at: new Date(),
      })
      .where("user_id", "=", userId)
      .execute();
  }
}
