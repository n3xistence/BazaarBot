import { Client, Message } from "discord.js";

export interface PrefixCommand {
  name: string;
  execute: (client: Client, interaction: Message) => void;
}
