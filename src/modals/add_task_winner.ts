import { Client, EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import { Bazaar } from "../types/DBTypes";
import { ModalInteraction } from "./IModalInteraction";

export const add_task_winner: ModalInteraction = {
  modalId: "add_task_winner",
  async execute(client: Client, interaction: ModalSubmitInteraction) {
    if (!interaction.channel) return;

    const userID = interaction.fields.getTextInputValue("task_winner_id");
    if (!/\d+/.test(userID))
      return interaction.reply({
        content: `User ID must be of type number. Got "${userID}" of type \`string\``,
        ephemeral: true,
      });

    const db = Database.init();
    let user = await client.users.fetch(userID);
    if (!user)
      return interaction.reply({
        content: `Could not fetch user by ID \`${userID}\``,
        ephemeral: true,
      });

    const currentTask: Bazaar = db
      .prepare(`SELECT * FROM Bazaar WHERE active='true'`)
      .get() as Bazaar;

    if (!currentTask)
      return interaction.reply({
        content: `There is no active task.`,
        ephemeral: true,
      });

    const currentWinners = JSON.parse(currentTask.chosen_winners);
    if (currentTask.winners === currentWinners.length)
      return interaction.reply({
        content: `You cannot provide more winners than the task allows.`,
        ephemeral: true,
      });
    if (currentWinners.find((e: any) => e.id === user.id))
      return interaction.reply({
        content: `<@${user.id}> is already added as a winner.`,
        ephemeral: true,
      });

    const newWinners =
      currentWinners.length > 0
        ? [
            ...currentWinners,
            {
              id: user.id,
            },
          ]
        : [{ id: user.id }];

    db.prepare(`UPDATE Bazaar SET chosen_winners=? WHERE id=?`).run(
      JSON.stringify(newWinners),
      currentTask.id
    );

    let denom =
      newWinners.length === 1
        ? "st"
        : newWinners.length === 2
        ? "nd"
        : newWinners.length === 3
        ? "rd"
        : "th";

    const msg = await interaction.channel.messages.fetch(currentTask.messageID).catch(console.log);
    if (!msg)
      return interaction.reply({
        content: `Error fetching Task Embed`,
        ephemeral: true,
      });

    let newTaskEmbed = new EmbedBuilder()
      .setTitle(`${helper.emoteBazaar} ${helper.separator} Bazaar Task #${currentTask.id}`)
      .setColor("DarkPurple")
      .setDescription(
        `Winners: ${newWinners.length}/${currentTask.winners}\n${newWinners
          .map((e, index) => `${index}. <@${e.id}>`)
          .join("\n")}\n\nStarted: <t:${parseInt(currentTask.timestamp)}:R>\nRewards: ${
          currentTask.amount
        } ${currentTask.type}\n\n> ${currentTask.description}\n\n${currentTask.notes}`
      );
    msg.edit({ embeds: [newTaskEmbed] });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `${helper.emoteApprove} ${helper.separator} Successfully added ${user.username} as the ${newWinners.length}${denom} winner.`
          ),
      ],
    });
  },
};
