// src/ai/tools/shell.ts
import { exec } from "child_process";
import { promisify } from "util";
import { Tool } from "../decorator";

const execAsync = promisify(exec);

// ai generated patterns.. if this ever messes up its my fault
// i dont know regex so :p
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i,
  /:\(\)\{/,
  /mkfs/i,
  /dd\s+if=/i,
  />\s*\/dev\/sd/i,
  /shutdown|reboot|poweroff/i,
  /chmod\s+-R\s+777/i,
  /curl.*\|.*sh/i,
  /wget.*\|.*sh/i,
];

export default class ShellCommandTool {
  @Tool({
    name: "run_shell_command",
    description:
      "Run a read-only diagnostic shell command (e.g. checking hardware, processes, disk space). " +
      "Use ONLY for inspecting system state, never for modifying files, installing software, or changing settings.",
    parameters: {
      properties: {
        command: {
          type: "string",
          description: "The shell command to run",
        },
      },
      required: ["command"],
      type: "object",
    },
  })
  static async runCommand(args: Record<string, any>) {
    const cmd = String(args.command ?? "");

    if (DANGEROUS_PATTERNS.some((p) => p.test(cmd))) {
      return "Refused: command matched a blocked pattern.";
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout: 5000,
        maxBuffer: 1024 * 1024, // 1MB
      });
      return (stdout || stderr).trim().slice(0, 4000);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
}
