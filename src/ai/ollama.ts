import { Ollama, type Message, type Tool as OllamaTool } from "ollama";
import { Logger } from "seyfert";
import { config } from "src/config/config";
import { executeTool, toolSpecs } from "./tools";
import { Tool } from "./tools/types";

const logger = new Logger({ name: "AI" });

export type { Message };

const hostEnv = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const url = new URL(hostEnv);
const ollama = new Ollama({
  host: url.hostname,
  port: Number(url.port) || 11434,
  ssl: url.protocol === "https:",
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

const MAX_TOOL_ATTEMPTS = 5;

/** Call Ollama chat, retrying without thinking if model doesn't support it. */
async function chatWithFallback(
  messages: Message[],
  model: string,
  tools?: Tool[],
): Promise<ChatResult> {
  let think = config.thinking;
  const start = performance.now();

  const callOnce = async (msgs: Message[], thinkFlag: boolean) => {
    return ollama.chat({
      model,
      messages: msgs,
      stream: false,
      think: thinkFlag,
      ...(tools?.length ? { tools: tools as OllamaTool[] } : {}),
    });
  };

  let response;
  try {
    response = await callOnce(messages, think);
  } catch (err) {
    if (
      think &&
      err instanceof Error &&
      err.message.toLowerCase().includes("does not support thinking")
    ) {
      think = false;
      logger.debug("Retry without thinking", model);
      response = await callOnce(messages, think);
    } else {
      throw err;
    }
  }

  let totalTokens =
    (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0);

  let iterations = 0;
  const workingMessages = [...messages];

  while (
    response.message.tool_calls?.length &&
    iterations < MAX_TOOL_ATTEMPTS
  ) {
    iterations++;
    workingMessages.push(response.message);

    for (const call of response.message.tool_calls) {
      let result: string;
      try {
        logger.debug(
          "Executing tool",
          call.function.name,
          JSON.stringify(call.function.arguments),
        );
        result = await executeTool(call.function.name, call.function.arguments);
      } catch (err) {
        result = `Error executing tool: ${err instanceof Error ? err.message : String(err)}`;
      }
      workingMessages.push({ role: "tool", content: result } as Message);
    }

    response = await callOnce(workingMessages, think);
    totalTokens +=
      (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0);
  }

  const durationMs = Math.round(performance.now() - start);
  const raw = response.message?.content ?? "";
  logger.debug("Response", `len=${raw.length}`, raw);

  const { thinking, response: text } = parseThinkBlocks(raw);
  return { content: text, thinking, totalTokens, durationMs };
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
  useTools = false,
): Promise<ChatResult> {
  const fullMessages: Message[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;
  return chatWithFallback(
    fullMessages,
    model,
    useTools ? toolSpecs : undefined,
  );
}

/** List all installed Ollama model names. */
export async function listModels(): Promise<string[]> {
  const { models } = await ollama.list();
  return models.map((m) => m.name);
}

export default ollama;
