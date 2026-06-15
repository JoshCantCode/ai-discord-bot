import { ComponentCommand, ComponentContext, Embed, ThreadChannel } from "seyfert";
import { conversation } from "src/services";

export default class RemoveAnswerButtonCommand extends ComponentCommand {
  componentType = "Button" as const;

  filter(
    context: ComponentContext<typeof this.componentType>,
  ): Promise<boolean> | boolean {
    return context.customId === "bot:remove_answer";
  }

  async run(context: ComponentContext<typeof this.componentType>) {
    const channel = (await context.channel()) as ThreadChannel;
    const desc = context.interaction.message.embeds[0]?.description;
    if (!desc) return;

    await context.deferUpdate();

    try {
      const { userMsgId } = await conversation.deleteMessagePair(channel.id, desc);
      await context.deleteResponse();

      if (userMsgId) {
        await channel.messages.delete(userMsgId);
      }
    } catch (err) {
      context.client.logger.error("RemoveAnswerButton", err);
    }

    const embed = new Embed()
      .setTitle("Deleted Response")
      .setDescription(
        "This message has been removed from the conversation and memory. The bot will not remember it",
      );

    await channel.messages.write({
      embeds: [embed],
    });
  }
}
