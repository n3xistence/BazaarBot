import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import * as Database from "../Database";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";
import { Currency } from "../types/DBTypes";
import Inventory from "../Classes/Inventory";

export const sell: Command = {
  name: "sell",
  description: "Sell a card for gems",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The Code of the pack",
      required: true,
    },
    {
      name: "amount",
      type: CommandOptions.NUMBER,
      description: "The amount of duplicates to sell",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const db = Database.init();
    let cardCode = interaction.options.getString("code");
    let sellAmount = interaction.options.getNumber("amount");
    if (!sellAmount) sellAmount = 1;

    let inv: Inventory = helper.getInventoryAsObject(interaction.user.id);

    let hasMarket = [...inv.getActiveItems(), ...inv.getItems()].find((e) => e.id === 22);
    if (!hasMarket)
      return interaction.reply({
        content: `You must own the card \`Diamond Market\` to sell cards.`,
        ephemeral: true,
      });

    let card = inv.getActiveItems().find((e) => e.code === cardCode);
    if (!card) card = inv.getItems().find((e) => e.code === cardCode);
    if (!card)
      return interaction.reply({
        content: `You do not own this card.`,
        ephemeral: true,
      });

    if (sellAmount <= 0)
      return interaction.reply({
        content: `Amount must be a numerical value greater than 0.`,
        ephemeral: true,
      });

    if (sellAmount > card.amount)
      return interaction.reply({
        content: `You cannot scrap more duplicates than you own.`,
        ephemeral: true,
      });

    let gemYield = 0;
    switch (card.rarity.toLowerCase()) {
      case "common":
        gemYield = 1 * sellAmount;
        break;
      case "rare":
        gemYield = 2 * sellAmount;
        break;
      case "epic":
        gemYield = 7 * sellAmount;
        break;
      case "legendary":
        gemYield = 40 * sellAmount;
        break;
      case "celestial":
        gemYield = 200 * sellAmount;
        break;
    }

    let balance = await db.query(`SELECT * FROM currency WHERE id=$1`, [interaction.user.id]);

    if (balance.rows.length === 0) {
      db.query(`INSERT INTO currency VALUES ($1,$2,$3,$4)`, [interaction.user.id, 0, gemYield, 0]);
    } else {
      let newBalance = balance.rows[0].gems + gemYield;
      db.query(`UPDATE currency SET gems=$1 WHERE id=$2`, [newBalance, interaction.user.id]);
    }

    inv.removeItem(card, sellAmount);
    helper.updateInventoryRef(inv, interaction.user);
    helper.updateCardsLiquidated(interaction.user, db, sellAmount);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Cards Sold")
          .setColor("Green")
          .setDescription(
            `${interaction.user} has successfully sold ${sellAmount}x \`${card.name}\` for a total of ${gemYield} gems ${helper.emoteGems}.`
          ),
      ],
    });
  },
};
