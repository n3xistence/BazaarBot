import { Client, Message } from "discord.js";
import { Commands } from "../commands/Commands";

export default (client: Client): void => {
  client.on("messageCreate", async (message: Message) => {
    if (!client.user || !client.application) return;
  });
};
