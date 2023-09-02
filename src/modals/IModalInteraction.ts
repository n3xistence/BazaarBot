import { Client, ModalSubmitInteraction } from "discord.js";

export interface ModalInteraction {
  modalId: string;
  execute: (client: Client, interaction: ModalSubmitInteraction) => void;
}
