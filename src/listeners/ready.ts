const { version } = require("../../package.json");
import { Commands } from "../commands/Commands";
import { wrapInColor } from "../ext/Helper";
import { Client, Routes } from "discord.js";
import { REST } from "@discordjs/rest";
import Logger from "../ext/Logger";

import * as dotenv from "dotenv";
dotenv.config();

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN as string);

export default (client: Client): void => {
  client.on("ready", async () => {
    if (!client.user || !client.application) return;

    if (process.env.MODE === "DEVELOPMENT")
      Logger.log("warn", "Client starting in Development Mode.");
    else Logger.log("info", "Client is initiating...");

    try {
      console.log(`╞ ${wrapInColor("blue", "[/]")} Started reloading Application Commands.`);

      await client.application.commands.set(Commands);

      console.log(`╞ ${wrapInColor("blue", "[/]")} Successfully set Application Commands.`);

      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID as string), {
        body: Commands,
      });

      console.log(`╞ ${wrapInColor("blue", "[/]")} Successfully reloaded Application Commands.`);

      console.log(`└ ${wrapInColor("green", "[✓]")} ${client.user.tag} : v.${version} - Online\n`);
    } catch (e) {
      Logger.log("error", "Error Loading Application Commands");
      console.log(e);
    }
  });
};
