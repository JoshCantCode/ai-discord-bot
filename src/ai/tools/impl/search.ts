import { search, fetch as webFetch } from "../../ollama";
import { Tool } from "../decorator";

export class SearchTools {
  @Tool({
    name: "web_search",
    description:
      "Search the web for current information using a text query. Returns relevant results with snippets and links.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to look up on the web",
        },
      },
      required: ["query"],
    },
  })
  static async webSearch(args: { query: string }) {
    try {
      const result = await search(args.query);
      return JSON.stringify(result);
    } catch (err) {
      return `Error searching the web: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  @Tool({
    name: "web_fetch",
    description:
      "Fetch and read the full content of a web page at the given URL. Use this to get detailed information from a specific page.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the web page to fetch",
        },
      },
      required: ["url"],
    },
  })
  static async webFetch(args: { url: string }) {
    try {
      return await webFetch(args.url);
    } catch (err) {
      return `Error fetching URL: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
}
