import { Ollama, type Message } from "ollama";
import { Logger } from "seyfert";
import { config } from "src/config/config";

const logger = new Logger({ name: "AI" });

export type { Message };

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST ?? "http://localhost:11434",
});

/** Extract <think>...</think> blocks from model output. */
export function parseThinkBlocks(text: string): {
  thinking: string;
  response: string;
} {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  let thinking = "";
  const matches = [...text.matchAll(thinkRegex)];
  for (const match of matches) {
    thinking += match[1].trim() + "\n";
  }
  let response = text.replace(thinkRegex, "").trim();
  if (!response) {
    response = thinking;
    thinking = "";
  }
  return { thinking: thinking.trim(), response };
}

export interface ChatResult {
  content: string;
  thinking: string;
  totalTokens: number;
  durationMs: number;
}

/** Call Ollama chat, retrying without thinking if model doesn't support it. */
async function chatWithFallback(
  messages: Message[],
  model: string,
): Promise<ChatResult> {
  let think = config.thinking;
  logger.debug("Chat", model, `msgs=${messages.length}`, `think=${think}`);
  const start = performance.now();

  try {
    const response = await ollama.chat({
      model,
      messages,
      stream: false,
      think,
    });
    const durationMs = Math.round(performance.now() - start);
    const totalTokens =
      (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0);
    const raw = response.message?.content ?? "";
    logger.debug("Response", `len=${raw.length}`, raw);
    const { thinking, response: text } = parseThinkBlocks(
      response.message.content ?? "",
    );
    return { content: text, thinking, totalTokens, durationMs };
  } catch (err) {
    if (
      think &&
      err instanceof Error &&
      err.message.toLowerCase().includes("does not support thinking")
    ) {
      think = false;
      logger.debug("Retry without thinking", model);
      const response = await ollama.chat({
        model,
        messages,
        stream: false,
        think,
      });
      const durationMs = Math.round(performance.now() - start);
      const totalTokens =
        (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0);
      const raw = response.message?.content ?? "";
      logger.debug("Fallback response", `len=${raw.length}`, raw);
      const { thinking, response: text } = parseThinkBlocks(
        response.message.content ?? "",
      );
      return { content: text, thinking, totalTokens, durationMs };
    }
    throw err;
  }
}

/** Send conversation to model with a summarization prompt. */
export async function summarize(messages: Message[]): Promise<ChatResult> {
  const prompt =
    "Extract the key factual points from this conversation. Ignore greetings, pleasantries, and observations about the conversation itself. 1-3 sentences max.";

  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const fullMessages: Message[] = [
    { role: "system", content: prompt },
    { role: "user", content: conversationText },
  ];

  return chatWithFallback(fullMessages, config.model);
}

/** Send messages to Ollama with optional system prompt. */
export async function chat(
  messages: Message[],
  model: string,
  systemPrompt?: string,
): Promise<ChatResult> {
  const fullMessages: Message[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  return chatWithFallback(fullMessages, model);
}

/** List all installed Ollama model names. */
export async function listModels(): Promise<string[]> {
  const { models } = await ollama.list();
  return models.map((m) => m.name);
}

export default ollama;
