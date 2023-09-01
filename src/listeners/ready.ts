const { version, name } = require("../../package.json");
import { Commands } from "../commands/Commands";
import { wrapInColor } from "../ext/Helper";
import { Client } from "discord.js";

import Logger from "../ext/Logger";

export default (client: Client): void => {
  client.on("ready", async () => {
    if (!client.user || !client.application) return;

    Logger.log("info", "Client is ready.");
    try {
      console.log(`╞ ${wrapInColor("blue", "[/]")} Started reloading Application Commands.`);

      await client.application.commands.set(Commands);

      console.log(`╞ ${wrapInColor("blue", "[/]")} Successfully reloaded Application Commands.`);

      console.log(`└ ${wrapInColor("green", "[✓]")} ${name} : v.${version} - Online`);
    } catch {
      Logger.log("error", "Error Loading Application Commands");
    }
  });
};
