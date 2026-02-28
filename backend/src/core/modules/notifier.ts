import type { Config } from "../../infrastructure/config.js";
import type { PrMessageRepository } from "../repositories/pr-message.repository.js";
import type { RepoConfigRepository } from "../repositories/repo-config.repository.js";
import type { UserBindingRepository } from "../repositories/user-binding.repository.js";
import type { WebhookEventRepository } from "../repositories/webhook-event.repository.js";
import type { NotifierLogRepository } from "../repositories/notifier-log.repository.js";
import type { Platform, RepoConfig } from "../entities/index.js";
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
    private readonly prMessageRepo: PrMessageRepository,
    private readonly repoConfigRepo: RepoConfigRepository,
    private readonly userBindingRepo: UserBindingRepository,
    private readonly webhookEventRepo: WebhookEventRepository,
    private readonly notifierLogRepo: NotifierLogRepository,
    private readonly pushers: Map<Platform, Pusher>,
    private readonly logger: AppLogger,
  ) {}

  private filterConfigsByLabels(configs: RepoConfig[], labels: string[]): RepoConfig[] {
    const notifyTags = labels
      .filter((l) => l.startsWith("notify:"))
      .map((l) => l.slice("notify:".length));

    if (notifyTags.length === 0) {
      // No notify labels → only default (untagged) configs
      return configs.filter((c) => c.tags.length === 0);
    }

    // Has notify labels → matching tagged configs + all default configs
    const tagSet = new Set(notifyTags);
    return configs.filter((c) => c.tags.length === 0 || c.tags.some((t) => tagSet.has(t)));
  }

  private async populateTags(configs: RepoConfig[]): Promise<void> {
    if (configs.length === 0) return;
    const tagsMap = await this.repoConfigRepo.getTagsForConfigs(configs.map((c) => c.id));
    for (const cfg of configs) {
      cfg.tags = tagsMap.get(cfg.id) ?? [];
    }
  }

  private async isEventEnabled(cfg: RepoConfig, eventType: string): Promise<boolean> {
    return this.repoConfigRepo.isEventEnabled(cfg.id, eventType);
  }

  private async logEvent(
    cfg: RepoConfig,
    eventType: string,
    status: "sent" | "failed" | "skipped",
    summary: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.notifierLogRepo.create({
        repoConfigId: cfg.id,
        eventType,
        status,
        platform: cfg.platform,
        summary,
        errorMessage: errorMessage ?? null,
      });
    } catch (err) {
      this.logger.error("Failed to write notifier log", { error: String(err) });
    }
  }

  async handlePrOpened(event: PrOpenedEvent): Promise<void> {
    const allConfigs = await this.repoConfigRepo.findActiveByRepo(event.repo);
    await this.populateTags(allConfigs);
    const configs = this.filterConfigsByLabels(allConfigs, event.labels);

    if (configs.length === 0) {
      this.logger.warn("No active repo configs found for PR notification", {
        repo: event.repo,
        prId: event.prId,
      });
      return;
    }

    for (const cfg of configs) {
      if (!(await this.isEventEnabled(cfg, "pr_opened"))) {
        await this.logEvent(cfg, "pr_opened", "skipped", `PR #${event.prId} opened in ${event.repo} (disabled)`);
        continue;
      }

      try {
        const pusher = this.pushers.get(cfg.platform);
        if (!pusher) {
          this.logger.warn("No pusher registered for platform", {
            platform: cfg.platform,
            repo: event.repo,
          });
          continue;
        }

        const messageId = await pusher.sendPrNotification(cfg.channelId, {
          repo: event.repo,
          title: event.title,
          author: event.author,
          url: event.url,
        });

        await this.prMessageRepo.create({
          providerPrId: event.prId,
          providerRepo: event.repo,
          platform: cfg.platform,
          platformMessageId: messageId,
          platformChannelId: cfg.channelId,
          repoConfigId: cfg.id,
        });

        await this.logEvent(cfg, "pr_opened", "sent", `PR #${event.prId} "${event.title}" by ${event.author}`);

        this.logger.info("PR notification sent", {
          repo: event.repo,
          prId: event.prId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      } catch (err) {
        await this.logEvent(cfg, "pr_opened", "failed", `PR #${event.prId} "${event.title}"`, String(err));

        this.logger.error("Failed to send PR notification", {
          error: String(err),
          repo: event.repo,
          prId: event.prId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      }
    }
  }

  async handlePrLabelChanged(event: PrLabelChangedEvent): Promise<void> {
    const configs = await this.repoConfigRepo.findActiveByRepo(event.repo);

    if (configs.length === 0) {
      this.logger.warn("No active repo configs found for label notification", {
        repo: event.repo,
        prId: event.prId,
      });
      return;
    }

    for (const cfg of configs) {
      if (!(await this.isEventEnabled(cfg, "pr_label"))) {
        await this.logEvent(cfg, "pr_label", "skipped", `PR #${event.prId} label ${event.action} (disabled)`);
        continue;
      }

      try {
        const pusher = this.pushers.get(cfg.platform);
        if (!pusher) {
          this.logger.warn("No pusher registered for platform", {
            platform: cfg.platform,
            repo: event.repo,
          });
          continue;
        }

        await pusher.sendLabelNotification(cfg.channelId, {
          repo: event.repo,
          prTitle: event.prTitle,
          prUrl: event.prUrl,
          action: event.action,
          label: event.label,
          author: event.author,
        });

        await this.logEvent(cfg, "pr_label", "sent", `PR #${event.prId} ${event.action} "${event.label.name}"`);

        this.logger.info("Label notification sent", {
          repo: event.repo,
          prId: event.prId,
          action: event.action,
          label: event.label.name,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      } catch (err) {
        await this.logEvent(cfg, "pr_label", "failed", `PR #${event.prId} label ${event.action}`, String(err));

        this.logger.error("Failed to send label notification", {
          error: String(err),
          repo: event.repo,
          prId: event.prId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      }
    }
  }

  async handlePrClosed(event: PrClosedEvent): Promise<void> {
    const configs = await this.repoConfigRepo.findActiveByRepo(event.repo);
    const configMap = new Map(configs.map((c) => [c.id, c]));

    const enabledConfigIds = new Set<number>();
    for (const c of configs) {
      if (await this.isEventEnabled(c, "pr_merged")) {
        enabledConfigIds.add(c.id);
      }
    }

    const messages = await this.prMessageRepo.findByPrAndRepo(event.prId, event.repo);
    const emoji = event.merged ? "\u2705" : "\u274C";
    const status = event.merged ? "merged" : "closed";

    if (messages.length === 0) {
      this.logger.warn("No PR messages found for reaction", {
        repo: event.repo,
        prId: event.prId,
        status,
      });
      return;
    }

    for (const msg of messages) {
      const matchingCfg = msg.repoConfigId ? configMap.get(msg.repoConfigId) : configs.find((c) => c.platform === msg.platform);

      if (matchingCfg && !enabledConfigIds.has(matchingCfg.id)) {
        await this.logEvent(matchingCfg, "pr_merged", "skipped", `PR #${event.prId} ${status} (disabled)`);
        continue;
      }

      try {
        const pusher = this.pushers.get(msg.platform);
        if (!pusher) continue;

        await pusher.addReaction(msg.platformChannelId, msg.platformMessageId, emoji);
        await pusher.removeButtons(msg.platformChannelId, msg.platformMessageId);
        await this.prMessageRepo.updateStatus(msg.id, status);

        if (matchingCfg) {
          await this.logEvent(matchingCfg, "pr_merged", "sent", `PR #${event.prId} ${status} — ${emoji} reaction added`);
        }
      } catch (err) {
        if (matchingCfg) {
          await this.logEvent(matchingCfg, "pr_merged", "failed", `PR #${event.prId} ${status}`, String(err));
        }

        this.logger.error("Failed to add PR reaction", {
          error: String(err),
          repo: event.repo,
          prId: event.prId,
          platform: msg.platform,
        });
      }
    }
  }

  async handleComment(event: CommentEvent): Promise<void> {
    if (event.mentionedUsernames.length === 0) return;

    const configs = await this.repoConfigRepo.findActiveByRepo(event.repo);

    const enabledPlatforms = new Set<Platform>();
    for (const c of configs) {
      if (await this.isEventEnabled(c, "comment")) {
        enabledPlatforms.add(c.platform);
      } else {
        await this.logEvent(c, "comment", "skipped", `Comment mention by ${event.commenter} (disabled)`);
      }
    }

    if (enabledPlatforms.size === 0) return;

    const bindings = await this.userBindingRepo.findByProviderUsernames("github", event.mentionedUsernames);

    const payload = {
      repo: event.repo,
      title: event.title,
      url: event.url,
      isPullRequest: event.isPullRequest,
      commenter: event.commenter,
      commentBody: event.body,
    };

    const mentionsSummary = `@${event.mentionedUsernames.join(", @")} mentioned by ${event.commenter}`;

    for (const binding of bindings) {
      if (binding.discordUserId && enabledPlatforms.has("discord")) {
        const pusher = this.pushers.get("discord");
        if (pusher) {
          try {
            await pusher.sendMentionNotification(binding.discordUserId, payload);
            const cfgForDiscord = configs.find((c) => c.platform === "discord");
            if (cfgForDiscord) await this.logEvent(cfgForDiscord, "comment", "sent", mentionsSummary);
          } catch (err) {
            const cfgForDiscord = configs.find((c) => c.platform === "discord");
            if (cfgForDiscord) await this.logEvent(cfgForDiscord, "comment", "failed", mentionsSummary, String(err));
          }
        }
      }

      if (binding.slackUserId && enabledPlatforms.has("slack")) {
        const pusher = this.pushers.get("slack");
        if (pusher) {
          try {
            await pusher.sendMentionNotification(binding.slackUserId, payload);
            const cfgForSlack = configs.find((c) => c.platform === "slack");
            if (cfgForSlack) await this.logEvent(cfgForSlack, "comment", "sent", mentionsSummary);
          } catch (err) {
            const cfgForSlack = configs.find((c) => c.platform === "slack");
            if (cfgForSlack) await this.logEvent(cfgForSlack, "comment", "failed", mentionsSummary, String(err));
          }
        }
      }
    }
  }

  async handleIssueOpened(event: IssueOpenedEvent): Promise<void> {
    const configs = await this.repoConfigRepo.findActiveByRepo(event.repo);

    if (configs.length === 0) {
      this.logger.warn("No active repo configs found for issue notification", {
        repo: event.repo,
        issueId: event.issueId,
      });
      return;
    }

    for (const cfg of configs) {
      if (!(await this.isEventEnabled(cfg, "issue_opened"))) {
        await this.logEvent(cfg, "issue_opened", "skipped", `Issue #${event.issueId} opened (disabled)`);
        continue;
      }

      try {
        const pusher = this.pushers.get(cfg.platform);
        if (!pusher) {
          this.logger.warn("No pusher registered for platform", {
            platform: cfg.platform,
            repo: event.repo,
          });
          continue;
        }

        await pusher.sendIssueNotification(cfg.channelId, {
          repo: event.repo,
          title: event.title,
          author: event.author,
          url: event.url,
          action: "opened",
        });

        await this.logEvent(cfg, "issue_opened", "sent", `Issue #${event.issueId} "${event.title}" by ${event.author}`);

        this.logger.info("Issue opened notification sent", {
          repo: event.repo,
          issueId: event.issueId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      } catch (err) {
        await this.logEvent(cfg, "issue_opened", "failed", `Issue #${event.issueId} "${event.title}"`, String(err));

        this.logger.error("Failed to send issue opened notification", {
          error: String(err),
          repo: event.repo,
          issueId: event.issueId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      }
    }
  }

  async handleIssueClosed(event: IssueClosedEvent): Promise<void> {
    const configs = await this.repoConfigRepo.findActiveByRepo(event.repo);

    if (configs.length === 0) {
      this.logger.warn("No active repo configs found for issue notification", {
        repo: event.repo,
        issueId: event.issueId,
      });
      return;
    }

    for (const cfg of configs) {
      if (!(await this.isEventEnabled(cfg, "issue_closed"))) {
        await this.logEvent(cfg, "issue_closed", "skipped", `Issue #${event.issueId} closed (disabled)`);
        continue;
      }

      try {
        const pusher = this.pushers.get(cfg.platform);
        if (!pusher) {
          this.logger.warn("No pusher registered for platform", {
            platform: cfg.platform,
            repo: event.repo,
          });
          continue;
        }

        await pusher.sendIssueNotification(cfg.channelId, {
          repo: event.repo,
          title: event.title,
          author: event.author,
          url: event.url,
          action: "closed",
        });

        await this.logEvent(cfg, "issue_closed", "sent", `Issue #${event.issueId} "${event.title}" closed`);

        this.logger.info("Issue closed notification sent", {
          repo: event.repo,
          issueId: event.issueId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      } catch (err) {
        await this.logEvent(cfg, "issue_closed", "failed", `Issue #${event.issueId} "${event.title}"`, String(err));

        this.logger.error("Failed to send issue closed notification", {
          error: String(err),
          repo: event.repo,
          issueId: event.issueId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      }
    }
  }

  async handlePrReview(event: PrReviewEvent): Promise<void> {
    const configs = await this.repoConfigRepo.findActiveByRepo(event.repo);
    const configMap = new Map(configs.map((c) => [c.id, c]));

    const eventType = event.state === "approved" ? "pr_review_approved" : "pr_review_changes_requested";

    const enabledConfigIds = new Set<number>();
    for (const c of configs) {
      if (await this.isEventEnabled(c, eventType)) {
        enabledConfigIds.add(c.id);
      }
    }

    const messages = await this.prMessageRepo.findByPrAndRepo(event.prId, event.repo);
    const emoji = event.state === "approved" ? "\uD83D\uDC4D" : "\u274C";

    if (messages.length === 0) {
      this.logger.warn("No PR messages found for review reaction", {
        repo: event.repo,
        prId: event.prId,
        state: event.state,
      });
      return;
    }

    for (const msg of messages) {
      const matchingCfg = msg.repoConfigId ? configMap.get(msg.repoConfigId) : configs.find((c) => c.platform === msg.platform);

      if (matchingCfg && !enabledConfigIds.has(matchingCfg.id)) {
        await this.logEvent(matchingCfg, eventType, "skipped", `PR #${event.prId} review ${event.state} (disabled)`);
        continue;
      }

      try {
        const pusher = this.pushers.get(msg.platform);
        if (!pusher) continue;

        await pusher.addReaction(msg.platformChannelId, msg.platformMessageId, emoji);
        await pusher.removeButtons(msg.platformChannelId, msg.platformMessageId);

        if (matchingCfg) {
          await this.logEvent(matchingCfg, eventType, "sent", `PR #${event.prId} "${event.prTitle}" ${event.state} by ${event.reviewer} — ${emoji} reaction added`);
        }
      } catch (err) {
        if (matchingCfg) {
          await this.logEvent(matchingCfg, eventType, "failed", `PR #${event.prId} review ${event.state}`, String(err));
        }

        this.logger.error("Failed to add PR review reaction", {
          error: String(err),
          repo: event.repo,
          prId: event.prId,
          state: event.state,
          platform: msg.platform,
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

  async recordEvent(eventId: string, eventType: string): Promise<void> {
    await this.webhookEventRepo.create({ eventId, eventType });
  }
}
