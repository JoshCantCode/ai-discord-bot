import { ActionRow, Embed } from "seyfert";
import { chat, type Message, type ChatResult } from "src/ai/ollama";
import { config } from "src/config/config";
import { thinkingEmbed, responseEmbed, errorEmbed } from "./embed";

interface ResponderMessage {
  edit(opts: {
    embeds: Embed[];
    components?: ActionRow<any>[];
  }): Promise<unknown>;
}

interface ResponderChannel {
  messages: {
    write(opts: { embeds: Embed[] }): Promise<ResponderMessage>;
  };
}

interface ResponderContext {
  editResponse(opts: { embeds: Embed[] }): Promise<ResponderMessage>;
}

export interface AiRespondOptions {
  channel?: ResponderChannel;
  context?: ResponderContext;
  messages: Message[];
  respond?: (messages: Message[]) => Promise<ChatResult>;
  model?: string;
  thinking?: boolean;
  systemPrompt?: string;
  embedTitle?: string;
  components?: ActionRow<any>;
}

/** Orchestrate AI response: show thinking embed, call model, handle errors. */
export async function aiRespond(
  options: AiRespondOptions,
): Promise<ChatResult> {
  const {
    channel,
    context,
    messages,
    respond,
    model = config.model,
    thinking: thinkOverride,
    systemPrompt,
    embedTitle,
    components,
  } = options;

  const botMsg = context
    ? await context.editResponse({ embeds: [thinkingEmbed()] })
    : await channel!.messages.write({ embeds: [thinkingEmbed()] });

  try {
    const result = respond
      ? await respond(messages)
      : await chat(messages, model, systemPrompt, true, thinkOverride);

    const footer = `⚡ ${result.totalTokens} tokens in ${(result.durationMs / 1000).toFixed(1)}s | ${model}`;

    const embed = responseEmbed(result.content, embedTitle, footer);
    const editOpts: { embeds: Embed[]; components?: ActionRow<any>[] } = {
      embeds: [embed],
    };
    if (components) editOpts.components = [components];
    await botMsg.edit(editOpts).catch(() => console.error("edit failed"));

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await botMsg.edit({ embeds: [errorEmbed(message)] }).catch(() => {});
    throw err;
  }
}
