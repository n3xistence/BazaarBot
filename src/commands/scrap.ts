import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as Database from "../Database";
import * as helper from "../ext/Helper";
import { Command } from "./ICommand";
import CommandOptions from "../enums/CommandOptions";
import { Currency } from "../types/DBTypes";

export const scrap: Command = {
  name: "scrap",
  description: "Turn a card into scrap",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The code of the card to scrap",
      required: true,
    },
    {
      name: "amount",
      type: CommandOptions.NUMBER,
      description: "The amount of duplicates to scrap",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const db = Database.init();
    let cardCode = interaction.options.getString("code");
    let scrapAmount = interaction.options.getNumber("amount");
    if (!scrapAmount) scrapAmount = 1;

    let inv = helper.getInventoryAsObject(interaction.user.id);

    let card = inv.getActiveItems().find((e) => e.code === cardCode);
    if (!card) card = inv.getItems().find((e) => e.code === cardCode);
    if (!card)
      return interaction.reply({
        content: `You do not own this card.`,
        ephemeral: true,
      });

    if (scrapAmount > card.amount)
      return interaction.reply({
        content: `You cannot scrap more duplicates than you own.`,
        ephemeral: true,
      });

    let scrapYield: number = 0;
    switch (card.rarity.toLowerCase()) {
      case "common":
        scrapYield = 1 * scrapAmount;
        break;
      case "rare":
        scrapYield = 5 * scrapAmount;
        break;
      case "legendary":
        scrapYield = 60 * scrapAmount;
        break;
      case "celestial":
        scrapYield = 300 * scrapAmount;
        break;
    }

    let balance: Currency | undefined = db
      .prepare(`SELECT * FROM currency WHERE id=?`)
      .get(interaction.user.id) as Currency;

    if (!balance) {
      db.prepare(`INSERT INTO currency VALUES (?,?,?,?)`).run(
        interaction.user.id,
        0,
        0,
        scrapYield
      );
    } else {
      let newBalance = balance.scrap + scrapYield;
      db.prepare(`UPDATE currency SET scrap=? WHERE id=?`).run(newBalance, interaction.user.id);
    }

    inv.removeItem(card, scrapAmount);
    helper.updateInventoryRef(inv, interaction.user);
    helper.updateCardsLiquidated(interaction.user, db, scrapAmount);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Cards Scrapped")
          .setColor("Green")
          .setDescription(
            `${interaction.user} has successfully scrapped ${scrapAmount}x \`${card.name}\` for a total of ${scrapYield} scrap ${helper.emoteScrap}.`
          ),
      ],
    });
  },
};
