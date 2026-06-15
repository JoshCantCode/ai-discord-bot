import type { Collection } from "chromadb";
import type { Message } from "src/ai/ollama";

/** Extract Message array from a ChromaDB collection's documents and metadata. */
export async function getMessages(coll: Collection): Promise<Message[]> {
  const { documents, metadatas } = await coll.get();
  const messages: Message[] = [];
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const meta = metadatas[i];
    if (doc && meta?.role) {
      messages.push({ role: meta.role as "user" | "assistant", content: doc });
    }
  }
  return messages;
}
