import { Tool } from "../decorator";
import os from "os";

export class SystemInfo {
  @Tool({
    name: "get_sys_info",
    description: "Get information about the host device",
    parameters: { type: "object", properties: {}, required: [] },
  })
  static async getSystemInfo() {
    return JSON.stringify({
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      freeMemMB: Math.round(os.freemem() / 1024 / 1024),
      totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
      uptimeSec: Math.round(os.uptime()),
    });
  }
}
