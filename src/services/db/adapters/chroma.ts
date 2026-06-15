import { ChromaClient } from "chromadb";
import type { Collection, CollectionStore } from "src/services/db/types";

export class ChromaStore implements CollectionStore {
  readonly name = "chroma";
  private client: ChromaClient;
  private connected = false;

  /** Create ChromaClient with the given URL or env default. */
  constructor(url?: string) {
    this.client = new ChromaClient({
      path: url ?? process.env.CHROMA_URL ?? "http://localhost:8000",
    });
  }

  /** Verify connection via heartbeat. */
  async connect(): Promise<void> {
    await this.client.heartbeat();
    this.connected = true;
  }

  /** Mark the store as disconnected. */
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /** Return whether the store is connected. */
  isConnected(): boolean {
    return this.connected;
  }

  /** Return the raw ChromaClient instance. */
  getClient(): ChromaClient {
    return this.client;
  }

  /** Get or create a ChromaDB collection by name. */
  async getOrCreateCollection(name: string): Promise<Collection> {
    return this.client.getOrCreateCollection({ name });
  }

  /** Get a collection by name, returning null on error. */
  async getCollection(name: string): Promise<Collection | null> {
    try {
      return await this.client.getCollection({ name });
    } catch {
      return null;
    }
  }

  /** Delete a ChromaDB collection by name. */
  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection({ name });
  }
}
