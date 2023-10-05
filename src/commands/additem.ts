import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as Database from "../Database";
import * as helper from "../ext/Helper";
import AccessValidator from "../Classes/AccessValidator";
import Pack from "../Classes/Pack";

export const additem: Command = {
  name: "additem",
  ephemeral: true,
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
      return interaction.editReply({
        content: "Invalid Authorisation.",
      });

    let itemCode = interaction.options.getString("code");
    if (!itemCode)
      return interaction.editReply({
        content: "You need to provide an item code.",
      });

    let shopItems: Array<{ pid: string; gems: number; scrap: number }> =
      await helper.fetchShopItems();

    const droppool = await helper.fetchDroppool();

    let itemInShop = shopItems.find((e: any) => e.pid === itemCode) !== undefined;
    if (itemInShop)
      return interaction.editReply({
        content: `The item with the ID \`${itemCode}\` is already in the shop.`,
      });

    let item = droppool.find((e: Pack) => e.code === itemCode);
    if (!item)
      return interaction.editReply({
        content: `There is no item with the ID \`${itemCode}\` in the droppool.`,
      });

    helper.addPackToShop(itemCode);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Updated Shop")
          .setColor("Green")
          .setDescription(`Successfully added \`${itemCode}\` to the shop.`),
      ],
    });
  },
};
