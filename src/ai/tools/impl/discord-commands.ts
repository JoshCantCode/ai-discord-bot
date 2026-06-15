import { getClient } from "../context";
import { Tool } from "../decorator";

export class DiscordTools {
  @Tool({
    name: "check_channel_exists",
    description: "Check if a channel with the given name exists in this server",
    parameters: {
      type: "object",
      properties: {
        guildId: { type: "string", description: "The server (guild) ID" },
        channelName: {
          type: "string",
          description: "Channel name to look for (without #)",
        },
      },
      required: ["guildId", "channelName"],
    },
  })
  static async checkChannelExists(args: {
    guildId: string;
    channelName: string;
  }) {
    const client = getClient();
    const guild = await client.guilds.fetch(args.guildId);
    const channels = await guild.channels.list();
    const found = channels.find(
      (c) =>
        "name" in c && c.name?.toLowerCase() === args.channelName.toLowerCase(),
    );
    return found
      ? `Channel #${args.channelName} exists (ID: ${found.id})`
      : `No channel named #${args.channelName} found`;
  }

  @Tool({
    name: "get_channel_summary",
    description: "Get a summary of recent conversation in a channel",
    parameters: {
      type: "object",
      properties: {
        channelId: { type: "string", description: "The channel ID" },
        limit: {
          type: "integer",
          description: "How many recent messages to summarize (default 20)",
        },
      },
      required: ["channelId"],
    },
  })
  static async getChannelSummary(args: { channelId: string; limit?: number }) {
    try {
      const client = getClient();
      const channel = await client.channels.fetch(args.channelId);
      if (!channel || !("messages" in channel))
        return "Channel not found or has no messages";

      const messages = await channel.messages.list({ limit: args.limit ?? 20 });
      const text = messages
        .reverse()
        .map((m) => `${m.author.username}: ${m.content}`)
        .join("\n");

      if (!text) return "No recent messages found";

      const { summarize } = await import("../ollama");
      const result = await summarize([{ role: "user", content: text }]);
      return result.content;
    } catch (err) {
      return `Error in get_channel_summary: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  @Tool({
    name: "get_online_members",
    description: "Get a list of currently online members in this server",
    parameters: {
      type: "object",
      properties: {
        guildId: { type: "string", description: "The server (guild) ID" },
      },
      required: ["guildId"],
    },
  })
  static async getOnlineMembers(args: { guildId: string }) {
    try {
      const client = getClient();
      const guild = await client.guilds.fetch(args.guildId);
      const presences = await client.cache.presences?.values(args.guildId);

      const online = presences?.filter((p) => p.status !== "offline") ?? [];
      if (online.length === 0)
        return "No members currently online (or presence data unavailable)";

      const names = await Promise.all(
        online.slice(0, 30).map(async (p) => {
          const member = await guild.members.fetch(p.user_id).catch(() => null);
          return member?.user?.username ?? p.user_id;
        }),
      );

      return `Online members (${online.length} total): ${names.join(", ")}`;
    } catch (err) {
      return `Error in get_online_members: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
}
