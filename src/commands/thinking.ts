import { Command, CommandContext, Declare, Embed } from "seyfert";
import { config, edit } from "src/config/config";

@Declare({
  name: "thinking",
  description: "Toggle whether the AI thinks",
})
export default class ThinkingCommand extends Command {
  async run(context: CommandContext) {
    edit("thinking", !config.thinking);
    const embed = new Embed()
      .setDescription(`Thinking set to \`${config.thinking}\``)
      .setColor("Green");

    await context.write({
      embeds: [embed],
    });
  }
}
