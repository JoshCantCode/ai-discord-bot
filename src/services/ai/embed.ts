import { Embed } from "seyfert";

/** Return a yellow "Thinking..." embed. */
export function thinkingEmbed(): Embed {
  return new Embed().setColor(0xf59e0b).setDescription("🤔 **Thinking...**");
}

/** Return a green response embed with optional title/footer. */
export function responseEmbed(
  content: string,
  title?: string,
  footer?: string,
): Embed {
  const embed = new Embed().setColor(0x22c55e).setDescription(content);
  if (title) embed.setTitle(title);
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

/** Return a red error embed with the given message. */
export function errorEmbed(message: string): Embed {
  return new Embed()
    .setColor(0xef4444)
    .setTitle("❌ Error")
    .setDescription(message);
}
