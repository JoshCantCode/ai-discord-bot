import "dotenv/config";
import { Client } from "seyfert";
import type { ParseClient } from "seyfert";
import { DatabaseService, ChromaStore, conversation } from "src/services";
import type { CollectionStore } from "src/services/db/types";

const client = new Client() as Client<true> & {
  db: CollectionStore;
  services: {
    db: DatabaseService;
  };
};

const dbService = new DatabaseService();
const chroma = dbService.register(new ChromaStore());

conversation.init(chroma);

client.services = { db: dbService };
client.db = chroma;

client
  .start({
    token: process.env.DISCORD_TOKEN ?? "",
  })
  .then(() => client.uploadCommands({ cachePath: "./commands.json" }));

declare module "seyfert" {
  interface UsingClient extends ParseClient<Client<true>> {}

  interface Client {
    db: CollectionStore;
    services: {
      db: DatabaseService;
    };
  }
}

export default client;
