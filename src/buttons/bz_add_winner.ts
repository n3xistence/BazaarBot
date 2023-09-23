import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  ButtonInteraction,
  Client,
} from "discord.js";
import * as Database from "../Database";
import AccessValidator from "../Classes/AccessValidator";

export const bz_add_winner: any = {
  customId: "bz_add_winner",
  async execute(client: Client, interaction: ButtonInteraction) {
    if (interaction.message.partial) await interaction.message.fetch();

    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return interaction.reply({
        content: "Invalid Authorisation.",
        ephemeral: true,
      });

    const userNameField = new TextInputBuilder()
      .setCustomId("task_winner_id")
      .setLabel("User ID")
      .setStyle(TextInputStyle.Short);

    const actionRowOne: any = new ActionRowBuilder().addComponents(userNameField);

    const modal = new ModalBuilder()
      .setCustomId("add_task_winner")
      .setTitle("Add A Winner to this Task")
      .addComponents(actionRowOne);

    return interaction.showModal(modal);
  },
};
