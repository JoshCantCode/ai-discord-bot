export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, JSONSchema>;
      required?: string[];
    };
  };
}

type JSONSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object"
  | "null";

export interface JSONSchema {
  type: JSONSchemaType;
  description?: string;
  enum?: (string | number)[];
  items?: JSONSchema;
  properties?: Record<string, JSONSchema>;
  required?: string[];
}

export interface ToolContext {
  [key: string]: any;
}

export interface ToolDef {
  spec: Tool;
  execute: (args: Record<string, any>, ctx: ToolContext) => Promise<string>;
}
