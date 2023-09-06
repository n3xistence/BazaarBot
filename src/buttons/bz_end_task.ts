import { ButtonInteraction, Client, ColorResolvable, EmbedBuilder } from "discord.js";
import fs from "fs";
import * as Database from "../Database";
import * as helper from "../ext/Helper";
import Item from "../Classes/Item";

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

      if (item.owner.id === userId && hasRunestoneCard && item.cardType === "passive") {
        if (effect.type === "additive") modifier.additive += parseFloat(effect.modifier) * 0.5;
        else modifier.multiplicative += parseFloat(effect.modifier) * 0.5;
      } else {
        if (effect.type === "additive") modifier.additive += parseFloat(effect.modifier);
        else modifier.multiplicative += parseFloat(effect.modifier);
      }
    }
  }

  return modifier;
};

const handleTaskEnd = async (db: any, interaction: any, client: Client) => {
  const activeTask = db.prepare(`SELECT * FROM Bazaar WHERE active='true'`).get();

  if (!activeTask) {
    interaction.editReply({
      content: `There is no active task.`,
      embeds: [],
      components: [],
      ephemeral: true,
    });
    return false;
  }

  let winnerIDs = JSON.parse(activeTask.chosen_winners).map((e: any) => e.id);
  if (activeTask.winners !== winnerIDs.length) {
    const notice = `You provided ${winnerIDs.length} winner${
      winnerIDs.length !== 1 ? "s" : ""
    } for a task with ${activeTask.winners} winner${
      winnerIDs.length !== 1 ? "s" : ""
    }.\nAre you sure you would like to end the task regardless?`;

    const res = await helper.confirm(interaction, client, {
      message: notice,
      ephemeral: true,
    });

    if (res) {
      db.prepare(`DELETE FROM Bazaar WHERE id=?`).run(activeTask.id);
      const message = await interaction.channel.messages
        .fetch(interaction.message.id)
        .catch(console.log);
      if (message) message.delete();

      return { void: true };
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

  let inventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));

  let activeItems = getAllActiveItems(inventories, activeTask.type);

  let winnerNotices: Array<string> = [];
  for (let winner of winners) {
    const runestoneInPlay: any = activeItems.find((e: any) => e.id === 30) !== undefined;
    const hasRunestoneCard = runestoneInPlay && runestoneInPlay.targetUser.id === winner.id;

    let modifier = getApplicableEffects(
      activeItems,
      {
        userId: winner.id,
        type: activeTask.type,
      },
      hasRunestoneCard
    );

    let inv = helper.getInventoryAsObject(winner.id);
    const hasCloverCard = [inv.getActiveItems()].find((e: any) => e.id === 49) !== undefined;
    const hasGameCenterCard = inv.getActiveItems().find((e: any) => e.id === 28) !== undefined;

    let baseValue = parseInt(`${activeTask.amount}`.replace(/\./g, ""));
    let balance = db.prepare(`SELECT ${activeTask.type} FROM currency WHERE id=?`).get(winner.id);

    if (!balance) {
      let pointObj: { [x: string]: any } = {
        points: 0,
        gold: 0,
        gems: 0,
        scrap: 0,
      };
      pointObj[activeTask.type] = baseValue * modifier.multiplicative + modifier.additive;

      let cloverRoll = Math.random();
      if (cloverRoll <= 0.1 && hasCloverCard) pointObj[activeTask.type] *= 2;
      if (hasGameCenterCard) {
        let gameRoll = Math.random();
        if (gameRoll <= 0.5) pointObj[activeTask.type] *= 2;
        else pointObj[activeTask.type] = baseValue * -1;
      }

      pointObj[activeTask.type] = Math.round(pointObj[activeTask.type]);

      db.prepare(`INSERT INTO currency VALUES(?,?,?,?)`).run(
        winner.id,
        pointObj.gold,
        pointObj.gems,
        pointObj.scrap
      );

      let notice = `${winner} ${helper.separator} ${pointObj[activeTask.type].toLocaleString()} ${
        activeTask.type
      }`;
      winnerNotices.push(notice);
    } else {
      let reward = Math.round(baseValue * modifier.multiplicative + modifier.additive);
      let roll = Math.random();
      if (roll <= 0.1 && hasCloverCard) reward *= 2;

      if (hasGameCenterCard) {
        let gameRoll = Math.random();
        if (gameRoll <= 0.5) reward *= 2;
        else reward = baseValue * -1;
      }

      balance[activeTask.type] = Math.round(balance[activeTask.type]);

      let newBalance = balance[activeTask.type] + reward;
      db.prepare(`UPDATE currency SET ${activeTask.type}=? WHERE id=?`).run(newBalance, winner.id);

      let notice = `${winner} ${helper.separator} ${reward.toLocaleString()} ${activeTask.type}`;
      winnerNotices.push(notice);
    }

    helper.updateTasksWon(winner, db);
  }

  interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${helper.emoteBazaar} ${helper.separator} Task #${activeTask.id} Ended`)
        .setColor("DarkPurple")
        .setDescription(
          `Reward: \`${activeTask.amount.toLocaleString()} ${
            activeTask.type
          }\`\n\nWinners:\n >>> ${winnerNotices.join("\n")}`
        ),
    ],
  });

  fs.writeFileSync("./data/inventories.json", JSON.stringify(inventories, null, "\t"));

  db.prepare(`UPDATE Bazaar SET active='false' WHERE id=${activeTask.id}`).run();

  return true;
};

export const bz_end_task: any = {
  customId: "bz_end_task",
  async execute(client: Client, interaction: ButtonInteraction) {
    if (interaction.message.partial) await interaction.message.fetch();
    if (!interaction.member) return;

    let hasperms = (interaction.member.permissions as any).has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
        ephemeral: true,
      });

    let verify_embed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`Are you sure you would like to end the current task?`);

    const res = await helper.confirm(interaction, client, {
      embeds: [verify_embed],
      ephemeral: true,
    });

    const db = Database.init();
    if (res) {
      const taskRes: any = await handleTaskEnd(db, interaction, client);
      if (!taskRes || taskRes.void) return;

      const inventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));
      for (const entry of inventories) {
        let user = await client.users.fetch(entry.userId).catch(() => {});
        if (!user) continue;

        let inv = helper.getInventoryAsObject(user.id);
        inv.endTask();
        helper.updateInventoryRef(inv, user);
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
