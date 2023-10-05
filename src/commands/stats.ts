import { Command } from "./ICommand";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import CommandOptions from "../enums/CommandOptions";
import { BazaarStats } from "../types/DBTypes";

export const stats: Command = {
  name: "stats",
  ephemeral: false,
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
    let generalInfo = await db.query(`SELECT * FROM BazaarStats WHERE id=$1`, [targetUser.id]);

    let inv = await helper.fetchInventory(targetUser.id);
    let items = [...inv.getItems(), ...inv.getActiveItems()];

    let { rows: pvpScores } = await db.query(
      `SELECT id,weekly,monthly,total FROM pvpdata WHERE id=$1`,
      [interaction.user.id]
    );

    let cards = {
      common: [...items.filter((e) => e.rarity.toLowerCase() === "common")],
      rare: [...items.filter((e) => e.rarity.toLowerCase() === "rare")],
      epic: [...items.filter((e) => e.rarity.toLowerCase() === "epic")],
      legendary: [...items.filter((e) => e.rarity.toLowerCase() === "legendary")],
      celestial: [...items.filter((e) => e.rarity.toLowerCase() === "celestial")],
    };

    let totalPacksOpened =
      generalInfo.rows.length > 0 ? JSON.parse(generalInfo.rows[0].stats).packs_opened ?? 0 : 0;
    let tasksWon =
      generalInfo.rows.length > 0 ? JSON.parse(generalInfo.rows[0].stats).tasks_won ?? 0 : 0;

    let pvpStats =
      generalInfo.rows.length > 0
        ? JSON.parse(generalInfo.rows[0].stats).pvp_stats ?? { wins: 0, losses: 0 }
        : { wins: 0, losses: 0 };
    const totalFights = pvpStats.wins + pvpStats.losses;

    let strStats = `- ${helper.emoteBazaar_Pack} Total Packs Opened: ${totalPacksOpened}\n- ${
      helper.emoteBazaar_Win
    } Tasks Won: ${tasksWon}\n\n- ${helper.emoteBazaar_PVP} PVP Stats: \n> ${
      pvpStats.wins
    } wins / ${pvpStats.losses} losses (${(
      (totalFights > 0 ? pvpStats.wins / totalFights : 0) * 100
    ).toFixed(2)}% winrate)`;
    if (pvpScores.length > 0) {
      strStats += `\n> Weekly: ${pvpScores[0].weekly}\n> Monthly: ${pvpScores[0].monthly}\n> Total: ${pvpScores[0].total}`;
    }

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

    let dbEntry: any = await db.query(`SELECT exp FROM BazaarStats WHERE ID=$1`, [targetUser.id]);
    if (dbEntry.rows.length === 0) dbEntry.exp = 0;
    else dbEntry = dbEntry.rows[0];

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

    return interaction.editReply({
      embeds: [embed],
    });
  },
};
