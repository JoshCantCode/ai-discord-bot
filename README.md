# AI Discord Bot

Discord bot that chats with locally AI models via Ollama

The idea behind this is that it stops users from using commerical chat bots (ChatGPT, Claude) and switch to smaller models who excel at a certain thing.

This bot supports real-time switching, so one message in a conversation can use 1 model, and you can use another in the very next. Swap using /model

This bot uses Seyfert as a wrapper around the discord API, Ollama as a wrapper around the local ai models.

If you wish to use this in production... good luck. I've only experimented with locally installed models and currently there is no system written for this to work on a remote server.


## Use (locally)

```bash
pnpm install

pnpm exec chroma run --path <your-path>

pnpm dev
``` 

## Helpful documentation
[seyfert](https://www.seyfert.dev/guide)
[chromadb](https://docs.trychroma.com/docs/overview/getting-started#typescript)
[ollama](https://github.com/ollama/ollama-js)


## Ideas (AI generated ones)

### Better conversation management
- **Summarize on archive** — auto-summarize and close conversations when threads are archived
- **Edit / delete history** — commands to edit or remove specific messages from context
- **Conversation branching** — fork a conversation into a new thread from any point
- **Token budgeting** — dynamically trim context based on model's context window instead of a raw message count

### Expanded AI capabilities
- **Vision support** — handle image attachments for models that support vision (llava, minicpm-v, etc.) (note: debatable as I dislike generative AI and think its the worst thing ever created)
- **Tool / function calling** — let the bot run commands, search the web, look up docs, etc. via model tool calling

### Per-thread configuration
- **Per-channel / per-user model overrides** — let users pick a model for their thread without changing the global default
- **Custom system prompts per channel** — set a channel topic as the system prompt
- **Slash command to toggle thinking** — per-thread control for models that support it

### Reliability & DX
- **Retry with backoff** — handle transient Ollama failures gracefully
- **Health check command** — show model status, latency, memory usage
- **Logging improvements** — structured logging with levels, persist chat logs for debugging
- **Graceful model switching on failure** — if the current model errors, fall back to another installed model
