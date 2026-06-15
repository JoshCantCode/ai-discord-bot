import {
  ActionRow,
  Command,
  CommandContext,
  Declare,
  Embed,
  StringSelectMenu,
  StringSelectOption,
} from "seyfert";
import { listModels } from "src/ai/ollama";
import { config, edit } from "src/config/config";
import { getModelInfo, formatCapabilities, formatCapBadges } from "src/config/models";

const SELECT_CUSTOM_ID = "model-select";

function buildEmbed(currentModel: string) {
  const info = getModelInfo(currentModel);

  return new Embed()
    .setTitle("AI Model")
    .setDescription(
      `**${info.label}**\n${formatCapabilities(info.capabilities)}`,
    )
    .setColor("Blue");
}

function buildSelectMenu(models: string[], currentModel: string) {
  const options = models.slice(0, 25).map((name) => {
    const info = getModelInfo(name);
    return new StringSelectOption()
      .setLabel(info.label)
      .setValue(name)
      .setDescription(formatCapBadges(info.capabilities))
      .setDefault(name === currentModel);
  });

  return new StringSelectMenu()
    .setCustomId(SELECT_CUSTOM_ID)
    .setPlaceholder("Choose a model")
    .setOptions(options);
}

@Declare({
  name: "model",
  description: "Choose which AI model to use. Must be installed on the device.",
})
export default class ModelCommand extends Command {
  async run(ctx: CommandContext) {
    const models = await listModels();

    if (models.length === 0) {
      await ctx.write({
        content:
          "No models found. Make sure Ollama is running and has models installed.",
      });
      return;
    }

    const row = new ActionRow<StringSelectMenu>().addComponents(
      buildSelectMenu(models, config.model),
    );

    const message = await ctx.write(
      {
        embeds: [buildEmbed(config.model)],
        components: [row],
      },
      true,
    );

    const collector = message.createComponentCollector({ timeout: 120_000 });

    collector.run(SELECT_CUSTOM_ID, async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;

      const selected = interaction.values[0];
      const info = getModelInfo(selected);

      edit("model", selected);
      edit("thinking", info.capabilities.includes("thinking"));

      await interaction.update({
        embeds: [buildEmbed(selected)],
        components: [
          new ActionRow<StringSelectMenu>().addComponents(
            buildSelectMenu(models, selected),
          ),
        ],
      });
    });
  }
}
