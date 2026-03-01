import type { Config } from "../../infrastructure/config.js";
import type { NotificationDeliveryRepository } from "../repositories/notification-delivery.repository.js";
import type { RepoConfigNotificationRepository } from "../repositories/repo-config-notification.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { WebhookEventRepository } from "../repositories/webhook-event.repository.js";
import type { NotifierLogRepository } from "../repositories/notifier-log.repository.js";
import type { NotificationPlatform, RepoConfigNotification, NotificationStatus } from "../entities/index.js";
import type { Pusher } from "./pusher/pusher.interface.js";
import type { AppLogger } from "../../infrastructure/logger/logger.js";
import type {
  InstallationCreatedEvent,
  InstallationDeletedEvent,
  InstallationReposChangedEvent,
} from "../webhook/webhook-provider.js";

export interface PrOpenedEvent {
  prId: number;
  repo: string;
  title: string;
  author: string;
  url: string;
  labels: string[];
}

export interface PrClosedEvent {
  prId: number;
  repo: string;
  merged: boolean;
}

export interface CommentEvent {
  repo: string;
  title: string;
  url: string;
  isPullRequest: boolean;
  commenter: string;
  body: string;
  mentionedUsernames: string[];
}

export interface PrLabelChangedEvent {
  prId: number;
  repo: string;
  action: "labeled" | "unlabeled";
  label: { name: string; color: string };
  author: string;
  prTitle: string;
  prUrl: string;
}

export interface IssueOpenedEvent {
  issueId: number;
  repo: string;
  title: string;
  author: string;
  url: string;
}

export interface IssueClosedEvent {
  issueId: number;
  repo: string;
  title: string;
  author: string;
  url: string;
}

export interface PrReviewEvent {
  prId: number;
  repo: string;
  prTitle: string;
  prUrl: string;
  reviewer: string;
  state: "approved" | "changes_requested";
}

export class NotifierModule {
  constructor(
    private readonly config: Config,
    private readonly deliveryRepo: NotificationDeliveryRepository,
    private readonly notificationRepo: RepoConfigNotificationRepository,
    private readonly userRepo: UserRepository,
    private readonly webhookEventRepo: WebhookEventRepository,
    private readonly notifierLogRepo: NotifierLogRepository,
    private readonly pushers: Map<NotificationPlatform, Pusher>,
    private readonly logger: AppLogger,
  ) {}

  private filterNotificationsByLabels(notifications: RepoConfigNotification[], labels: string[]): RepoConfigNotification[] {
    // PR has no labels → no filtering, send to all channels
    if (labels.length === 0) return notifications;

    const labelSet = new Set(labels.map((l) => l.toLowerCase()));

    return notifications.filter((n) => {
      // No tags configured → catch-all, always send
      if (n.tags.length === 0) return true;
      // Has tags → only send if any tag matches a PR label
      return n.tags.some((t) => labelSet.has(t.toLowerCase()));
    });
  }

  private deduplicateByChannel(notifications: RepoConfigNotification[]): RepoConfigNotification[] {
    const seen = new Set<string>();
    return notifications.filter((n) => {
      const key = `${n.notificationPlatform}:${n.channelId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async populateTags(notifications: RepoConfigNotification[]): Promise<void> {
    if (notifications.length === 0) return;
    const tagsMap = await this.notificationRepo.getTagsForNotifications(notifications.map((n) => n.id));
    for (const notif of notifications) {
      notif.tags = tagsMap.get(notif.id) ?? [];
    }
  }

  private async isEventEnabled(notif: RepoConfigNotification, eventType: string): Promise<boolean> {
    return this.notificationRepo.isEventEnabled(notif.id, eventType);
  }

  private async logEvent(
    notif: RepoConfigNotification,
    eventType: string,
    status: NotificationStatus,
    summary: string,
    providerEntityId: string,
    providerEntityNumber?: number | null,
    errorMessage?: string,
  ): Promise<number> {
    try {
      const log = await this.notifierLogRepo.create({
        repoConfigNotificationId: notif.id,
        eventType,
        status,
        platform: notif.notificationPlatform,
        providerEntityId,
        providerEntityNumber: providerEntityNumber ?? null,
        summary,
        errorMessage: errorMessage ?? null,
        resolvedAt: status !== "queued" && status !== "processing" ? new Date() : null,
      });
      return log.id;
    } catch (err) {
      this.logger.error("Failed to write notifier log", { error: String(err) });
      return 0;
    }
  }

  async handlePrOpened(event: PrOpenedEvent): Promise<void> {
    const allNotifications = await this.notificationRepo.findActiveByRepo(event.repo);

    if (allNotifications.length === 0) {
      this.logger.warn("No active notification configs found for repo", {
        repo: event.repo,
        prId: event.prId,
      });
      return;
    }

    await this.populateTags(allNotifications);

    this.logger.info("Found notifications for PR", {
      repo: event.repo,
      prId: event.prId,
      total: allNotifications.length,
      labels: event.labels,
      notificationTags: allNotifications.map((n) => ({ id: n.id, tags: n.tags, channelId: n.channelId })),
    });

    const filtered = this.filterNotificationsByLabels(allNotifications, event.labels);
    const notifications = this.deduplicateByChannel(filtered);

    if (notifications.length === 0) {
      this.logger.warn("All notifications filtered out by label matching", {
        repo: event.repo,
        prId: event.prId,
        labels: event.labels,
        totalBeforeFilter: allNotifications.length,
      });
      return;
    }

    for (const notif of notifications) {
      if (!(await this.isEventEnabled(notif, "pr_opened"))) {
        await this.logEvent(notif, "pr_opened", "skipped", `PR #${event.prId} opened in ${event.repo} (disabled)`, String(event.prId), event.prId);
        continue;
      }

      try {
        const pusher = this.pushers.get(notif.notificationPlatform);
        if (!pusher) {
          this.logger.warn("No pusher registered for platform", {
            platform: notif.notificationPlatform,
            repo: event.repo,
          });
          continue;
        }

        const messageId = await pusher.sendPrNotification(notif.channelId, {
          repo: event.repo,
          title: event.title,
          author: event.author,
          url: event.url,
        });

        const logId = await this.logEvent(notif, "pr_opened", "delivered", `PR #${event.prId} "${event.title}" by ${event.author}`, String(event.prId), event.prId);

        await this.deliveryRepo.create({
          notifierLogId: logId,
          notificationPlatform: notif.notificationPlatform,
          providerMessageId: messageId,
          providerChannelId: notif.channelId,
          deliveredAt: new Date(),
        });

        this.logger.info("PR notification sent", {
          repo: event.repo,
          prId: event.prId,
          platform: notif.notificationPlatform,
          channelId: notif.channelId,
        });
      } catch (err) {
        await this.logEvent(notif, "pr_opened", "failed", `PR #${event.prId} "${event.title}"`, String(event.prId), event.prId, String(err));

        this.logger.error("Failed to send PR notification", {
          error: String(err),
          repo: event.repo,
          prId: event.prId,
          platform: notif.notificationPlatform,
          channelId: notif.channelId,
        });
      }
    }
  }

  async handlePrLabelChanged(event: PrLabelChangedEvent): Promise<void> {
    const labelEntityId = `${event.prId}:label:${event.label.name}`;

    // PR deliveries — to know which channels already have the PR
    const prDeliveries = await this.deliveryRepo.findByProviderEntity(String(event.prId), event.repo);
    const deliveredChannels = new Set(
      prDeliveries.map((d) => `${d.notificationPlatform}:${d.providerChannelId}`),
    );

    const notifications = await this.notificationRepo.findActiveByRepo(event.repo);
    await this.populateTags(notifications);

    if (event.action === "unlabeled") {
      // Find and delete the label notification messages
      const labelDeliveries = await this.deliveryRepo.findByProviderEntity(labelEntityId, event.repo);

      for (const delivery of labelDeliveries) {
        if (!delivery.providerChannelId || !delivery.providerMessageId || delivery.deletedAt) continue;

        try {
          const pusher = this.pushers.get(delivery.notificationPlatform);
          if (!pusher) continue;

          await pusher.deleteMessage(delivery.providerChannelId, delivery.providerMessageId);
          await this.deliveryRepo.updateDelivery(delivery.id, { deletedAt: new Date() });
        } catch (err) {
          this.logger.error("Failed to delete label notification message", {
            error: String(err),
            repo: event.repo,
            prId: event.prId,
            label: event.label.name,
            platform: delivery.notificationPlatform,
          });
        }
      }
      return;
    }

    // action === "labeled"
    for (const notif of notifications) {
      const key = `${notif.notificationPlatform}:${notif.channelId}`;
      const alreadyDelivered = deliveredChannels.has(key);

      // PR not yet sent to this channel → send PR notification if tag matches
      if (!alreadyDelivered) {
        const labelLower = event.label.name.toLowerCase();
        const matches = notif.tags.length > 0 && notif.tags.some((t) => t.toLowerCase() === labelLower);
        if (!matches) continue;

        if (!(await this.isEventEnabled(notif, "pr_opened"))) {
          await this.logEvent(notif, "pr_opened", "skipped", `PR #${event.prId} late delivery via label (disabled)`, String(event.prId), event.prId);
          continue;
        }

        try {
          const pusher = this.pushers.get(notif.notificationPlatform);
          if (!pusher) continue;

          const messageId = await pusher.sendPrNotification(notif.channelId, {
            repo: event.repo,
            title: event.prTitle,
            author: event.author,
            url: event.prUrl,
          });

          const logId = await this.logEvent(notif, "pr_opened", "delivered", `PR #${event.prId} "${event.prTitle}" by ${event.author} (label: "${event.label.name}")`, String(event.prId), event.prId);

          await this.deliveryRepo.create({
            notifierLogId: logId,
            notificationPlatform: notif.notificationPlatform,
            providerMessageId: messageId,
            providerChannelId: notif.channelId,
            deliveredAt: new Date(),
          });
        } catch (err) {
          await this.logEvent(notif, "pr_opened", "failed", `PR #${event.prId} "${event.prTitle}" (label: "${event.label.name}")`, String(event.prId), event.prId, String(err));
        }
        continue;
      }

      // PR already sent → send label notification and track it for deletion
      if (!(await this.isEventEnabled(notif, "pr_label"))) {
        await this.logEvent(notif, "pr_label", "skipped", `PR #${event.prId} label ${event.action} (disabled)`, String(event.prId), event.prId);
        continue;
      }

      try {
        const pusher = this.pushers.get(notif.notificationPlatform);
        if (!pusher) continue;

        const messageId = await pusher.sendLabelNotification(notif.channelId, {
          repo: event.repo,
          prTitle: event.prTitle,
          prUrl: event.prUrl,
          action: event.action,
          label: event.label,
          author: event.author,
        });

        const logId = await this.logEvent(notif, "pr_label", "delivered", `PR #${event.prId} labeled "${event.label.name}"`, labelEntityId, event.prId);

        await this.deliveryRepo.create({
          notifierLogId: logId,
          notificationPlatform: notif.notificationPlatform,
          providerMessageId: messageId,
          providerChannelId: notif.channelId,
          deliveredAt: new Date(),
        });
      } catch (err) {
        await this.logEvent(notif, "pr_label", "failed", `PR #${event.prId} label ${event.action}`, labelEntityId, event.prId, String(err));
      }
    }
  }

  async handlePrClosed(event: PrClosedEvent): Promise<void> {
    const deliveries = await this.deliveryRepo.findByProviderEntity(String(event.prId), event.repo);
    const emoji = event.merged ? "\u2705" : "\u274C";
    const status = event.merged ? "merged" : "closed";

    if (deliveries.length === 0) {
      this.logger.warn("No deliveries found for reaction", {
        repo: event.repo,
        prId: event.prId,
        status,
      });
      return;
    }

    for (const delivery of deliveries) {
      if (!delivery.providerChannelId || !delivery.providerMessageId) continue;

      try {
        const pusher = this.pushers.get(delivery.notificationPlatform);
        if (!pusher) continue;

        await pusher.addReaction(delivery.providerChannelId, delivery.providerMessageId, emoji);
        await pusher.removeButtons(delivery.providerChannelId, delivery.providerMessageId);

        this.logger.info("PR close reaction added", {
          repo: event.repo,
          prId: event.prId,
          platform: delivery.notificationPlatform,
        });
      } catch (err) {
        this.logger.error("Failed to add PR reaction", {
          error: String(err),
          repo: event.repo,
          prId: event.prId,
          platform: delivery.notificationPlatform,
        });
      }
    }
  }

  async handleComment(event: CommentEvent): Promise<void> {
    if (event.mentionedUsernames.length === 0) return;

    const notifications = await this.notificationRepo.findActiveByRepo(event.repo);

    const enabledPlatforms = new Set<NotificationPlatform>();
    for (const notif of notifications) {
      if (await this.isEventEnabled(notif, "comment")) {
        enabledPlatforms.add(notif.notificationPlatform);
      }
    }

    if (enabledPlatforms.size === 0) return;

    const payload = {
      repo: event.repo,
      title: event.title,
      url: event.url,
      isPullRequest: event.isPullRequest,
      commenter: event.commenter,
      commentBody: event.body,
    };

    // Look up GitHub usernames → Discord/Slack user IDs via cross-platform identity mapping
    for (const platform of enabledPlatforms) {
      const pusher = this.pushers.get(platform);
      if (!pusher) continue;

      const identities = await this.userRepo.findTargetIdentities("github", event.mentionedUsernames, platform);

      for (const { sourceUsername, targetUserId } of identities) {
        try {
          await pusher.sendMentionNotification(targetUserId, payload);
          this.logger.info("Mention notification sent", {
            repo: event.repo,
            githubUser: sourceUsername,
            platform,
          });
        } catch (err) {
          this.logger.error("Failed to send mention notification", {
            error: String(err),
            repo: event.repo,
            githubUser: sourceUsername,
            platform,
          });
        }
      }
    }
  }

  async handleIssueOpened(event: IssueOpenedEvent): Promise<void> {
    const notifications = await this.notificationRepo.findActiveByRepo(event.repo);

    if (notifications.length === 0) {
      this.logger.warn("No active notifications found for issue", {
        repo: event.repo,
        issueId: event.issueId,
      });
      return;
    }

    for (const notif of notifications) {
      if (!(await this.isEventEnabled(notif, "issue_opened"))) {
        await this.logEvent(notif, "issue_opened", "skipped", `Issue #${event.issueId} opened (disabled)`, String(event.issueId), event.issueId);
        continue;
      }

      try {
        const pusher = this.pushers.get(notif.notificationPlatform);
        if (!pusher) continue;

        await pusher.sendIssueNotification(notif.channelId, {
          repo: event.repo,
          title: event.title,
          author: event.author,
          url: event.url,
          action: "opened",
        });

        await this.logEvent(notif, "issue_opened", "delivered", `Issue #${event.issueId} "${event.title}" by ${event.author}`, String(event.issueId), event.issueId);
      } catch (err) {
        await this.logEvent(notif, "issue_opened", "failed", `Issue #${event.issueId} "${event.title}"`, String(event.issueId), event.issueId, String(err));
      }
    }
  }

  async handleIssueClosed(event: IssueClosedEvent): Promise<void> {
    const notifications = await this.notificationRepo.findActiveByRepo(event.repo);

    if (notifications.length === 0) {
      this.logger.warn("No active notifications found for issue", {
        repo: event.repo,
        issueId: event.issueId,
      });
      return;
    }

    for (const notif of notifications) {
      if (!(await this.isEventEnabled(notif, "issue_closed"))) {
        await this.logEvent(notif, "issue_closed", "skipped", `Issue #${event.issueId} closed (disabled)`, String(event.issueId), event.issueId);
        continue;
      }

      try {
        const pusher = this.pushers.get(notif.notificationPlatform);
        if (!pusher) continue;

        await pusher.sendIssueNotification(notif.channelId, {
          repo: event.repo,
          title: event.title,
          author: event.author,
          url: event.url,
          action: "closed",
        });

        await this.logEvent(notif, "issue_closed", "delivered", `Issue #${event.issueId} "${event.title}" closed`, String(event.issueId), event.issueId);
      } catch (err) {
        await this.logEvent(notif, "issue_closed", "failed", `Issue #${event.issueId} "${event.title}"`, String(event.issueId), event.issueId, String(err));
      }
    }
  }

  async handlePrReview(event: PrReviewEvent): Promise<void> {
    const eventType = event.state === "approved" ? "pr_review_approved" : "pr_review_changes_requested";

    const deliveries = await this.deliveryRepo.findByProviderEntity(String(event.prId), event.repo);
    const emoji = event.state === "approved" ? "\uD83D\uDC4D" : "\u274C";

    if (deliveries.length === 0) {
      this.logger.warn("No deliveries found for review reaction", {
        repo: event.repo,
        prId: event.prId,
        state: event.state,
      });
      return;
    }

    for (const delivery of deliveries) {
      if (!delivery.providerChannelId || !delivery.providerMessageId) continue;

      try {
        const pusher = this.pushers.get(delivery.notificationPlatform);
        if (!pusher) continue;

        await pusher.addReaction(delivery.providerChannelId, delivery.providerMessageId, emoji);
        await pusher.removeButtons(delivery.providerChannelId, delivery.providerMessageId);
      } catch (err) {
        this.logger.error("Failed to add PR review reaction", {
          error: String(err),
          repo: event.repo,
          prId: event.prId,
          state: event.state,
          platform: delivery.notificationPlatform,
        });
      }
    }
  }

  async handleInstallationCreated(_event: InstallationCreatedEvent): Promise<void> {
    // No-op: repos are fetched directly from provider APIs
  }

  async handleInstallationDeleted(_event: InstallationDeletedEvent): Promise<void> {
    // No-op: repos are fetched directly from provider APIs
  }

  async handleInstallationReposChanged(_event: InstallationReposChangedEvent): Promise<void> {
    // No-op: repos are fetched directly from provider APIs
  }

  async recordEvent(eventId: string, eventType: string, payload?: unknown): Promise<void> {
    await this.webhookEventRepo.create({ eventId, eventType, payload });
  }
}
