import { JSONSchema, Tool } from "./types";

export const toolRegistry: Map<string, { spec: Tool; execute: Function }> =
  new Map();

interface ToolMeta {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, JSONSchema>;
    required?: string[];
  };
}

export function Tool(meta: ToolMeta) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const spec: Tool = {
      type: "function",
      function: {
        name: meta.name,
        description: meta.description,
        parameters: meta.parameters,
      },
    };

    toolRegistry.set(meta.name, {
      spec,
      execute: descriptor.value,
    });

    return descriptor;
  };
}
