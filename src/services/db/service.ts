import type { DbAdapter } from "src/services/db/types";

export class DatabaseService {
  private adapters = new Map<string, DbAdapter>();

  /** Register a database adapter. */
  register<T extends DbAdapter>(adapter: T): T {
    this.adapters.set(adapter.name, adapter);
    return adapter;
  }

  /** Retrieve a registered adapter by name. */
  get<T extends DbAdapter>(name: string): T {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Database adapter "${name}" is not registered`);
    }
    return adapter as T;
  }

  /** Check if an adapter is registered. */
  has(name: string): boolean {
    return this.adapters.has(name);
  }

  /** Connect all registered adapters. */
  async connectAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.connect();
    }
  }

  /** Disconnect all registered adapters. */
  async disconnectAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.disconnect();
    }
  }
}
