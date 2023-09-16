import { Client, CommandInteraction } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import { Command } from "./ICommand";
import Item from "../Classes/Item";

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

    let shopItems = JSON.parse(fs.readFileSync("./data/shop.json"));

    let item = shopItems.find((e: Item) => e.code === itemCode);
    if (!item)
      return interaction.reply({
        content: `There is no item with the ID \`${itemCode}\` in the shop.`,
        ephemeral: true,
      });

    if (!Object.keys(item.cost).includes(currency))
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
    if (item.cost[currency] * amount > balance)
      return interaction.reply({
        content: `You can not afford this item. (${balance}/${
          item.cost[currency] * amount
        } ${currency})`,
        ephemeral: true,
      });

    let newBalance = balance - item.cost[currency] * amount;
    db.query(`UPDATE currency SET ${currency}=$1 WHERE id=$2`, [newBalance, interaction.user.id]);

    const inventories = JSON.parse(fs.readFileSync("./data/inventories.json"));

    const dropPool = JSON.parse(fs.readFileSync("./data/droppool.json"));
    let cardPack = dropPool.find((e: Item) => e.code === item.code);
    cardPack.amount = amount;

    const inv = helper.getInventoryAsObject(interaction.user.id);
    inv.addPack(cardPack);

    helper.updateInventoryRef(inv, interaction.user);

    const inventoryIndex = inventories.findIndex((e: any) => e.userId === interaction.user.id);

    if (inventoryIndex < 0)
      inventories.push({
        userId: interaction.user.id,
        userName: interaction.user.username,
        inventory: inv,
      });
    else inventories[inventoryIndex].inventory = inv;

    fs.writeFileSync("./data/inventories.json", JSON.stringify(inventories, null, "\t"));

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Item${amount > 1 ? "s" : ""} Purchased`)
          .setColor("Green")
          .setDescription(
            `${interaction.user} has successfully bought ${amount}x "${item.name}" ${
              item.cardType ? "Card" : "Card Pack"
            }.`
          ),
      ],
    });
  },
};
