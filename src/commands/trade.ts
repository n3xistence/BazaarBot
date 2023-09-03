import { Command } from "./ICommand";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import * as helper from "../ext/Helper";
import CommandOptions from "../enums/CommandOptions";
import fs from "node:fs";

const getConfirmationButtons = () => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("accept_trade")
      .setStyle(ButtonStyle.Success)
      .setLabel("Accept"),
    new ButtonBuilder().setCustomId("deny_trade").setStyle(ButtonStyle.Danger).setLabel("Deny"),
    new ButtonBuilder()
      .setCustomId("open_trade_modal")
      .setStyle(ButtonStyle.Primary)
      .setLabel("Change Items")
  );
};

export const trade: Command = {
  name: "trade",
  description: "Open a new trade with another player",
  options: [
    {
      name: "user",
      type: CommandOptions.USER,
      description: "The user to trade with",
      required: true,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild || !interaction.channel) return;

    let inv = helper.getInventoryAsObject(interaction.user.id);
    let hasPermission = [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.id === 27);
    if (!hasPermission)
      return interaction.reply({
        content: "You can only start trades when you own the card `Trade Pass`.",
        ephemeral: true,
      });

    const targetUser = interaction.options.getUser("user");
    if (!targetUser)
      return interaction.reply({
        content: `Please mention a valid user`,
        ephemeral: true,
      });

    const row: any = getConfirmationButtons();
    let embed = new EmbedBuilder()
      .setTitle("Trade Offer")
      .setColor("Blue")
      .addFields(
        {
          name: `${interaction.user.username}:`,
          value: `No Items Added`,
          inline: true,
        },
        {
          name: `${targetUser.username}:`,
          value: `No Items Added`,
          inline: true,
        }
      );

    let allTrades = JSON.parse(fs.readFileSync("./data/trades.json", "utf-8"));
    let tradeActive = allTrades.find(
      (e: any) =>
        (e.owner.id === interaction.user.id && e.target.id === targetUser.id) ||
        (e.owner.id === targetUser.id && e.target.id === interaction.user.id)
    );
    if (tradeActive)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Trade Error")
            .setColor("Red")
            .setDescription(
              `You already have a pending trade with ${targetUser} [here](${tradeActive.msg.link}).`
            ),
        ],
        ephemeral: true,
      });

    let msg = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    let tradeData = {
      owner: {
        id: interaction.user.id,
        name: interaction.user.username,
        accepted: false,
        items: [],
      },
      target: {
        id: targetUser.id,
        name: targetUser.username,
        accepted: false,
        items: [],
      },
      timestamp: helper.getUNIXStamp(),
      msg: {
        id: msg.id,
        link: `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${msg.id}`,
      },
    };

    allTrades.push(tradeData);
    return fs.writeFileSync("./data/trades.json", JSON.stringify(allTrades, null, "\t"));
  },
};
