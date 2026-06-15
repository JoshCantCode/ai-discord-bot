import type { CollectionStore } from "src/services/db/types";
import type { Message } from "src/ai/ollama";

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
}

export const conversation = new ConversationStore();
