import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";
import { Command } from "./ICommand";
import Item from "../Classes/Item";
import * as Database from "../Database";
import fs from "node:fs";

export const daily: Command = {
  name: "daily",
  description: "Trigger your daily cards",
  async execute(client: Client, interaction: CommandInteraction) {
    const db = Database.init();
    const droppool = JSON.parse(fs.readFileSync("./data/droppool.json", "utf-8"));
    let inv = helper.getInventoryAsObject(interaction.user.id);

    let dailyCardIDs = [23, 29, 35, 44];
    const dailyCards: Array<any> = dailyCardIDs.map((e) => {
      for (const pack of droppool) {
        const card = pack.items.find((card: Item) => card.id === e);

        if (card) return card;
      }
    });

    for (let i = 0; i < dailyCards.length; i++) {
      let cardID = dailyCards[i].id;
      let card = [...inv.getActiveItems(), ...inv.getItems()].find((e) => e.id === cardID);
      if (!card) dailyCards[i] = { card: dailyCards[i], used: false };
      else {
        const res: any = await helper.handleCustomCardUsage(card, db, interaction, client);
        dailyCards[i] = {
          card: dailyCards[i],
          used: !res.error,
          reward: { amount: res.reward, type: res.type },
        };
      }
    }

    let cardStrings: Array<string> = [];
    for (const entry of dailyCards) {
      if (!entry.used) continue;

      let { card } = entry;
      let rarity = { emote: "" };
      switch (card.rarity.toLowerCase()) {
        case "celestial":
          rarity.emote = helper.emoteCelestial;
          break;
        case "legendary":
          rarity.emote = helper.emoteLegendary;
          break;
        case "epic":
          rarity.emote = helper.emoteEpic;
          break;
        case "rare":
          rarity.emote = helper.emoteRare;
          break;
        default:
          rarity.emote = helper.emoteCommon;
          break;
      }

      let currencyEmote: string;
      switch (entry.reward.type) {
        case "gems":
          currencyEmote = helper.emoteGems;
          break;
        case "scrap":
          currencyEmote = helper.emoteScrap;
          break;
        case "exp":
          currencyEmote = helper.emoteLevels;
          break;
        default:
          currencyEmote = "";
          break;
      }

      cardStrings.push(
        `${rarity.emote}[${card.code}] · \`${card.name}\` ${helper.separator} ${entry.reward.amount} ${entry.reward.type} ${currencyEmote}`
      );
    }

    if (cardStrings.length === 0)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("No Daily Left to Claim")
            .setColor("Red")
            .setDescription(
              `${helper.emoteDeny} ${helper.separator} You have already claimed all your daily rewards or have none of the cards.`
            ),
        ],
        ephemeral: true,
      });
    else
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Daily Claimed")
            .setColor("Green")
            .setDescription(`Cards Used:\n\n>>> ${cardStrings.join("\n")}`),
        ],
      });
  },
};
