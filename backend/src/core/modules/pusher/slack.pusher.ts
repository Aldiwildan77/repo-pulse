import { WebClient } from "@slack/web-api";
import type { Pusher, PrNotificationPayload, MentionNotificationPayload } from "./pusher.interface.js";

export class SlackPusher implements Pusher {
  private readonly client: WebClient;

  constructor(botToken: string) {
    this.client = new WebClient(botToken);
  }

  async sendPrNotification(channelId: string, payload: PrNotificationPayload): Promise<string> {
    const result = await this.client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `:rocket: *New Pull Request*`,
              `*Repo:* ${payload.repo}`,
              `*Title:* ${payload.title}`,
              `*Author:* @${payload.author}`,
              `*Link:* <${payload.url}|View PR>`,
            ].join("\n"),
          },
        },
      ],
      text: `New PR: ${payload.title} by ${payload.author}`,
    });

    if (!result.ts) {
      throw new Error("Slack message sent but no timestamp returned");
    }
    return result.ts;
  }

  async sendMentionNotification(userId: string, payload: MentionNotificationPayload): Promise<void> {
    await this.client.chat.postMessage({
      channel: userId, // DM by user ID
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `:speech_balloon: *You were mentioned in a PR comment*`,
              `*Repo:* ${payload.repo}`,
              `*PR:* ${payload.prTitle}`,
              `*By:* @${payload.commenter}`,
              `*Comment:* ${payload.commentBody.slice(0, 200)}`,
              `*Link:* <${payload.prUrl}|View PR>`,
            ].join("\n"),
          },
        },
      ],
      text: `${payload.commenter} mentioned you in ${payload.prTitle}`,
    });
  }

  async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    // Slack reactions use names without colons
    const reactionName = emoji.replace(/:/g, "");
    await this.client.reactions.add({
      channel: channelId,
      timestamp: messageId,
      name: reactionName,
    });
  }
}
