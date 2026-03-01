import type { Kysely } from "kysely";
import type { Redis } from "ioredis";
import type { Config } from "./config.js";
import type { Database } from "./database/types.js";
import { createDatabase } from "./database/connection.js";
import { createRedisClient } from "./redis/connection.js";
import { IdempotencyStore } from "./redis/idempotency.js";
import { JwtService } from "./auth/jwt.js";
import { GitHubOAuthService } from "./auth/github-oauth.js";
import { GoogleOAuthService } from "./auth/google-oauth.js";
import { DiscordOAuthService } from "./auth/discord-oauth.js";
import { SlackOAuthService } from "./auth/slack-oauth.js";
import { GitLabOAuthService } from "./auth/gitlab-oauth.js";
import { GitLabApiClient } from "./auth/gitlab-api.js";
import { CryptoService } from "./auth/crypto.js";
import { RateLimiter } from "./rate-limiter/rate-limiter.js";
import { AppLogger } from "./logger/logger.js";

export class InfrastructureFactory {
  readonly db: Kysely<Database>;
  readonly redis: Redis;
  readonly jwt: JwtService;
  readonly logger: AppLogger;
  readonly idempotency: IdempotencyStore;
  readonly githubOAuth: GitHubOAuthService;
  readonly googleOAuth: GoogleOAuthService | null;
  readonly gitlabOAuth: GitLabOAuthService | null;
  readonly gitlabApi: GitLabApiClient;
  readonly discordOAuth: DiscordOAuthService;
  readonly slackOAuth: SlackOAuthService;
  readonly crypto: CryptoService;
  readonly rateLimiter: RateLimiter;

  constructor(config: Config) {
    this.db = createDatabase(config.databaseUrl, config.debugQueryLog);
    this.redis = createRedisClient(config.redisUrl);
    this.jwt = new JwtService(config.jwtSecret, config.jwtAccessExpiry, config.jwtRefreshExpiry);
    this.logger = new AppLogger("repo-pulse");
    this.idempotency = new IdempotencyStore(this.redis);
    this.githubOAuth = new GitHubOAuthService(
      config.githubClientId,
      config.githubClientSecret,
      config.githubCallbackUrl,
    );
    this.googleOAuth =
      config.googleClientId && config.googleClientSecret && config.googleCallbackUrl
        ? new GoogleOAuthService(
            config.googleClientId,
            config.googleClientSecret,
            config.googleCallbackUrl,
          )
        : null;
    this.gitlabOAuth =
      config.gitlabClientId && config.gitlabClientSecret && config.gitlabCallbackUrl
        ? new GitLabOAuthService(
            config.gitlabClientId,
            config.gitlabClientSecret,
            config.gitlabCallbackUrl,
          )
        : null;
    this.gitlabApi = new GitLabApiClient();
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
    this.crypto = new CryptoService(config.jwtSecret);
    this.rateLimiter = new RateLimiter(this.redis);
  }
}
