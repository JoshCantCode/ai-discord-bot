import { Command, CommandContext, Declare } from "seyfert";
import { summarize } from "src/ai/ollama";
import { config } from "src/config/config";
import { conversation } from "src/services";
import { responseEmbed, errorEmbed } from "src/services/ai/embed";

@Declare({
  name: "summary",
  aliases: ["summarize", "summ"],
  description:
    "Use this command in a bot conversation to summarize all messages so far",
})
export default class SummaryCommand extends Command {
  async run(context: CommandContext) {
    const channel = await context.channel();
    if (!channel.isThread())
      return context.write({
        embeds: [errorEmbed("You can only use this in a thread channel!")],
      });

    if (!conversation.exists(channel.id)) {
      return context.write({
        embeds: [errorEmbed("No conversation exists in this thread!")],
      });
    }

    let messages;
    try {
      messages = await conversation.get(channel.id);
    } catch {
      return context.write({
        content: "There was an error fetching the conversation history.",
      });
    }

    await context.deferReply();

    try {
      const threadCfg = await conversation.getConfig(channel.id);
      const model = threadCfg.model ?? config.model;
      const result = await summarize(messages, model);
      const footer = `⚡ ${result.totalTokens} tokens in ${(result.durationMs / 1000).toFixed(1)}s | ${model}`;
      await context.editResponse({
        embeds: [responseEmbed(result.content, "Conversation Summary", footer)],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await context.editResponse({
        embeds: [errorEmbed(msg)],
      });
    }
  }
}
