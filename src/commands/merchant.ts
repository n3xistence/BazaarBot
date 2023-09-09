import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "./ICommand";
import CommandOptions from "../enums/CommandOptions";
import * as helper from "../ext/Helper";

export const merchant: Command = {
  name: "merchant",
  description: "Shows the merchant",
  options: [
    {
      name: "type",
      type: CommandOptions.STRING,
      description: "Inspect a specific category",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    const inv = helper.getInventoryAsObject(interaction.user.id);
    let hasMarket = [...inv.getActiveItems(), ...inv.getItems()].find((e) => e.id === 22);
    if (!hasMarket)
      return interaction.reply({
        content: `You must own the card \`Diamond Market\` to use this command.`,
        ephemeral: true,
      });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Merchant")
          .setColor("Aqua")
          .setThumbnail(
            "https://i.pinimg.com/originals/53/2c/33/532c33659ae22d46cd07f418aa806762.gif"
          )
          .setDescription(
            `*Sell your cards for gems*\n\n${helper.emoteCommon} Common: 1 ${helper.emoteGems}\n${helper.emoteRare} Rare: 2 ${helper.emoteGems}\n${helper.emoteEpic} Epic: 7 ${helper.emoteGems}\n${helper.emoteLegendary} Legendary: 40 ${helper.emoteGems}\n${helper.emoteCelestial} Celestial: 200 ${helper.emoteGems}\n\nYou may sell a card of the corresponding rarity for the listed price above with \`/bz sell\``
          ),
      ],
    });
  },
};
