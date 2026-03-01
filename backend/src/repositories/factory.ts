import type { InfrastructureFactory } from "../infrastructure/factory.js";
import { KyselyUserRepository } from "./user/user.repo.js";
import { KyselyNotificationDeliveryRepository } from "./notification-delivery/notification-delivery.repo.js";
import { KyselyUserIdentityRepository } from "./user-identity/user-identity.repo.js";
import { KyselyRepoConfigRepository } from "./repo-config/repo-config.repo.js";
import { KyselyRepoConfigNotificationRepository } from "./repo-config-notification/repo-config-notification.repo.js";
import { KyselyWorkspaceRepository } from "./workspace/workspace.repo.js";
import { KyselyWebhookEventRepository } from "./webhook-event/webhook-event.repo.js";
import { KyselyAuthRepository } from "./auth/auth.repo.js";
import { KyselyUserTotpRepository } from "./user-totp/user-totp.repo.js";
import { KyselyNotifierLogRepository } from "./notifier-log/notifier-log.repo.js";
import { KyselyFeedbackRepository } from "./feedback/feedback.repo.js";
import type { UserRepository } from "../core/repositories/user.repository.js";
import type { NotificationDeliveryRepository } from "../core/repositories/notification-delivery.repository.js";
import type { UserIdentityRepository } from "../core/repositories/user-identity.repository.js";
import type { UserTotpRepository } from "../core/repositories/user-totp.repository.js";
import type { RepoConfigRepository } from "../core/repositories/repo-config.repository.js";
import type { RepoConfigNotificationRepository } from "../core/repositories/repo-config-notification.repository.js";
import type { WorkspaceRepository } from "../core/repositories/workspace.repository.js";
import type { WebhookEventRepository } from "../core/repositories/webhook-event.repository.js";
import type { NotifierLogRepository } from "../core/repositories/notifier-log.repository.js";
import type { FeedbackRepository } from "../core/repositories/feedback.repository.js";

export class RepositoryFactory {
  readonly user: UserRepository;
  readonly notificationDelivery: NotificationDeliveryRepository;
  readonly userIdentity: UserIdentityRepository;
  readonly repoConfig: RepoConfigRepository;
  readonly repoConfigNotification: RepoConfigNotificationRepository;
  readonly workspace: WorkspaceRepository;
  readonly webhookEvent: WebhookEventRepository;
  readonly auth: KyselyAuthRepository;
  readonly userTotp: UserTotpRepository;
  readonly notifierLog: NotifierLogRepository;
  readonly feedback: FeedbackRepository;

  constructor(infra: InfrastructureFactory) {
    this.user = new KyselyUserRepository(infra.db);
    this.notificationDelivery = new KyselyNotificationDeliveryRepository(infra.db);
    this.userIdentity = new KyselyUserIdentityRepository(infra.db);
    this.repoConfig = new KyselyRepoConfigRepository(infra.db);
    this.repoConfigNotification = new KyselyRepoConfigNotificationRepository(infra.db);
    this.workspace = new KyselyWorkspaceRepository(infra.db);
    this.webhookEvent = new KyselyWebhookEventRepository(infra.db);
    this.auth = new KyselyAuthRepository(infra.db);
    this.userTotp = new KyselyUserTotpRepository(infra.db);
    this.notifierLog = new KyselyNotifierLogRepository(infra.db);
    this.feedback = new KyselyFeedbackRepository(infra.db);
  }
}
