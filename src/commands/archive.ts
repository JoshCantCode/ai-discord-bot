import { Command, CommandContext, Declare } from "seyfert";

@Declare({
  name: "archive",
  aliases: [],
  description: "Archives a conversation and locks the thread",
})
export default class ArchiveCommand extends Command {
  async run(context: CommandContext) {}
}
