import { Command } from "./ICommand";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import CommandOptions from "../enums/CommandOptions";
import { BazaarStats } from "../types/DBTypes";

export const stats: Command = {
  name: "stats",
  description: "Shows your Bazaar stats",
  options: [
    {
      name: "user",
      type: CommandOptions.USER,
      description: "Mention a user to see their stats",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    let targetUser = interaction.options.getUser("user");
    if (!targetUser) targetUser = interaction.user;

    const db = Database.init();
    let generalInfo: BazaarStats = db
      .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
      .get(targetUser.id) as BazaarStats;
    let inv = helper.getInventoryAsObject(targetUser.id);
    let items = [...inv.getItems(), ...inv.getActiveItems()];
    let uniqueCards = items.length;

    let cards = {
      common: [...items.filter((e) => e.rarity.toLowerCase() === "common")],
      rare: [...items.filter((e) => e.rarity.toLowerCase() === "rare")],
      epic: [...items.filter((e) => e.rarity.toLowerCase() === "epic")],
      legendary: [...items.filter((e) => e.rarity.toLowerCase() === "legendary")],
      celestial: [...items.filter((e) => e.rarity.toLowerCase() === "celestial")],
    };

    let totalPacksOpened = generalInfo ? JSON.parse(generalInfo.stats).packs_opened ?? 0 : 0;
    let tasksWon = generalInfo ? JSON.parse(generalInfo.stats).tasks_won ?? 0 : 0;

    let pvpStats = generalInfo
      ? JSON.parse(generalInfo.stats).pvp_stats ?? { wins: 0, losses: 0 }
      : { wins: 0, losses: 0 };
    const totalFights = pvpStats.wins + pvpStats.losses;

    let strStats = `- ${helper.emoteBazaar_Pack} Total Packs Opened: ${totalPacksOpened}\n- ${
      helper.emoteBazaar_Win
    } Tasks Won: ${tasksWon}\n\n- ${helper.emoteBazaar_PVP} PVP Stats: \n> ${
      pvpStats.wins
    } wins / ${pvpStats.losses} losses (${(
      (totalFights > 0 ? pvpStats.wins / totalFights : 0) * 100
    ).toFixed(2)}% winrate)`;

    let cardAmountsUnique = {
      common: cards.common.length,
      rare: cards.rare.length,
      epic: cards.epic.length,
      legendary: cards.legendary.length,
      celestial: cards.celestial.length,
      getTotal() {
        return this.common + this.rare + this.epic + this.legendary + this.celestial;
      },
    };
    let strUniqueCards = `- ${
      helper.emoteBazaar_Use
    } Unique Cards Owned: (${cardAmountsUnique.getTotal()})\n> ${helper.emoteCommon} Common: ${
      cardAmountsUnique.common
    }\n> ${helper.emoteRare} Rare: ${cardAmountsUnique.rare}\n> ${helper.emoteEpic} Epic: ${
      cardAmountsUnique.epic
    }\n> ${helper.emoteLegendary} Legendary: ${cardAmountsUnique.legendary}\n> ${
      helper.emoteCelestial
    } Celestial: ${cardAmountsUnique.celestial}`;

    let cardAmountsTotal = {
      common: cards.common.reduce((acc, card) => acc + card.amount, 0),
      rare: cards.rare.reduce((acc, card) => acc + card.amount, 0),
      epic: cards.epic.reduce((acc, card) => acc + card.amount, 0),
      legendary: cards.legendary.reduce((acc, card) => acc + card.amount, 0),
      celestial: cards.celestial.reduce((acc, card) => acc + card.amount, 0),
      getTotal() {
        return this.common + this.rare + this.epic + this.legendary + this.celestial;
      },
    };

    let strTotalCards = `- ${
      helper.emoteBazaar_Cards
    } Total Cards Owned: (${cardAmountsTotal.getTotal()})\n> ${helper.emoteCommon} Common: ${
      cardAmountsTotal.common
    }\n> ${helper.emoteRare} Rare: ${cardAmountsTotal.rare}\n> ${helper.emoteEpic} Epic: ${
      cardAmountsTotal.epic
    }\n> ${helper.emoteLegendary} Legendary: ${cardAmountsTotal.legendary}\n> ${
      helper.emoteCelestial
    } Celestial: ${cardAmountsTotal.celestial}`;

    const dbEntry: any = db
      .prepare(`SELECT exp FROM BazaarStats WHERE ID=?`)
      .get(targetUser.id) ?? {
      exp: 0,
    };

    let levelData = helper.getLevelData(dbEntry.exp);
    let expNeeded = (levelData.level + 1) * 50;

    const levelString = `${helper.emoteLevels} Level: ${levelData.level}\n${helper.getProgressBar(
      levelData.excess,
      expNeeded
    )} (${levelData.excess}/${expNeeded})`;

    const embed = new EmbedBuilder()
      .setTitle(`Bazaar Information for ${targetUser.username}`)
      .setColor("Orange")
      .setDescription(`${levelString}\n\n${strStats}\n\n${strUniqueCards}\n\n${strTotalCards}`);

    return interaction.reply({
      embeds: [embed],
    });
  },
};
