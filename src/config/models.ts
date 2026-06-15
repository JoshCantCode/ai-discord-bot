export type Capability = "thinking" | "vision" | "code" | "tools";

export interface ModelInfo {
  name: string;
  label: string;
  capabilities: Capability[];
}

const CAP_BADGES: Record<Capability, string> = {
  thinking: "🧠 Reasoning",
  vision: "👁️ Vision",
  code: "💻 Code",
  tools: "🔧 Tools",
};

/** Format capabilities as a display string with badges. */
export function formatCapabilities(caps: Capability[]): string {
  return caps.map((c) => CAP_BADGES[c]).join(" · ") || "💬 Text";
}

/** Format capabilities as short emoji-only badges. */
export function formatCapBadges(caps: Capability[]): string {
  return caps.map((c) => CAP_BADGES[c].split(" ")[0]).join(" ") || "💬";
}

/** Generate a human-readable label from a model name. */
function autoLabel(name: string): string {
  const parts = name.split(":");
  const base = parts[0] ?? name;
  const tag = parts[1] ?? "";

  const pretty = base
    .replace(/[_-]/g, " ")
    .replace(/(\d+\.?\d*)/g, "($1)")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const size = tag.replace(/(\d+[bkmg])/gi, "($1)").toUpperCase();
  return size ? `${pretty} ${size}` : pretty;
}

/** Infer model capabilities from its name using regex patterns. */
function autoCapabilities(name: string): Capability[] {
  const caps: Capability[] = [];
  if (/deepseek-r1/i.test(name)) caps.push("thinking");
  if (/vision|llava|bakllava|minicpm-v/i.test(name)) caps.push("vision");
  if (/starcoder|deepseek-coder|codellama|qwen.*coder/i.test(name))
    caps.push("code");
  if (
    /qwen(?!.*coder)|llama3\.(?!2)|mistral|mixtral|deepseek(?!-r1)/i.test(name)
  )
    caps.push("tools");
  return caps;
}

const OVERRIDES: Record<string, Partial<ModelInfo>> = {
  "qwen3.5:4b": {
    label: "Qwen 3.5 (4B)",
    capabilities: ["tools", "thinking"],
  },
  "qwen3:4b": {
    label: "Qwen 3 (4B)",
    capabilities: ["tools", "thinking", "code"],
  },
};

/** Get model info (label + capabilities) with manual override support. */
export function getModelInfo(name: string): ModelInfo {
  const overrides = OVERRIDES[name];
  return {
    name,
    label: overrides?.label ?? autoLabel(name),
    capabilities: overrides?.capabilities ?? autoCapabilities(name),
  };
}
