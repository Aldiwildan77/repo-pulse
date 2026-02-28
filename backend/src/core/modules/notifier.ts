import type { Config } from "../../infrastructure/config.js";
import type { PrMessageRepository } from "../repositories/pr-message.repository.js";
import type { RepoConfigRepository } from "../repositories/repo-config.repository.js";
import type { UserBindingRepository } from "../repositories/user-binding.repository.js";
import type { WebhookEventRepository } from "../repositories/webhook-event.repository.js";
import type { ConnectedRepoRepository } from "../repositories/connected-repo.repository.js";
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

export class NotifierModule {
  constructor(
    private readonly config: Config,
    private readonly prMessageRepo: PrMessageRepository,
    private readonly repoConfigRepo: RepoConfigRepository,
    private readonly userBindingRepo: UserBindingRepository,
    private readonly webhookEventRepo: WebhookEventRepository,
    private readonly connectedRepoRepo: ConnectedRepoRepository,
    private readonly pushers: Map<Platform, Pusher>,
    private readonly logger: AppLogger,
  ) {}

  private async isEventEnabled(cfg: RepoConfig, eventType: string): Promise<boolean> {
    return this.repoConfigRepo.isEventEnabled(cfg.id, eventType);
  }

  async handlePrOpened(event: PrOpenedEvent): Promise<void> {
    const configs = await this.repoConfigRepo.findActiveByRepo(event.repo);

    if (configs.length === 0) {
      this.logger.warn("No active repo configs found for PR notification", {
        repo: event.repo,
        prId: event.prId,
      });
      return;
    }

    for (const cfg of configs) {
      if (!(await this.isEventEnabled(cfg, "pr_opened"))) continue;

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
        });

        this.logger.info("PR notification sent", {
          repo: event.repo,
          prId: event.prId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      } catch (err) {
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
      if (!(await this.isEventEnabled(cfg, "pr_label"))) continue;

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

        this.logger.info("Label notification sent", {
          repo: event.repo,
          prId: event.prId,
          action: event.action,
          label: event.label.name,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      } catch (err) {
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

    const enabledPlatforms = new Set<Platform>();
    for (const c of configs) {
      if (await this.isEventEnabled(c, "pr_merged")) {
        enabledPlatforms.add(c.platform);
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
      if (!enabledPlatforms.has(msg.platform)) continue;

      try {
        const pusher = this.pushers.get(msg.platform);
        if (!pusher) continue;

        await pusher.addReaction(msg.platformChannelId, msg.platformMessageId, emoji);
        await this.prMessageRepo.updateStatus(msg.id, status);
      } catch (err) {
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

    for (const binding of bindings) {
      if (binding.discordUserId && enabledPlatforms.has("discord")) {
        const pusher = this.pushers.get("discord");
        if (pusher) {
          await pusher.sendMentionNotification(binding.discordUserId, payload);
        }
      }

      if (binding.slackUserId && enabledPlatforms.has("slack")) {
        const pusher = this.pushers.get("slack");
        if (pusher) {
          await pusher.sendMentionNotification(binding.slackUserId, payload);
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
      if (!(await this.isEventEnabled(cfg, "issue_opened"))) continue;

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

        this.logger.info("Issue opened notification sent", {
          repo: event.repo,
          issueId: event.issueId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      } catch (err) {
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
      if (!(await this.isEventEnabled(cfg, "issue_closed"))) continue;

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

        this.logger.info("Issue closed notification sent", {
          repo: event.repo,
          issueId: event.issueId,
          platform: cfg.platform,
          channelId: cfg.channelId,
        });
      } catch (err) {
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

  async handleInstallationCreated(event: InstallationCreatedEvent): Promise<void> {
    if (event.repos.length === 0) return;

    await this.connectedRepoRepo.addRepos(
      event.repos.map((repo) => ({
        provider: event.provider,
        providerInstallationId: event.installationId,
        providerRepo: repo,
        connectedBy: event.senderUserId,
      })),
    );
  }

  async handleInstallationDeleted(event: InstallationDeletedEvent): Promise<void> {
    await this.connectedRepoRepo.removeByInstallation(event.provider, event.installationId);
  }

  async handleInstallationReposChanged(event: InstallationReposChangedEvent): Promise<void> {
    if (event.added.length > 0) {
      await this.connectedRepoRepo.addRepos(
        event.added.map((repo) => ({
          provider: event.provider,
          providerInstallationId: event.installationId,
          providerRepo: repo,
          connectedBy: event.senderUserId,
        })),
      );
    }

    if (event.removed.length > 0) {
      await this.connectedRepoRepo.removeRepos(
        event.removed.map((repo) => ({
          provider: event.provider,
          providerRepo: repo,
        })),
      );
    }
  }

  async recordEvent(eventId: string, eventType: string): Promise<void> {
    await this.webhookEventRepo.create({ eventId, eventType });
  }
}
