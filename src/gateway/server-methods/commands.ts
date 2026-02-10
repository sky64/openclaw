import type { GatewayRequestHandlers } from "./types.js";
import { listNativeCommandSpecsForConfig } from "../../auto-reply/commands-registry.js";
import { listSkillCommandsForAgents } from "../../auto-reply/skill-commands.js";
import { loadConfig } from "../../config/io.js";

export const commandsHandlers: GatewayRequestHandlers = {
  "commands.list": async ({ respond }) => {
    try {
      const cfg = loadConfig();
      const skillCommands = listSkillCommandsForAgents({ cfg });
      const nativeCommands = listNativeCommandSpecsForConfig(cfg, { skillCommands });
      const commands = [
        ...nativeCommands.map((c) => ({ name: c.name, description: c.description })),
        ...skillCommands.map((c) => ({ name: c.name, description: c.description })),
      ];
      respond(true, { commands });
    } catch (err) {
      respond(true, { commands: [] });
    }
  },
};
