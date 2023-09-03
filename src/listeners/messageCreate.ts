import { Client, Message } from "discord.js";
import { PrefixCommands } from "../prefixCommands/PrefixCommands";
import { PrefixCommand } from "../prefixCommands/IPrefixCommand";
const { prefix } = require("../../package.json");
import * as helper from "../ext/Helper";
import Logger from "../ext/Logger";

export default (client: Client): void => {
  client.on("messageCreate", async (message: Message): Promise<any> => {
    if (!client.user || !client.application) return;
    const args: Array<string> = message.content.split(" ");
    if (!args[0].startsWith(prefix)) return;
    const commandName: string = args[0].replace(prefix, "").toLowerCase();

    const command: PrefixCommand | undefined = PrefixCommands.find((e) => e.name === commandName);
    if (!command) return message.react(helper.emoteDeny);

    Logger.log("info", `${prefix}${command.name} - ${message.author.username}`);

    command.execute(client, message);
  });
};
