import CommandOptions from "../enums/CommandOptions";
import Item from "../Classes/Item";
import { Command } from "./ICommand";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import fs from "node:fs";
import * as Database from "../Database";
import AccessValidator from "../Classes/AccessValidator";

export const additem: Command = {
  name: "additem",
  description: "Adds an item to the shop",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The Code of the pack",
      required: true,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return interaction.reply({
        content: "Invalid Authorisation.",
        ephemeral: true,
      });

    let itemCode = interaction.options.getString("code");
    let shopItems = JSON.parse(fs.readFileSync("./data/shop.json", "utf-8"));
    const droppool = JSON.parse(fs.readFileSync("./data/droppool.json", "utf-8"));

    let itemInShop = shopItems.find((e: Item) => e.code === itemCode) !== undefined;
    if (itemInShop)
      return interaction.reply({
        content: `The item with the ID \`${itemCode}\` is already in the shop.`,
        ephemeral: true,
      });

    let item = droppool.find((e: Item) => e.code === itemCode);
    if (!item)
      return interaction.reply({
        content: `There is no item with the ID \`${itemCode}\` in the droppool.`,
        ephemeral: true,
      });

    shopItems.push(item);
    fs.writeFileSync("./data/shop.json", JSON.stringify(shopItems, null, "\t"));

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Updated Shop")
          .setColor("Green")
          .setDescription(`Successfully added \`${itemCode}\` to the shop.`),
      ],
    });
  },
};
