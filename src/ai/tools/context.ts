import type { Client } from "seyfert";

let _client: Client;

export function setClient(client: Client) {
  _client = client;
}

export function getClient(): Client {
  if (!_client) throw new Error("Client not initialized");
  return _client;
}
