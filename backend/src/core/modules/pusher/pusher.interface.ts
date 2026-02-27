export interface PrNotificationPayload {
  repo: string;
  title: string;
  author: string;
  url: string;
}

export interface MentionNotificationPayload {
  repo: string;
  prTitle: string;
  prUrl: string;
  commenter: string;
  commentBody: string;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

export interface Channel {
  id: string;
  name: string;
}

export interface Pusher {
  sendPrNotification(
    channelId: string,
    payload: PrNotificationPayload,
  ): Promise<string>; // returns platform message ID

  sendMentionNotification(
    userId: string,
    payload: MentionNotificationPayload,
  ): Promise<void>;

  addReaction(
    channelId: string,
    messageId: string,
    emoji: string,
  ): Promise<void>;

  listGuilds?(): Promise<Guild[]>;
  listChannels(guildId?: string): Promise<Channel[]>;
}
