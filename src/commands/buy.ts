import { Client, CommandInteraction } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import { Command } from "./ICommand";
import Item from "../Classes/Item";
import Pack from "../Classes/Pack";
import Inventory from "../Classes/Inventory";

const { EmbedBuilder } = require("discord.js");
const fs = require("fs");

export const buy: Command = {
  name: "buy",
  description: "Buy an item",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The Code of the card",
      required: true,
    },
    {
      name: "amount",
      type: CommandOptions.NUMBER,
      description: "The amount to purchase (defaults to 1)",
      required: false,
    },
    {
      name: "currency",
      type: CommandOptions.STRING,
      description: "The currency to pay with (defaults to gems)",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const db = Database.init();
    let itemCode = interaction.options.getString("code");
    let amount = interaction.options.getNumber("amount");
    let currency = interaction.options.getString("currency");
    if (!currency || currency.length === 0) currency = "gems";
    else currency = currency.toLowerCase();

    if (!amount) amount = 1;
    if (amount < 0)
      return interaction.reply({
        content: `You cannot buy a negative amount of items.`,
        ephemeral: true,
      });

    let shopItems: Array<{ pid: string; gems: number; scrap: number }> =
      await helper.fetchShopItems();

    let item: any = shopItems.find((e: any) => e.pid === itemCode);
    if (!item)
      return interaction.reply({
        content: `There is no item with the ID \`${itemCode}\` in the shop.`,
        ephemeral: true,
      });

    if (!Object.keys(item).includes(currency))
      return interaction.reply({
        content: `You cannot buy an item with the ID \`${itemCode}\` with ${currency}.`,
        ephemeral: true,
      });

    let balance: any = await db.query(`SELECT ${currency} FROM currency WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (balance.rows.length === 0)
      return interaction.reply({
        content: `You have no points.`,
        ephemeral: true,
      });

    balance = balance.rows[0][currency];
    if (item[currency] * amount > balance)
      return interaction.reply({
        content: `You can not afford this item. (${balance}/${
          item[currency] * amount
        } ${currency})`,
        ephemeral: true,
      });

    let newBalance = balance - item[currency] * amount;
    db.query(`UPDATE currency SET ${currency}=$1 WHERE id=$2`, [newBalance, interaction.user.id]);

    const droppool = await helper.fetchDroppool();
    let cardPack = droppool.find((e: Pack) => e.code === item.pid);
    if (!cardPack)
      return interaction.reply({
        content: `No Pack with the id ${item.code}`,
        ephemeral: true,
      });

    cardPack.amount = amount;

    const inv = await helper.fetchInventory(interaction.user.id);
    inv.addPack(cardPack);
    inv.setUserId(interaction.user.id);
    helper.updateInventoryRef(inv);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Item${amount > 1 ? "s" : ""} Purchased`)
          .setColor("Green")
          .setDescription(
            `${interaction.user} has successfully bought ${amount}x "${item.pid}" ${
              item.cardType ? "Card" : "Card Pack"
            }.`
          ),
      ],
    });
  },
};
