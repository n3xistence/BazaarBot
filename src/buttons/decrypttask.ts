import {
  ButtonInteraction,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import { Bazaar } from "../types/DBTypes";
import AccessValidator from "../Classes/AccessValidator";

export const decrypptask: any = {
  customId: "decrypttask",
  async execute(client: Client, interaction: ButtonInteraction) {
    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return interaction.reply({
        content: "Invalid Authorisation.",
        ephemeral: true,
      });

    let verify_embed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`Are you sure you would like to reveal this task?`);

    const res = await helper.confirm(interaction, client, {
      embeds: [verify_embed],
      ephemeral: true,
    });
    interaction.deleteReply();
    if (!res) return;

    const task: { [k: string]: any } = (await db.query(`SELECT * FROM Bazaar WHERE active='true'`))
      .rows[0];

    task.emote = task.type === "gems" ? helper.emoteGems : helper.emoteGold;

    let embed = new EmbedBuilder()
      .setTitle(`${helper.emoteBazaar} ${helper.separator} Bazaar Task`)
      .setColor("DarkPurple")
      .setDescription(
        `Winners: ${task.winners}\nStarted: <t:${parseInt(task.timestamp)}:R>\nRewards: ${
          task.amount
        } ${task.type} ${task.emote}\n\n> ${task.description}\n\n${task.notes}`
      );

    let row: any = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bz_add_winner")
        .setStyle(ButtonStyle.Primary)
        .setLabel("Add Winner"),
      new ButtonBuilder().setCustomId("bz_end_task").setStyle(ButtonStyle.Danger).setLabel("End")
    );

    interaction.message.edit({ embeds: [embed], components: [row] });
  },
};
