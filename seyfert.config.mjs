import { config } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types";

export default config.bot({
  token: process.env.BOT_TOKEN ?? "",
  locations: {
    base: "src",
    commands: "commands",
    events: "events",
    components: "components",
  },
  intents: Object.keys(GatewayIntentBits).filter((k) => isNaN(Number(k))),
  port: 4444,
});
