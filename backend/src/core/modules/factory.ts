import type { Config } from "../../infrastructure/config.js";
import type { RepositoryFactory } from "../../repositories/factory.js";
import type { InfrastructureFactory } from "../../infrastructure/factory.js";
import type { NotificationPlatform } from "../entities/index.js";
import type { Pusher } from "./pusher/pusher.interface.js";
import { DiscordPusher } from "./pusher/discord.pusher.js";
import { SlackPusher } from "./pusher/slack.pusher.js";
import { NotifierModule } from "./notifier.js";
import { AuthModule } from "./auth.js";
import { AdminModule } from "./admin.js";
import { TotpModule } from "./totp.js";
import { FeedbackModule } from "./feedback.js";
import { WorkspaceModule } from "./workspace.js";
import { GitHubApiClient } from "../../infrastructure/auth/github-api.js";

export class ModuleFactory {
  readonly notifier: NotifierModule;
  readonly auth: AuthModule;
  readonly admin: AdminModule;
  readonly totp: TotpModule;
  readonly feedback: FeedbackModule;
  readonly workspace: WorkspaceModule;

  constructor(config: Config, repos: RepositoryFactory, infra: InfrastructureFactory) {
    const pushers = new Map<NotificationPlatform, Pusher>([
      ["discord", new DiscordPusher(config.discordBotToken)],
      ["slack", new SlackPusher(config.slackBotToken)],
    ]);

    this.notifier = new NotifierModule(
      config,
      repos.notificationDelivery,
      repos.repoConfigNotification,
      repos.user,
      repos.webhookEvent,
      repos.notifierLog,
      pushers,
      infra.logger.child({ module: "notifier" }),
    );


    this.totp = new TotpModule(repos.userTotp, infra.crypto, infra.jwt);

    this.auth = new AuthModule(
      config,
      repos.user,
      repos.workspace,
      repos.auth,
      infra.githubOAuth,
      infra.googleOAuth,
      infra.gitlabOAuth,
      infra.discordOAuth,
      infra.slackOAuth,
      infra.jwt,
      this.totp,
      infra.crypto,
    );

    const githubApi = new GitHubApiClient();

    this.admin = new AdminModule(config, repos.repoConfig, repos.repoConfigNotification, repos.workspace, repos.notifierLog, pushers, githubApi, infra.gitlabApi);
    this.admin.setAuthModule(this.auth);

    this.feedback = new FeedbackModule(repos.feedback);
    this.workspace = new WorkspaceModule(repos.workspace, repos.user);
  }
}
