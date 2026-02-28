import type { InfrastructureFactory } from "../infrastructure/factory.js";
import { KyselyPrMessageRepository } from "./pr-message/pr-message.repo.js";
import { KyselyUserBindingRepository } from "./user-binding/user-binding.repo.js";
import { KyselyUserIdentityRepository } from "./user-identity/user-identity.repo.js";
import { KyselyRepoConfigRepository } from "./repo-config/repo-config.repo.js";
import { KyselyWebhookEventRepository } from "./webhook-event/webhook-event.repo.js";
import { KyselyAuthRepository } from "./auth/auth.repo.js";
import { KyselyConnectedRepoRepository } from "./connected-repo/connected-repo.repo.js";
import type { PrMessageRepository } from "../core/repositories/pr-message.repository.js";
import type { UserBindingRepository } from "../core/repositories/user-binding.repository.js";
import type { UserIdentityRepository } from "../core/repositories/user-identity.repository.js";
import type { RepoConfigRepository } from "../core/repositories/repo-config.repository.js";
import type { WebhookEventRepository } from "../core/repositories/webhook-event.repository.js";
import type { ConnectedRepoRepository } from "../core/repositories/connected-repo.repository.js";

export class RepositoryFactory {
  readonly prMessage: PrMessageRepository;
  readonly userBinding: UserBindingRepository;
  readonly userIdentity: UserIdentityRepository;
  readonly repoConfig: RepoConfigRepository;
  readonly webhookEvent: WebhookEventRepository;
  readonly auth: KyselyAuthRepository;
  readonly connectedRepo: ConnectedRepoRepository;

  constructor(infra: InfrastructureFactory) {
    this.prMessage = new KyselyPrMessageRepository(infra.db);
    this.userBinding = new KyselyUserBindingRepository(infra.db);
    this.userIdentity = new KyselyUserIdentityRepository(infra.db);
    this.repoConfig = new KyselyRepoConfigRepository(infra.db);
    this.webhookEvent = new KyselyWebhookEventRepository(infra.db);
    this.auth = new KyselyAuthRepository(infra.db);
    this.connectedRepo = new KyselyConnectedRepoRepository(infra.db);
  }
}
