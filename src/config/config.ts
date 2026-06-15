import fs from "fs";
import path from "path";

type BotConfig = {
  model: string;
  thinking: boolean;
};

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

const DEFAULTS: BotConfig = {
  model: process.env.MODEL ?? "qwen3.5:4b",
  thinking: true,
};

/** Read config from disk, merging with defaults. */
function loadConfig(): BotConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return { ...DEFAULTS, ...JSON.parse(raw) };
    }
  } catch {
    // use defaults if the file is missing or invalid
  }
  return { ...DEFAULTS };
}

/** Write config to disk. */
function saveConfig(cfg: BotConfig): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export const config: BotConfig = loadConfig();

/** Update a config key and persist to disk. */
export function edit<K extends keyof BotConfig>(
  key: K,
  value: BotConfig[K],
): void {
  config[key] = value;
  saveConfig(config);
}
