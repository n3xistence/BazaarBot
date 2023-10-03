import { ButtonInteraction, Client, ColorResolvable, EmbedBuilder } from "discord.js";
import fs from "fs";
import * as Database from "../Database";
import * as helper from "../ext/Helper";
import Item from "../Classes/Item";
import AccessValidator from "../Classes/AccessValidator";

const getAllActiveItems = (data: any, type: string) => {
  let activeItems: Array<Item> = [];

  for (const entry of data) {
    let inv = entry.inventory.activeItems;

    let items: Array<Item> = [];
    for (const item of inv) {
      if (!item.effects.find((e: any) => e.category === type)) continue;

      item.owner = {
        id: entry.userId,
        name: entry.userName,
      };
      items.push(item);
    }

    activeItems.push(...items);
  }

  return activeItems;
};

const getApplicableEffects = (inv: Array<any>, options: any, hasRunestoneCard: boolean) => {
  const { userId, type } = options;

  let modifier = { additive: 0, multiplicative: 1 };
  for (const item of inv) {
    if (item.target === "self" && item.owner.id !== userId) continue;
    if (item.target === "others" && item.targetUser.id !== userId) continue;
    if (item.target === "target" && item.targetUser.id !== userId) continue;

    for (const effect of item.effects) {
      if (type !== effect.category) continue;

      if (effect.type === "additive")
        modifier.additive +=
          parseFloat(effect.modifier) *
          (item.owner.id === userId && hasRunestoneCard && item.cardType === "passive" ? 0.5 : 1);
      else
        modifier.multiplicative +=
          parseFloat(effect.modifier) *
          (item.owner.id === userId && hasRunestoneCard && item.cardType === "passive" ? 0.5 : 1);
    }
  }

  return modifier;
};

const handleTaskEnd = async (db: any, interaction: any, client: Client) => {
  let query = `SELECT * FROM Bazaar WHERE active='true'`;
  const activeTask = await db.query(query);

  if (activeTask.rows.length === 0) {
    interaction.editReply({
      content: `There is no active task.`,
      embeds: [],
      components: [],
      ephemeral: true,
    });
    return false;
  }

  let winnerIDs = JSON.parse(activeTask.rows[0].chosen_winners).map((e: any) => e.id);
  if (activeTask.rows[0].winners !== winnerIDs.length) {
    const notice = `You provided ${winnerIDs.length} winner${
      winnerIDs.length !== 1 ? "s" : ""
    } for a task with ${activeTask.rows[0].winners} winner${
      winnerIDs.length !== 1 ? "s" : ""
    }.\nAre you sure you would like to end the task regardless?`;

    const res = await helper.confirm(interaction, client, {
      content: notice,
      ephemeral: true,
    });

    if (res) {
      if (activeTask.rows[0].chosen_winners === 0) {
        const query = `DELETE FROM Bazaar WHERE id=$1`;
        db.query(query, [activeTask.rows[0].id]);

        const message = await interaction.channel.messages
          .fetch(interaction.message.id)
          .catch(console.log);
        if (message) message.delete();

        return { void: true };
      }
    } else {
      interaction.editReply({
        content: "The task will remain active.",
        components: [],
      });

      return false;
    }
  }

  let winners: any = [];
  for (let winnerID of winnerIDs) {
    let winner = await interaction.guild.members.fetch(winnerID);
    winners.push(winner);
  }

  let inventories = await helper.fetchAllInventories();

  let activeItems = getAllActiveItems(inventories, activeTask.rows[0].type);

  let winnerNotices: Array<string> = [];
  for (let winner of winners) {
    const runestoneInPlay: any = activeItems.find((e: any) => e.id === 30) !== undefined;
    const hasRunestoneCard = runestoneInPlay && runestoneInPlay.targetUser.id === winner.id;

    let modifier = getApplicableEffects(
      activeItems,
      {
        userId: winner.id,
        type: activeTask.rows[0].type,
      },
      hasRunestoneCard
    );

    let inv = await helper.fetchInventory(winner.id);
    const hasCloverCard = [inv.getActiveItems()].find((e: any) => e.id === 49) !== undefined;
    const hasGameCenterCard = inv.getActiveItems().find((e: any) => e.id === 28) !== undefined;

    let baseValue = parseInt(`${activeTask.rows[0].amount}`.replace(/\./g, ""));
    query = `SELECT ${activeTask.rows[0].type} FROM currency WHERE id=$1`;
    let balance = await db.query(query, [winner.id]);

    if (balance.rows.length === 0) {
      let pointObj: { [x: string]: any } = {
        points: 0,
        gold: 0,
        gems: 0,
        scrap: 0,
      };
      pointObj[activeTask.rows[0].type] = baseValue * modifier.multiplicative + modifier.additive;

      let cloverRoll = Math.random();
      if (cloverRoll <= 0.1 && hasCloverCard) pointObj[activeTask.rows[0].type] *= 2;
      if (hasGameCenterCard) {
        let gameRoll = Math.random();
        if (gameRoll <= 0.5) pointObj[activeTask.rows[0].type] *= 2;
        else pointObj[activeTask.rows[0].type] = baseValue * -1;
      }

      pointObj[activeTask.rows[0].type] = Math.round(pointObj[activeTask.rows[0].type]);

      const query = `INSERT INTO currency VALUES($1,$2,$3,$4)`;
      db.query(query, [winner.id, pointObj.gold, pointObj.gems, pointObj.scrap]);

      let notice = `${winner} ${helper.separator} ${pointObj[
        activeTask.rows[0].type
      ].toLocaleString()} ${activeTask.rows[0].type}`;
      winnerNotices.push(notice);
    } else {
      balance = balance.rows[0];

      let reward = Math.round(baseValue * modifier.multiplicative + modifier.additive);
      let roll = Math.random();
      if (roll <= 0.1 && hasCloverCard) reward *= 2;

      if (hasGameCenterCard) {
        let gameRoll = Math.random();
        if (gameRoll <= 0.5) reward *= 2;
        else reward = baseValue * -1;
      }

      balance[activeTask.rows[0].type] = Math.round(balance[activeTask.rows[0].type]);

      let newBalance = balance[activeTask.rows[0].type] + reward;
      query = `UPDATE currency SET ${activeTask.rows[0].type}=$1 WHERE id=$2`;
      db.query(query, [newBalance, winner.id]);

      let notice = `${winner} ${helper.separator} ${reward.toLocaleString()} ${
        activeTask.rows[0].type
      }`;
      winnerNotices.push(notice);
    }

    helper.updateTasksWon(winner, db);
  }

  interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${helper.emoteBazaar} ${helper.separator} Task Ended`)
        .setColor("DarkPurple")
        .setDescription(
          `Reward: \`${activeTask.rows[0].amount.toLocaleString()} ${
            activeTask.rows[0].type
          }\`\n\nWinners:\n >>> ${winnerNotices.join("\n")}`
        ),
    ],
  });

  helper.updateAllInventories(inventories);

  query = `UPDATE Bazaar SET active='false' WHERE id=$1`;
  db.query(query, [activeTask.rows[0].id]);

  return true;
};

export const bz_end_task: any = {
  customId: "bz_end_task",
  async execute(client: Client, interaction: ButtonInteraction) {
    if (interaction.message.partial) await interaction.message.fetch();

    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return interaction.reply({
        content: "Invalid Authorisation.",
        ephemeral: true,
      });

    let verify_embed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`Are you sure you would like to end the current task?`);

    const res = await helper.confirm(interaction, client, {
      embeds: [verify_embed],
      ephemeral: true,
    });

    if (res) {
      const taskRes: any = await handleTaskEnd(db, interaction, client);
      if (!taskRes || taskRes.void) return;

      const inventories = await helper.fetchAllInventories();
      for (const entry of inventories) {
        let user = await client.users.fetch(entry.userId ?? "").catch(() => {});
        if (!user) continue;

        let inv = await helper.fetchInventory(user.id);
        inv.endTask();
        await helper.updateInventoryRef(inv);
      }

      interaction.message.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle(interaction.message.embeds[0].data.title as string)
            .setDescription(interaction.message.embeds[0].data.description as string)
            .setColor(interaction.message.embeds[0].data.color as ColorResolvable),
        ],
        components: [],
      });
      interaction.deleteReply();
    } else {
      const denyembed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`The task will remain active.`);

      return interaction.editReply({
        embeds: [denyembed],
        components: [],
      });
    }
  },
};
