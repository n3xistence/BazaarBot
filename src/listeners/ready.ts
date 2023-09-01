import { Client } from "discord.js";
import { Commands } from "../commands/Commands";

const { version, name } = require("../../package.json");

export default (client: Client): void => {
  client.on("ready", async () => {
    if (!client.user || !client.application) return;

    console.log("╞ [/] Started refreshing application commands.");

    await client.application.commands.set(Commands);

    console.log("╞ [/] Successfully reloaded application commands.");

    console.log(`└ [✓] ${name} : v.${version} - Online`);
  });
};
