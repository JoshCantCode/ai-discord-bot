import { Command, CommandContext, Declare, Embed } from "seyfert";
import { config } from "src/config/config";
import { conversation } from "src/services";
import { getModelInfo, formatCapabilities } from "src/config/models";

@Declare({
  name: "status",
  description: "Show the current model and thinking settings for this conversation",
})
export default class StatusCommand extends Command {
  async run(context: CommandContext) {
    const channel = await context.channel();
    const threadCfg = channel.isThread()
      ? await conversation.getConfig(channel.id)
      : {};

    const modelName = threadCfg.model ?? config.model;
    const thinking = threadCfg.thinking ?? config.thinking;
    const info = getModelInfo(modelName);
    const badge = thinking ? "Enabled 🧠" : "Disabled";

    const embed = new Embed()
      .setTitle("Conversation Status")
      .setDescription(
        `**Model:** ${info.label}\n${formatCapabilities(info.capabilities)}\n\n**Thinking:** ${badge}`,
      )
      .setColor("Blue");

    await context.write({ embeds: [embed] });
  }
}
