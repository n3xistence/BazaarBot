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

export const decrypptask: any = {
  customId: "decrypttask",
  async execute(client: Client, interaction: ButtonInteraction) {
    if (!interaction.member) return;

    const db = Database.init();
    let hasperms = (interaction.member.permissions as any).has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
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

    const task: { [k: string]: any } = db
      .prepare(`SELECT * FROM Bazaar WHERE active='true'`)
      .get() as Bazaar;

    task.emote = task.type === "gems" ? helper.emoteGems : helper.emoteGold;

    let embed = new EmbedBuilder()
      .setTitle(`${helper.emoteBazaar} ${helper.separator} Bazaar Task #${task.id}`)
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
