import crypto from "node:crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import * as QRCode from "qrcode";
import bcrypt from "bcrypt";
import type { UserTotpRepository } from "../repositories/user-totp.repository.js";
import type { TotpCryptoService } from "../../infrastructure/auth/totp-crypto.js";
import type { JwtService } from "../../infrastructure/auth/jwt.js";

const BACKUP_CODE_COUNT = 10;
const BCRYPT_ROUNDS = 10;
const TOTP_ISSUER = "RepoPulse";

export class TotpModule {
  constructor(
    private readonly userTotpRepo: UserTotpRepository,
    private readonly totpCrypto: TotpCryptoService,
    private readonly jwt: JwtService,
  ) {}

  async isTotpEnabled(userId: number): Promise<boolean> {
    const record = await this.userTotpRepo.findByUserId(userId);
    return record?.isEnabled ?? false;
  }

  async beginSetup(
    userId: number,
    username: string,
  ): Promise<{ qrCodeDataUrl: string; manualSecret: string; backupCodes: string[] }> {
    // Remove any existing incomplete setup
    await this.userTotpRepo.deleteByUserId(userId);

    const secret = generateSecret();
    const encryptedSecret = this.totpCrypto.encrypt(secret);

    // Generate backup codes
    const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
      crypto.randomBytes(4).toString("hex"),
    );
    const backupCodesHash = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, BCRYPT_ROUNDS)),
    );

    await this.userTotpRepo.create({
      userId,
      totpSecretEncrypted: encryptedSecret,
      backupCodesHash,
    });

    const otpauth = generateURI({
      issuer: TOTP_ISSUER,
      label: username,
      secret,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    return { qrCodeDataUrl, manualSecret: secret, backupCodes };
  }

  async confirmSetup(userId: number, code: string): Promise<boolean> {
    const record = await this.userTotpRepo.findByUserId(userId);
    if (!record || record.isEnabled) return false;

    const secret = this.totpCrypto.decrypt(record.totpSecretEncrypted);
    const result = verifySync({ secret, token: code });
    if (!result.valid) return false;

    await this.userTotpRepo.enable(userId);
    return true;
  }

  async verifyCode(userId: number, code: string): Promise<boolean> {
    const record = await this.userTotpRepo.findByUserId(userId);
    if (!record || !record.isEnabled) return false;

    // Try TOTP code first
    const secret = this.totpCrypto.decrypt(record.totpSecretEncrypted);
    const result = verifySync({ secret, token: code });
    if (result.valid) return true;

    // Try backup codes
    for (let i = 0; i < record.backupCodesHash.length; i++) {
      const match = await bcrypt.compare(code, record.backupCodesHash[i]);
      if (match) {
        // Consume the backup code
        const remaining = [...record.backupCodesHash];
        remaining.splice(i, 1);
        await this.userTotpRepo.updateBackupCodes(userId, remaining);
        return true;
      }
    }

    return false;
  }

  async disable(userId: number, code: string): Promise<boolean> {
    const valid = await this.verifyCode(userId, code);
    if (!valid) return false;

    await this.userTotpRepo.deleteByUserId(userId);
    return true;
  }

  signTotpPendingToken(userId: number): string {
    return this.jwt.signTotpPendingToken({ sub: String(userId) });
  }

  verifyTotpPendingToken(token: string): { sub: string } {
    return this.jwt.verifyTotpPendingToken(token);
  }
}
