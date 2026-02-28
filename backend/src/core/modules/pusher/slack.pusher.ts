import { WebClient } from "@slack/web-api";
import type { Pusher, PrNotificationPayload, MentionNotificationPayload, LabelNotificationPayload, IssueNotificationPayload, Channel } from "./pusher.interface.js";

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
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: ":white_check_mark: Approve", emoji: true },
              url: `${payload.url}/files#submit-review`,
            },
            {
              type: "button",
              text: { type: "plain_text", text: ":arrows_counterclockwise: Request Changes", emoji: true },
              url: `${payload.url}/files#submit-review`,
            },
          ],
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
    const kind = payload.isPullRequest ? "PR" : "Issue";
    await this.client.chat.postMessage({
      channel: userId, // DM by user ID
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `:speech_balloon: *You were mentioned in a ${kind} comment*`,
              `*Repo:* ${payload.repo}`,
              `*${kind}:* ${payload.title}`,
              `*By:* @${payload.commenter}`,
              `*Comment:* ${payload.commentBody.slice(0, 200)}`,
              `*Link:* <${payload.url}|View ${kind}>`,
            ].join("\n"),
          },
        },
      ],
      text: `${payload.commenter} mentioned you in ${payload.title}`,
    });
  }

  async sendLabelNotification(channelId: string, payload: LabelNotificationPayload): Promise<void> {
    const actionText = payload.action === "labeled" ? "Label Added" : "Label Removed";
    const emoji = payload.action === "labeled" ? ":label:" : ":wastebasket:";

    await this.client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `${emoji} *${actionText}*`,
              `*Repo:* ${payload.repo}`,
              `*PR:* ${payload.prTitle}`,
              `*Label:* \`${payload.label.name}\``,
              `*By:* @${payload.author}`,
              `*Link:* <${payload.prUrl}|View PR>`,
            ].join("\n"),
          },
        },
      ],
      text: `${actionText}: ${payload.label.name} on ${payload.prTitle}`,
    });
  }

  async sendIssueNotification(channelId: string, payload: IssueNotificationPayload): Promise<void> {
    const isOpened = payload.action === "opened";
    const emoji = isOpened ? ":clipboard:" : ":white_check_mark:";

    await this.client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `${emoji} *Issue ${isOpened ? "Opened" : "Closed"}*`,
              `*Repo:* ${payload.repo}`,
              `*Title:* ${payload.title}`,
              `*Author:* @${payload.author}`,
              `*Link:* <${payload.url}|View Issue>`,
            ].join("\n"),
          },
        },
      ],
      text: `Issue ${payload.action}: ${payload.title} by ${payload.author}`,
    });
  }

  async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    // Map Unicode emoji to Slack reaction names
    const emojiMap: Record<string, string> = {
      "\u2705": "white_check_mark",
      "\u274C": "x",
      "\uD83D\uDC4D": "+1",
    };
    const reactionName = emojiMap[emoji] ?? emoji.replace(/:/g, "");
    await this.client.reactions.add({
      channel: channelId,
      timestamp: messageId,
      name: reactionName,
    });
  }

  async removeButtons(channelId: string, messageId: string): Promise<void> {
    const result = await this.client.conversations.history({
      channel: channelId,
      latest: messageId,
      inclusive: true,
      limit: 1,
    });

    const originalMessage = result.messages?.[0];
    if (!originalMessage) {
      throw new Error(`Message ${messageId} not found in channel ${channelId}`);
    }

    const blocksWithoutActions = (originalMessage.blocks ?? []).filter(
      (block) => block.type !== "actions",
    );

    await this.client.chat.update({
      channel: channelId,
      ts: messageId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blocks: blocksWithoutActions as any,
      text: originalMessage.text ?? "",
    });
  }

  async listChannels(): Promise<Channel[]> {
    const channels: Channel[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.client.conversations.list({
        types: "public_channel,private_channel",
        exclude_archived: true,
        limit: 200,
        cursor,
      });

      for (const ch of result.channels ?? []) {
        if (ch.id && ch.name) {
          channels.push({ id: ch.id, name: ch.name });
        }
      }

      cursor = result.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return channels;
  }
}
