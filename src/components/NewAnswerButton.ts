import { ActionRow, Button, ComponentCommand, ComponentContext } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types";
import { chat } from "src/ai/ollama";
import { config } from "src/config/config";
import { conversation } from "src/services";
import {
  thinkingEmbed,
  responseEmbed,
  errorEmbed,
} from "src/services/ai/embed";

export default class NewAnswerButtonCommand extends ComponentCommand {
  componentType = "Button" as const;

  filter(
    context: ComponentContext<typeof this.componentType>,
  ): Promise<boolean> | boolean {
    return context.customId === "bot:new_answer";
  }

  async run(context: ComponentContext<typeof this.componentType>) {
    const channel = await context.channel();

    const messages = await conversation.get(channel.id, 40);
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      messages.pop();
    }

    const row = new ActionRow().setComponents(
      new Button()
        .setEmoji("🔁")
        .setLabel("Redo answer")
        .setCustomId("bot:new_answer")
        .setStyle(ButtonStyle.Primary),
      new Button()
        .setEmoji("🗑️")
        .setLabel("Remove")
        .setCustomId("bot:remove_answer")
        .setStyle(ButtonStyle.Danger),
    );

    await context.deferUpdate();

    await context.editResponse({
      embeds: [thinkingEmbed()],
      components: [row],
    });

    const systemPrompt = process.env.SYSTEM_PROMPT ?? "";

    try {
      const result = await chat(messages, config.model, systemPrompt);
      context.client.logger.debug(
        "Redo",
        `len=${result.content.length}`,
        result.content,
      );

      const footer = `⚡ ${result.totalTokens} tokens in ${(result.durationMs / 1000).toFixed(1)}s | ${config.model}`;

      const embed = responseEmbed(result.content, undefined, footer);
      await context.editResponse({
        embeds: [embed],
        components: [row],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await context.editResponse({
        embeds: [errorEmbed(msg)],
        components: [row],
      });
    }
  }
}
