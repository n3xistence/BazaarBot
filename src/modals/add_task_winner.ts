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

    const currentTask = await db.query(`SELECT * FROM Bazaar WHERE active='true'`);

    if (currentTask.rows.length === 0)
      return interaction.reply({
        content: `There is no active task.`,
        ephemeral: true,
      });

    const currentWinners = JSON.parse(currentTask.rows[0].chosen_winners);
    if (currentTask.rows[0].winners === currentWinners.length)
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

    db.query(`UPDATE Bazaar SET chosen_winners=$1 WHERE id=$2`, [
      JSON.stringify(newWinners),
      currentTask.rows[0].id,
    ]);

    let denom =
      newWinners.length === 1
        ? "st"
        : newWinners.length === 2
        ? "nd"
        : newWinners.length === 3
        ? "rd"
        : "th";

    const msg = await interaction.channel.messages
      .fetch(currentTask.rows[0].messageid)
      .catch(console.log);
    if (!msg)
      return interaction.reply({
        content: `Error fetching Task Embed`,
        ephemeral: true,
      });

    let newTaskEmbed = new EmbedBuilder()
      .setTitle(`${helper.emoteBazaar} ${helper.separator} Bazaar Task #${currentTask.rows[0].id}`)
      .setColor("DarkPurple")
      .setDescription(
        `Winners: ${newWinners.length}/${currentTask.rows[0].winners}\n${newWinners
          .map((e, index) => `${index}. <@${e.id}>`)
          .join("\n")}\n\nStarted: <t:${parseInt(currentTask.rows[0].timestamp)}:R>\nRewards: ${
          currentTask.rows[0].amount
        } ${currentTask.rows[0].type}\n\n> ${currentTask.rows[0].description}\n\n${
          currentTask.rows[0].notes
        }`
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
