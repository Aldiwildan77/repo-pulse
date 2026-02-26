import type { SourceProvider } from "../webhook/webhook-provider.js";

export interface ConnectedRepo {
  id: number;
  provider: SourceProvider;
  providerInstallationId: string | null;
  providerRepo: string;
  connectedBy: string;
  createdAt: Date;
}
