import type { Kysely } from "kysely";
import type { Redis } from "ioredis";
import type { Config } from "./config.js";
import type { Database } from "./database/types.js";
import { createDatabase } from "./database/connection.js";
import { createRedisClient } from "./redis/connection.js";
import { IdempotencyStore } from "./redis/idempotency.js";
import { JwtService } from "./auth/jwt.js";
import { GitHubOAuthService } from "./auth/github-oauth.js";
import { DiscordOAuthService } from "./auth/discord-oauth.js";
import { SlackOAuthService } from "./auth/slack-oauth.js";
import { RateLimiter } from "./rate-limiter/rate-limiter.js";
import { AppLogger } from "./logger/logger.js";

export class InfrastructureFactory {
  readonly db: Kysely<Database>;
  readonly redis: Redis;
  readonly jwt: JwtService;
  readonly logger: AppLogger;
  readonly idempotency: IdempotencyStore;
  readonly githubOAuth: GitHubOAuthService;
  readonly discordOAuth: DiscordOAuthService;
  readonly slackOAuth: SlackOAuthService;
  readonly rateLimiter: RateLimiter;

  constructor(config: Config) {
    this.db = createDatabase(config.databaseUrl);
    this.redis = createRedisClient(config.redisUrl);
    this.jwt = new JwtService(config.jwtSecret, config.jwtAccessExpiry, config.jwtRefreshExpiry);
    this.logger = new AppLogger("repo-pulse");
    this.idempotency = new IdempotencyStore(this.redis);
    this.githubOAuth = new GitHubOAuthService(
      config.githubClientId,
      config.githubClientSecret,
      config.githubCallbackUrl,
    );
    this.discordOAuth = new DiscordOAuthService(
      config.discordClientId,
      config.discordClientSecret,
      config.discordCallbackUrl,
    );
    this.slackOAuth = new SlackOAuthService(
      config.slackClientId,
      config.slackClientSecret,
      config.slackCallbackUrl,
    );
    this.rateLimiter = new RateLimiter(this.redis);
  }
}
