import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import { Command } from "./ICommand";
import Paginator from "../Classes/Paginator";
import { Currency } from "../types/DBTypes";

const createEmbeds = (statLists: any) => {
  let uniqueEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} Unique Cards Owned ${helper.emoteBazaar}`)
    .setColor("#8955d7");
  for (let i = 0; i < statLists.uniqueCards.length; i++) {
    uniqueEmbed.addFields({
      name: `${i + 1}. ${statLists.uniqueCards[i].name}`,
      value: `${helper.emoteBazaar_Use} ${statLists.uniqueCards[i].stats.uniqueCards}`,
    });
  }

  let packsOpenedEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} Packs Opened ${helper.emoteBazaar}`)
    .setColor("#ffeabb");
  for (let i = 0; i < statLists.packsOpened.length; i++) {
    packsOpenedEmbed.addFields({
      name: `${i + 1}. ${statLists.packsOpened[i].name}`,
      value: `${helper.emoteBazaar_Pack} ${statLists.packsOpened[i].stats.packsOpened}`,
    });
  }

  let cardsLiquidatedEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} Cards Liquidated ${helper.emoteBazaar}`)
    .setColor("#f95353");
  for (let i = 0; i < statLists.cardsLiquidated.length; i++) {
    cardsLiquidatedEmbed.addFields({
      name: `${i + 1}. ${statLists.cardsLiquidated[i].name}`,
      value: `${helper.emoteBazaar_Liquid} ${statLists.cardsLiquidated[i].stats.cardsLiquidated}`,
    });
  }

  let allCardsEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} Total Cards Owned ${helper.emoteBazaar}`)
    .setColor("#fac93b");
  for (let i = 0; i < statLists.allCards.length; i++) {
    allCardsEmbed.addFields({
      name: `${i + 1}. ${statLists.allCards[i].name}`,
      value: `${helper.emoteBazaar_Cards} ${statLists.allCards[i].stats.allCards}`,
    });
  }

  let levelsEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} Levels Gained ${helper.emoteBazaar}`)
    .setColor("#9ff05a");
  for (let i = 0; i < statLists.levels.length; i++) {
    levelsEmbed.addFields({
      name: `${i + 1}. ${statLists.levels[i].name}`,
      value: `${helper.emoteLevels} ${statLists.levels[i].stats.levels}`,
    });
  }

  let winrateEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} PVP Winrate ${helper.emoteBazaar}`)
    .setColor("#ad2828");
  for (let i = 0; i < statLists.winrate.length; i++) {
    winrateEmbed.addFields({
      name: `${i + 1}. ${statLists.winrate[i].name}`,
      value: `${helper.emoteBazaar_PVP} ${(statLists.winrate[i].stats.winrate * 100).toFixed(2)}%`,
    });
  }

  let weeklyPVPEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} PVP Weekly ${helper.emoteBazaar}`)
    .setColor("#ad2828");
  for (let i = 0; i < statLists.weekly_pvp.length; i++) {
    weeklyPVPEmbed.addFields({
      name: `${i + 1}. ${statLists.weekly_pvp[i].name}`,
      value: `${helper.emoteBazaar_PVP} ${statLists.weekly_pvp[i].weekly} points`,
    });
  }

  let monthlyPVPEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} PVP Monthly ${helper.emoteBazaar}`)
    .setColor("#ad2828");
  for (let i = 0; i < statLists.monthly_pvp.length; i++) {
    monthlyPVPEmbed.addFields({
      name: `${i + 1}. ${statLists.monthly_pvp[i].name}`,
      value: `${helper.emoteBazaar_PVP} ${statLists.monthly_pvp[i].monthly} points`,
    });
  }

  let alltimePVPEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} PVP All Time ${helper.emoteBazaar}`)
    .setColor("#ad2828");
  for (let i = 0; i < statLists.alltime.length; i++) {
    alltimePVPEmbed.addFields({
      name: `${i + 1}. ${statLists.alltime[i].name}`,
      value: `${helper.emoteBazaar_PVP} ${statLists.alltime[i].total} points`,
    });
  }

  let gemsEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} Gems ${helper.emoteBazaar}`)
    .setColor("#982ab2");
  for (let i = 0; i < statLists.gems.length; i++) {
    gemsEmbed.addFields({
      name: `${i + 1}. ${statLists.gems[i].name}`,
      value: `${helper.emoteGems} ${statLists.gems[i].stats.gems}`,
    });
  }

  let scrapEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} Scrap ${helper.emoteBazaar}`)
    .setColor("#5b4b2d");
  for (let i = 0; i < statLists.scrap.length; i++) {
    scrapEmbed.addFields({
      name: `${i + 1}. ${statLists.scrap[i].name}`,
      value: `${helper.emoteScrap} ${statLists.scrap[i].stats.scrap}`,
    });
  }

  let tasksWonEmbed = new EmbedBuilder()
    .setTitle(`${helper.emoteBazaar} Tasks Won ${helper.emoteBazaar}`)
    .setColor("#f4af1e");
  for (let i = 0; i < statLists.tasksWon.length; i++) {
    tasksWonEmbed.addFields({
      name: `${i + 1}. ${statLists.tasksWon[i].name}`,
      value: `${helper.emoteBazaar_Win} ${statLists.tasksWon[i].stats.tasksWon}`,
    });
  }

  return {
    collectors: [uniqueEmbed, packsOpenedEmbed, cardsLiquidatedEmbed, allCardsEmbed],
    stats: [
      levelsEmbed,
      winrateEmbed,
      weeklyPVPEmbed,
      monthlyPVPEmbed,
      alltimePVPEmbed,
      gemsEmbed,
      scrapEmbed,
      tasksWonEmbed,
    ],
  };
};

export const lb: Command = {
  name: "lb",
  description: "Shows the leaderboards",
  options: [
    {
      name: "type",
      type: CommandOptions.STRING,
      description: "Inspect a specific category",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    let type = interaction.options.getString("type");
    if (type)
      return interaction.reply({
        content: "This feature is currently under construction.",
        ephemeral: true,
      });

    await interaction.deferReply();

    const db = Database.init();
    const userList = await db.query(`SELECT * FROM BazaarStats`);

    if (!type) {
      for (const user of userList.rows) {
        const usr = await client.users.fetch(user.id).catch(() => {});
        if (!usr) continue;

        const inv = await helper.fetchInventory(user.id);
        const pointData = await db.query(`SELECT * FROM currency WHERE id=$1`, [user.id]);

        const stats = JSON.parse(user.stats);
        const totalFights = (stats.pvp_stats?.wins ?? 0) + (stats.pvp_stats?.losses ?? 0);
        const winrate = totalFights > 0 ? stats.pvp_stats?.wins / totalFights : 0;

        const statObj = {
          uniqueCards: [...inv.getItems(), ...inv.getActiveItems()].length,
          gems: pointData.rows[0]?.gems ?? 0,
          scrap: pointData.rows[0]?.scrap ?? 0,
          tasksWon: stats.tasks_won ?? 0,
          packsOpened: stats.packs_opened ?? 0,
          cardsLiquidated: stats.cards_liquidated ?? 0,
          levels: helper.getLevelData(user.exp ?? 0).level,
          winrate,
          allCards: 0,
        };

        let allCards = 0;
        for (const card of [...inv.getItems(), ...inv.getActiveItems()]) {
          allCards += card.amount;
        }
        statObj.allCards = allCards;

        user.stats = statObj;
        user.name = usr.username;
      }

      const lb: { [k: string]: any } = {
        uniqueCards: [...userList.rows]
          .sort((a, b) => b.stats.uniqueCards - a.stats.uniqueCards)
          .slice(0, 10),
        packsOpened: [...userList.rows]
          .sort((a, b) => b.stats.packsOpened - a.stats.packsOpened)
          .slice(0, 10),
        cardsLiquidated: [...userList.rows]
          .sort((a, b) => b.stats.cardsLiquidated - a.stats.cardsLiquidated)
          .slice(0, 10),
        allCards: [...userList.rows]
          .sort((a, b) => b.stats.allCards - a.stats.allCards)
          .slice(0, 10),

        levels: [...userList.rows].sort((a, b) => b.stats.levels - a.stats.levels).slice(0, 10),
        winrate: [...userList.rows].sort((a, b) => b.stats.winrate - a.stats.winrate).slice(0, 10),
        gems: [...userList.rows].sort((a, b) => b.stats.gems - a.stats.gems).slice(0, 10),
        scrap: [...userList.rows].sort((a, b) => b.stats.scrap - a.stats.scrap).slice(0, 10),
        tasksWon: [...userList.rows]
          .sort((a, b) => b.stats.tasksWon - a.stats.tasksWon)
          .slice(0, 10),
      };

      let { rows: weeklyRows } = await db.query(
        `SELECT id,weekly FROM pvpdata ORDER BY weekly DESC LIMIT 10`
      );
      for (const row of weeklyRows) {
        row.name = (
          await client.users.fetch(row.id).catch(() => ({
            username: "Unknown",
          }))
        ).username;
      }

      let { rows: monthlyRows } = await db.query(
        `SELECT id,monthly FROM pvpdata ORDER BY monthly DESC LIMIT 10`
      );
      for (const row of monthlyRows) {
        row.name = (
          await client.users.fetch(row.id).catch(() => ({
            username: "Unknown",
          }))
        ).username;
      }

      let { rows: alltimeRows } = await db.query(
        `SELECT id,total FROM pvpdata ORDER BY total DESC LIMIT 10`
      );
      for (const row of alltimeRows) {
        row.name = (
          await client.users.fetch(row.id).catch(() => ({
            username: "Unknown",
          }))
        ).username;
      }

      lb.weekly_pvp = weeklyRows;
      lb.monthly_pvp = monthlyRows;
      lb.alltime = alltimeRows;

      let embeds = createEmbeds(lb);

      const paginator = new Paginator();
      return paginator.bazaarPaginate({ client, interaction }, embeds.collectors, embeds.stats);
    }
  },
};
