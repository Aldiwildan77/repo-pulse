import { z } from 'zod';

const configSchema = z.object({
  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),

  githubWebhookSecret: z.string().trim().min(1),
  githubClientId: z.string().min(1),
  githubClientSecret: z.string().min(1),
  githubCallbackUrl: z.string().url(),

  discordBotToken: z.string().min(1),
  discordClientId: z.string().min(1),
  discordClientSecret: z.string().min(1),
  discordCallbackUrl: z.string().url(),

  slackBotToken: z.string().min(1),
  slackClientId: z.string().min(1),
  slackClientSecret: z.string().min(1),
  slackCallbackUrl: z.string().url(),

  githubAppSlug: z.string().min(1).optional(),

  googleClientId: z.string().min(1).optional(),
  googleClientSecret: z.string().min(1).optional(),
  googleCallbackUrl: z.string().url().optional(),

  gitlabClientId: z.string().min(1).optional(),
  gitlabClientSecret: z.string().min(1).optional(),
  gitlabCallbackUrl: z.string().url().optional(),
  gitlabWebhookSecret: z.string().optional(),
  bitbucketWebhookSecret: z.string().optional(),

  jwtSecret: z.string().min(10),
  jwtAccessExpiry: z.string().default('15m'),
  jwtRefreshExpiry: z.string().default('7d'),

  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),
  frontendUrl: z.string().url(),
  cookieDomain: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,

    githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    githubCallbackUrl: process.env.GITHUB_CALLBACK_URL,

    discordBotToken: process.env.DISCORD_BOT_TOKEN,
    discordClientId: process.env.DISCORD_CLIENT_ID,
    discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
    discordCallbackUrl: process.env.DISCORD_CALLBACK_URL,

    slackBotToken: process.env.SLACK_BOT_TOKEN,
    slackClientId: process.env.SLACK_CLIENT_ID,
    slackClientSecret: process.env.SLACK_CLIENT_SECRET,
    slackCallbackUrl: process.env.SLACK_CALLBACK_URL,

    githubAppSlug: process.env.GITHUB_APP_SLUG,

    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,

    gitlabClientId: process.env.GITLAB_CLIENT_ID,
    gitlabClientSecret: process.env.GITLAB_CLIENT_SECRET,
    gitlabCallbackUrl: process.env.GITLAB_CALLBACK_URL,
    gitlabWebhookSecret: process.env.GITLAB_WEBHOOK_SECRET,
    bitbucketWebhookSecret: process.env.BITBUCKET_WEBHOOK_SECRET,

    jwtSecret: process.env.JWT_SECRET,
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY,
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY,

    port: process.env.PORT,
    host: process.env.HOST,
    frontendUrl: process.env.FRONTEND_URL,
    cookieDomain: process.env.COOKIE_DOMAIN,
  });
}
