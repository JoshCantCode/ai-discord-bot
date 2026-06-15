import type { Collection } from "chromadb";

/** Base interface for database adapters. */
export interface DbAdapter {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

/** Adapter for collection-based storage (e.g. ChromaDB). */
export interface CollectionStore extends DbAdapter {
  getOrCreateCollection(name: string): Promise<Collection>;
  getCollection(name: string): Promise<Collection | null>;
  deleteCollection(name: string): Promise<void>;
}

export type { Collection };
