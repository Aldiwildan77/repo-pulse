export interface UserTotp {
  id: number;
  userId: number;
  totpSecretEncrypted: string;
  isEnabled: boolean;
  backupCodesHash: string[];
  createdAt: Date;
  updatedAt: Date;
}
