import { ActionRow, Button, createEvent, TextGuildChannel } from "seyfert";
import { stripMention, truncateThreadName } from "src/util/string";
import { config } from "src/config/config";
import { aiRespond, conversation } from "src/services";
import { ButtonStyle } from "seyfert/lib/types";

const MAX_MESSAGES = parseInt(process.env.MAX_MESSAGES_PER_THREAD ?? "40", 10);
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ?? "";

export default createEvent({
  data: { name: "messageCreate" },
    async run(message, client) {
    if (message.user.bot) return;

    try {
      const channel = await message.channel();

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

      if (!channel.isThread()) {
        if (
          !message.mentions.users.some((u) => u.id === client.me?.id) ||
          message.mentionEveryone
        )
          return;

        const content = stripMention(message.content, client.me!.id);
        const thread = await (
          channel as TextGuildChannel
        ).client.threads.fromMessage(channel.id, message.id, {
          name: `Bot - ${truncateThreadName(content, 30)}`,
        });

        await thread.messages.write({
          content:
            "A new thread has been created for your conversation. If you are finished, please use the `/archive` command",
        });

        await conversation.add(thread.id, "user", content, message.id);

        const result = await aiRespond({
          channel: thread,
          messages: await conversation.get(thread.id),
          model: config.model,
          thinking: config.thinking,
          systemPrompt: SYSTEM_PROMPT,
          components: row,
        });
        await conversation.add(thread.id, "assistant", result.content);
        return;
      }

      await conversation.add(channel.id, "user", message.content, message.id);

      const messages = await conversation.get(channel.id, MAX_MESSAGES);
      const threadCfg = await conversation.getConfig(channel.id);

      const result = await aiRespond({
        channel,
        messages,
        model: threadCfg.model ?? config.model,
        thinking: threadCfg.thinking,
        systemPrompt: SYSTEM_PROMPT,
        components: row,
      });

      await conversation.add(channel.id, "assistant", result.content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("messageCreate error:", msg);
    }
  },
});
