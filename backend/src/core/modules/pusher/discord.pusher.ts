import { Client, EmbedBuilder, GatewayIntentBits } from "discord.js";
import type { Pusher, PrNotificationPayload, MentionNotificationPayload } from "./pusher.interface.js";

export class DiscordPusher implements Pusher {
  private readonly client: Client;
  private ready: Promise<void>;

  constructor(botToken: string) {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    this.ready = this.client.login(botToken).then(() => {});
  }

  async sendPrNotification(channelId: string, payload: PrNotificationPayload): Promise<string> {
    await this.ready;

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      throw new Error(`Channel ${channelId} not found or not a text channel`);
    }

    const embed = new EmbedBuilder()
      .setTitle("New Pull Request")
      .setDescription(
        [
          `**Repo:** ${payload.repo}`,
          `**Title:** ${payload.title}`,
          `**Author:** @${payload.author}`,
          `**Link:** ${payload.url}`,
        ].join("\n"),
      )
      .setColor(0x2f8b3a);

    const message = await channel.send({ embeds: [embed] });
    return message.id;
  }

  async sendMentionNotification(userId: string, payload: MentionNotificationPayload): Promise<void> {
    await this.ready;

    const user = await this.client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle("You were mentioned in a PR comment")
      .setDescription(
        [
          `**Repo:** ${payload.repo}`,
          `**PR:** ${payload.prTitle}`,
          `**By:** @${payload.commenter}`,
          `**Comment:** ${payload.commentBody.slice(0, 200)}`,
          `**Link:** ${payload.prUrl}`,
        ].join("\n"),
      )
      .setColor(0x5865f2);

    await user.send({ embeds: [embed] });
  }

  async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    await this.ready;

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      throw new Error(`Channel ${channelId} not found or not a text channel`);
    }

    const message = await channel.messages.fetch(messageId);
    await message.react(emoji);
  }
}
