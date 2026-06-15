import { Command, CommandContext, Declare, Embed } from "seyfert";
import { summarize } from "src/ai/ollama";
import { config } from "src/config/config";
import { conversation } from "src/services";
import { errorEmbed, responseEmbed } from "src/services/ai/embed";

@Declare({
  name: "archive",
  description: "Archives a conversation and locks the thread",
})
export default class ArchiveCommand extends Command {
  async run(context: CommandContext) {
    const channel = await context.channel();

    if (!channel.isThread()) {
      return context.write({
        embeds: [
          errorEmbed("This command can only be used in a thread channel"),
        ],
      });
    }

    const lockedEmbed = new Embed()
      .setTitle("🔒 Thread locked")
      .setColor("Yellow")
      .setDescription("This thread has been archived and locked");

    let messages;
    try {
      messages = await conversation.get(channel.id);
    } catch {
      return context.write({
        embeds: [
          errorEmbed("There was an error fetching the conversation history."),
        ],
      });
    }

    await context.deferReply();
    try {
      const result = await summarize(messages);
      const footer = `⚡ ${result.totalTokens} tokens in ${(result.durationMs / 1000).toFixed(1)}s | ${config.model}`;
      await context.editResponse({
        embeds: [
          lockedEmbed,
          responseEmbed(result.content, "Conversation Summary", footer),
        ],
      });

      // lock it to prevent new messages being sent
      await channel.setLocked(true);
      await channel.setArchived(true);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return await context.editResponse({
        embeds: [errorEmbed(msg)],
      });
    }
  }
}
