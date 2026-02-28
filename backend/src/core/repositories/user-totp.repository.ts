import type { UserTotp } from "../entities/user-totp.js";

export interface UserTotpRepository {
  findByUserId(userId: number): Promise<UserTotp | null>;

  create(data: {
    userId: number;
    totpSecretEncrypted: string;
    backupCodesHash: string[];
  }): Promise<UserTotp>;

  enable(userId: number): Promise<void>;

  deleteByUserId(userId: number): Promise<void>;

  updateBackupCodes(userId: number, backupCodesHash: string[]): Promise<void>;
}
