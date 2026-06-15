import "./impl";
import { toolRegistry } from "./decorator";

export const toolSpecs = Array.from(toolRegistry.values()).map((t) => t.spec);

export async function executeTool(
  name: string,
  args: Record<string, any>,
): Promise<string> {
  const entry = toolRegistry.get(name);
  if (!entry) return `Error: unknown tool "${name}"`;
  return entry.execute(args);
}

export * from "./context";
export * from "./decorator";
