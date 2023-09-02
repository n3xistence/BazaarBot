import { ButtonInteraction, Client, InteractionButtonComponentData } from "discord.js";

export interface ButtonCommand extends InteractionButtonComponentData {
  customId: string;
  execute: (client: Client, interaction: ButtonInteraction) => void;
}
