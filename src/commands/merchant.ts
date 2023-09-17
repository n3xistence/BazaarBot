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
    let hasMerchant = [...inv.getActiveItems(), ...inv.getItems()].find(
      (e) => e.id === 22
    );
    if (!hasMerchant)
      return interaction.reply({
        content: `You must own the card \`Merchant\` to use this command.`,
        ephemeral: true,
      });

    const price = {
      common: 1,
      rare: 2,
      epic: 4,
      legendary: 27,
      celestial: 100,
    } as const;

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Merchant")
          .setColor("Aqua")
          .setThumbnail(
            "https://i.pinimg.com/originals/53/2c/33/532c33659ae22d46cd07f418aa806762.gif"
          )
          .setDescription(
            `*Sell your cards for gems*\n\n${helper.emoteCommon} Common: ${price.common} ${helper.emoteGems}\n${helper.emoteRare} Rare: ${price.rare} ${helper.emoteGems}\n${helper.emoteEpic} Epic: ${price.epic} ${helper.emoteGems}\n${helper.emoteLegendary} Legendary: ${price.legendary} ${helper.emoteGems}\n${helper.emoteCelestial} Celestial: ${price.celestial} ${helper.emoteGems}\n\nYou may sell a card of the corresponding rarity for the listed price above with \`/sell\``
          ),
      ],
    });
  },
};
