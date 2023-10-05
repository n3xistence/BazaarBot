import { Client, CommandInteraction } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import { EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import AccessValidator from "../Classes/AccessValidator";
import Pack from "../Classes/Pack";

export const removeitem: Command = {
  name: "removeitem",
  ephemeral: true,
  description: "Removes an item from the shop",
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
    if (!itemInShop)
      return interaction.editReply({
        content: `The item with the ID \`${itemCode}\` is not in the shop.`,
      });

    let itemIndex = droppool.findIndex((e: Pack) => e.code === itemCode);
    if (itemIndex < 0)
      return interaction.editReply({
        content: `There is no item with the ID \`${itemCode}\` in the droppool.`,
      });

    helper.removePackFromShop(itemCode);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Updated Shop")
          .setColor("Green")
          .setDescription(`Successfully removed \`${itemCode}\` from the shop.`),
      ],
    });
  },
};
