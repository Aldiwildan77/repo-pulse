import type { Config } from "../../infrastructure/config.js";
import type { RepositoryFactory } from "../../repositories/factory.js";
import type { InfrastructureFactory } from "../../infrastructure/factory.js";
import type { Platform } from "../entities/index.js";
import type { Pusher } from "./pusher/pusher.interface.js";
import { DiscordPusher } from "./pusher/discord.pusher.js";
import { SlackPusher } from "./pusher/slack.pusher.js";
import { NotifierModule } from "./notifier.js";
import { AuthModule } from "./auth.js";
import { AdminModule } from "./admin.js";

export class ModuleFactory {
  readonly notifier: NotifierModule;
  readonly auth: AuthModule;
  readonly admin: AdminModule;

  constructor(config: Config, repos: RepositoryFactory, infra: InfrastructureFactory) {
    const pushers = new Map<Platform, Pusher>([
      ["discord", new DiscordPusher(config.discordBotToken)],
      ["slack", new SlackPusher(config.slackBotToken)],
    ]);

    this.notifier = new NotifierModule(
      config,
      repos.prMessage,
      repos.repoConfig,
      repos.userBinding,
      repos.webhookEvent,
      repos.connectedRepo,
      pushers,
    );

    this.auth = new AuthModule(
      config,
      repos.userBinding,
      infra.githubOAuth,
      infra.discordOAuth,
      infra.slackOAuth,
      infra.jwt,
    );

    this.admin = new AdminModule(config, repos.repoConfig, repos.connectedRepo);
  }
}
