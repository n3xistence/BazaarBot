import {
  ActionRowBuilder,
  ButtonInteraction,
  Client,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export const submit_balthazar: any = {
  customId: "submit_balthazar",
  async execute(client: Client, interaction: ButtonInteraction) {
    const cardField = new TextInputBuilder()
      .setCustomId("picked_card")
      .setLabel("Card Code")
      .setStyle(TextInputStyle.Short);

    const actionRowOne = new ActionRowBuilder<TextInputBuilder>().addComponents(cardField);

    const modal = new ModalBuilder()
      .setCustomId("card_50_pick")
      .setTitle("Choose a card whose cooldown to reduce")
      .addComponents(actionRowOne);

    interaction.showModal(modal);
  },
};
