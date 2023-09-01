import {
  CommandInteraction,
  ChatInputApplicationCommandData,
  Client,
  SlashCommandBuilder,
} from "discord.js";
import { CommandOptions } from "../types";

export interface Command extends ChatInputApplicationCommandData {
  execute: (client: Client, interaction: CommandInteraction) => void;
}
