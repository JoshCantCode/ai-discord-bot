import { Command, CommandContext, Declare, Embed } from "seyfert";
import { config, edit } from "src/config/config";
import { conversation } from "src/services";

@Declare({
  name: "thinking",
  description: "Toggle whether the AI thinks",
})
export default class ThinkingCommand extends Command {
  async run(context: CommandContext) {
    const channel = await context.channel();
    const isThread = channel.isThread();

    if (isThread) {
      const threadCfg = await conversation.getConfig(channel.id);
      const current = threadCfg.thinking ?? config.thinking;
      await conversation.setConfig(channel.id, { thinking: !current });
      const embed = new Embed()
        .setDescription(`Thinking set to \`${!current}\` for this thread`)
        .setColor("Green");
      await context.write({ embeds: [embed] });
    } else {
      edit("thinking", !config.thinking);
      const embed = new Embed()
        .setDescription("Thinking set to `" + config.thinking + "` globally")
        .setColor("Green");
      await context.write({ embeds: [embed] });
    }
  }
}
