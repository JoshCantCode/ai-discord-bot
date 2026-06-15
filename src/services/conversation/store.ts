import fs from "fs/promises";
import path from "path";
import type { CollectionStore } from "src/services/db/types";
import type { Message } from "src/ai/ollama";

export interface ThreadConfig {
  model?: string;
  thinking?: boolean;
}

const THREAD_CONFIG_PATH = path.join(process.cwd(), "data", "thread-configs.json");

async function loadThreadConfigs(): Promise<Record<string, ThreadConfig>> {
  try {
    const data = await fs.readFile(THREAD_CONFIG_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveThreadConfigs(
  configs: Record<string, ThreadConfig>,
): Promise<void> {
  await fs.mkdir(path.dirname(THREAD_CONFIG_PATH), { recursive: true });
  await fs.writeFile(THREAD_CONFIG_PATH, JSON.stringify(configs, null, 2));
}

let idCounter = 0;

/** Generate a unique ID from timestamp + counter. */
function nextId(): string {
  return `${Date.now()}-${++idCounter}`;
}

/** Return the ChromaDB collection name for a thread. */
function collectionName(threadId: string): string {
  return `conv-${threadId}`;
}

export class ConversationStore {
  private store: CollectionStore | null = null;

  /** Initialize with a CollectionStore adapter. */
  init(store: CollectionStore): void {
    this.store = store;
  }

  /** Return the initialized store or throw. */
  private getStore(): CollectionStore {
    if (!this.store) {
      throw new Error(
        "ConversationStore not initialized — call conversation.init(store) at startup",
      );
    }
    return this.store;
  }

  /** Add a message to a thread's conversation. */
  async add(
    threadId: string,
    role: string,
    content: string,
    msgId?: string,
  ): Promise<void> {
    const coll = await this.getStore().getOrCreateCollection(
      collectionName(threadId),
    );
    const meta: Record<string, string> = { role };
    if (msgId) meta.msgId = msgId;
    await coll.add({
      ids: [nextId()],
      documents: [content],
      metadatas: [meta],
    });
  }

  /** Retrieve messages, optionally truncating to maxCount. */
  async get(threadId: string, maxCount?: number): Promise<Message[]> {
    const coll = await this.getStore().getOrCreateCollection(
      collectionName(threadId),
    );
    const { documents, metadatas } = await coll.get();
    const messages: Message[] = [];
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const meta = metadatas[i];
      if (doc && meta?.role) {
        messages.push({
          role: meta.role as "user" | "assistant",
          content: doc,
        });
      }
    }
    if (maxCount && messages.length > maxCount) {
      messages.splice(0, messages.length - maxCount);
    }
    return messages;
  }

  /** Delete an assistant message and its preceding user message. */
  async deleteMessagePair(
    threadId: string,
    assistantContent: string,
  ): Promise<{ userMsgId?: string }> {
    const coll = await this.getStore().getCollection(collectionName(threadId));
    if (!coll) return {};
    const { ids, documents, metadatas } = await coll.get();
    for (let i = 0; i < documents.length; i++) {
      if (
        documents[i] === assistantContent &&
        metadatas[i]?.role === "assistant"
      ) {
        const result: { userMsgId?: string } = {};
        await coll.delete({ ids: [ids[i]] });
        if (i > 0 && metadatas[i - 1]?.role === "user") {
          result.userMsgId = metadatas[i - 1]?.msgId as string | undefined;
          await coll.delete({ ids: [ids[i - 1]] });
        }
        return result;
      }
    }
    return {};
  }

  /** Ensure a collection exists for the thread. */
  async ensure(threadId: string): Promise<void> {
    await this.getStore().getOrCreateCollection(collectionName(threadId));
  }

  /** Delete the thread's entire collection. */
  async delete(threadId: string): Promise<void> {
    await this.getStore().deleteCollection(collectionName(threadId));
  }

  /** Check if a thread's collection exists. */
  async exists(threadId: string): Promise<boolean> {
    const coll = await this.getStore().getCollection(collectionName(threadId));
    return coll !== null;
  }

  /** Get per-thread config overrides (model, thinking). */
  async getConfig(threadId: string): Promise<ThreadConfig> {
    const configs = await loadThreadConfigs();
    return configs[threadId] ?? {};
  }

  /** Set per-thread config overrides. Merges with existing values. */
  async setConfig(threadId: string, cfg: ThreadConfig): Promise<void> {
    const configs = await loadThreadConfigs();
    configs[threadId] = { ...configs[threadId], ...cfg };
    await saveThreadConfigs(configs);
  }

  /** Remove all per-thread config overrides for a thread. */
  async deleteConfig(threadId: string): Promise<void> {
    const configs = await loadThreadConfigs();
    delete configs[threadId];
    await saveThreadConfigs(configs);
  }
}

export const conversation = new ConversationStore();
