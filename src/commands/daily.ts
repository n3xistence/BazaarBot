import { Client, CommandInteraction, EmbedBuilder, User } from "discord.js";
import * as helper from "../ext/Helper";
import { Command } from "./ICommand";
import Item from "../Classes/Item";
import * as Database from "../Database";
import pg from "pg";

const weeklyRewards: Array<number> = [15, 12, 9, 6, 3];
const claimWeekly = async (user: User): Promise<{ reward: number; placement: number } | null> => {
  const placement = await helper.getWeeklyRewardPlacement(user);
  if (placement === null) return null;

  const res: { reward: number; placement: number } = {
    placement,
    reward: placement >= 0 && placement < weeklyRewards.length ? weeklyRewards[placement] : 0,
  };

  return res;
};

const monthlyRewards: Array<number> = [50, 40, 30, 20, 10];
const claimMonthly = async (user: User): Promise<{ reward: number; placement: number } | null> => {
  const placement = await helper.getMonthlyRewardPlacement(user);
  if (placement === null) return null;

  const res: { reward: number; placement: number } = {
    placement,
    reward: placement >= 0 && placement < monthlyRewards.length ? monthlyRewards[placement] : 0,
  };

  return res;
};

const getPVPClaimedState = async (
  user: User,
  db: pg.Client
): Promise<{ weekly: boolean; monthly: boolean }> => {
  const { rows } = await db.query(
    `SELECT weekly_claimed,monthly_claimed FROM pvpdata WHERE id=$1`,
    [user.id]
  );
  if (rows.length === 0) return { weekly: false, monthly: false };

  return { weekly: rows[0].weekly_claimed, monthly: rows[0].monthly_claimed };
};

export const daily: Command = {
  name: "daily",
  description: "Trigger your daily cards",
  async execute(client: Client, interaction: CommandInteraction) {
    const db = Database.init();
    const droppool = await helper.fetchDroppool();
    let inv = await helper.fetchInventory(interaction.user.id);

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

    const errorEmbed = new EmbedBuilder()
      .setTitle("No Daily Left to Claim")
      .setColor("Red")
      .setDescription(
        `${helper.emoteDeny} ${helper.separator} You have already claimed all your daily rewards or have none of the cards.`
      );

    const pvpClaimedState = await getPVPClaimedState(interaction.user, db);

    if (cardStrings.length === 0 && pvpClaimedState.monthly && pvpClaimedState.weekly)
      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    else {
      const embed = new EmbedBuilder().setTitle("Daily Claimed").setColor("Green");

      if (cardStrings.length > 0)
        embed.setDescription(`Cards Used:\n\n>>> ${cardStrings.join("\n")}`);

      if (!pvpClaimedState.weekly) {
        const res = await claimWeekly(interaction.user);
        if (res) {
          db.query(
            `INSERT INTO currency VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET gems=currency.gems+$3`,
            [interaction.user.id, 0, res.reward, 0]
          );
          db.query(
            `INSERT INTO pvpdata VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET weekly_claimed=$7`,
            [interaction.user.id, 0, 0, 0, 0, 0, "true", "false"]
          );

          embed.addFields({
            name: "Weekly Claimed",
            value: `> #${res.placement + 1} ${helper.separator} ${helper.emoteGems} ${
              res.reward
            } gems`,
          });
        }
      }
      if (!pvpClaimedState.monthly) {
        const res = await claimMonthly(interaction.user);
        if (res) {
          db.query(
            `INSERT INTO currency VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET gems=currency.gems+$3`,
            [interaction.user.id, 0, res.reward, 0]
          );
          db.query(
            `INSERT INTO pvpdata VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET monthly_claimed=$8`,
            [interaction.user.id, 0, 0, 0, 0, 0, "false", "true"]
          );

          embed.addFields({
            name: "Monthly Claimed",
            value: `> #${res.placement + 1} ${helper.separator} ${helper.emoteGems} ${
              res.reward
            } gems`,
          });
        }
      }

      if (!embed.data.description && !embed.data.fields)
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });

      return interaction.reply({
        embeds: [embed],
      });
    }
  },
};
