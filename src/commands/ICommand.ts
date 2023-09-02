import { CommandInteraction, ChatInputApplicationCommandData, Client } from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
  options?: Array<any>;
  execute: (client: Client, interaction: CommandInteraction) => void;
}
