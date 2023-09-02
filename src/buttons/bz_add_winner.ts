import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  ButtonInteraction,
  Client,
} from "discord.js";

export const bz_add_winner: any = {
  customId: "bz_add_winner",
  async execute(client: Client, interaction: ButtonInteraction) {
    if (interaction.message.partial) await interaction.message.fetch();
    if (!interaction.member) return;

    let hasperms = (interaction.member.permissions as any).has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
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
