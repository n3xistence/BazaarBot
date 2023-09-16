import Inventory from "../Classes/Inventory";
import Pack from "../Classes/Pack";
import { Cooldown, ItemType } from "../types";
import Item from "../Classes/Item";
import * as ch from "../Classes/CardHandler";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  CommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import fs from "node:fs";

const wrapInColor = (color: string, str: string): string => {
  const resetColor = "\x1b[0m";

  let clr;
  switch (color) {
    case "blue":
      clr = "\x1b[94m";
      break;
    case "green":
      clr = "\x1b[32m";
      break;
    case "red":
      clr = "\x1b[31m";
      break;
    case "yellow":
      clr = `\x1b[33m`;
      break;
    default:
      clr = "\x1b[0m";
      break;
  }
  return `${clr}${str}${resetColor}`;
};

const getUNIXStamp = () => Math.floor(new Date().getTime() / 1000);

const randomPick = (array: Array<any>): any => array[Math.floor(Math.random() * array.length)];

const handleToggleCard = (card: Item, db: any, interaction: CommandInteraction) => {
  if (!(card instanceof Item)) throw Error("Invalid Argument: Must be an instance of Item.");

  let returnValue;
  let cardId = card.id;
  switch (cardId) {
    case 28:
      returnValue = ch.toggleCard28(card, db, interaction);
      break;
    case 40:
      returnValue = ch.toggleCard40(card, db, interaction);
      break;
  }
};

const handleCustomCardUsage = (
  card: Item,
  db: any,
  interaction: CommandInteraction,
  client: Client
) => {
  if (!(card instanceof Item)) throw Error("Invalid Argument: Must be an instance of Item.");

  let cardId = card.id;
  let returnValue;
  switch (cardId) {
    case 23:
      returnValue = ch.handleCard23(card, db, interaction);
      break;
    case 25:
      returnValue = ch.handleCard25(card, db, interaction);
      break;
    case 29:
      returnValue = ch.handleCard29(card, db, interaction);
      break;
    case 31:
      returnValue = ch.handleCard31(card, db, interaction);
      break;
    case 32:
      returnValue = ch.handleCard32(card, db, interaction);
      break;
    case 33:
      returnValue = ch.handleCard33(card, db, interaction);
      break;
    case 34:
      returnValue = ch.handleCard34(card, db, interaction);
      break;
    case 35:
      returnValue = ch.handleCard35(card, db, interaction);
      break;
    case 37:
      returnValue = ch.handleCard37(card, db, interaction);
      break;
    case 39:
      returnValue = ch.handleCard39(card, db, interaction);
      break;
    // case 43:
    //   returnValue = ch.handleCard43(card, db, interaction, client);
    //   break;
    case 44:
      returnValue = ch.handleCard44(card, db, interaction);
      break;
    case 46:
      ch.handleCard46(card, db, interaction, client);
      break;
    // case 49:
    //   returnValue = ch.handleCard49(card, db, interaction);
    //   break;
    case 50:
      returnValue = ch.handleCard50(card, db, interaction);
      break;
    default:
      break;
  }

  return returnValue;
};

const handlePostTaskCard = (card: Item, db: any, interaction: CommandInteraction) => {
  if (!(card instanceof Item)) throw Error("Invalid Argument: Must be an instance of Item.");

  let cardId = card.id;
  switch (cardId) {
    case 24:
      ch.handleCard24(card, db, interaction);
      break;
    case 36:
      ch.handleCard36(card, db, interaction);
      break;
    case 38:
      ch.handleCard38(card, db, interaction);
      break;
    case 47:
      ch.handleCard47(card, db, interaction);
      break;
    case 51:
      ch.handleCard51(card, db, interaction);
      break;
    default:
      break;
  }
};

const getInventoryAsObject = (userId: string) => {
  const currentInventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));

  let userObject = currentInventories.find((e: any) => e.userId === userId);
  return userObject ? new Inventory().fromJSON(userObject.inventory) : new Inventory();
};

const updateInventoryRef = (inv: Inventory, user: any) => {
  const currentInventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));

  let index = currentInventories.findIndex((e: any) => e.userId === user.id);
  if (index < 0) {
    currentInventories.push({
      userId: user.id,
      userName: user.username,
      inventory: inv,
    });
  } else {
    currentInventories[index].inventory = inv;
  }
  fs.writeFileSync("./data/inventories.json", JSON.stringify(currentInventories, null, "\t"));
};

const updateTotalPacksOpened = async (user: any, db: any, amount: number = 1) => {
  const exp = 20;

  const currentStats = await db.query(`SELECT * FROM BazaarStats WHERE id=$1`, [user.id]);

  if (currentStats.rows.length > 0) {
    const stats = JSON.parse(currentStats.rows[0].stats);
    let newTotal = parseInt(stats.packs_opened ?? 0) + amount;
    stats.packs_opened = newTotal;

    db.query(`UPDATE BazaarStats SET stats=$1 WHERE id=$2`, [JSON.stringify(stats), user.id]);
  } else {
    db.query(`INSERT INTO BazaarStats VALUES($1,$2,$3,$4,$5)`, [
      user.id,
      JSON.stringify({ packs_opened: amount }),
      exp * amount,
      0,
      JSON.stringify({ global: null, personal: null }),
    ]);
  }
};

const updateTotalEXP = async (
  interaction: CommandInteraction,
  db: any,
  amount: number,
  value: number = 100
) => {
  const currentEXP = await db.query(`SELECT * FROM BazaarStats WHERE id=$1`, [interaction.user.id]);

  if (currentEXP.rows.length > 0) {
    let formerLevel = getLevelData(currentEXP.rows[0].exp).level;
    let levelNow = getLevelData(currentEXP.rows[0].exp + value).level;

    if (levelNow > formerLevel) {
      addScrap(interaction.user, db, levelNow);
      interaction.channel?.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `${emoteLevels} ${separator} ${interaction.user} just leveled up and gained ${levelNow} scrap ${emoteScrap}! They are now level ${levelNow}.`
            ),
        ],
      });
    }

    let newTotal = parseInt(currentEXP.rows[0].exp) + amount * value;
    db.query(`UPDATE BazaarStats SET exp=$1 WHERE id=$2`, [newTotal, interaction.user.id]);
  } else {
    if (getLevelData(value).level >= 1)
      interaction.channel?.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Level Up")
            .setColor("Green")
            .setDescription(
              `${emoteApprove} ${separator} ${
                interaction.user
              } just leveled up! They are now level ${getLevelData(value).level}`
            ),
        ],
      });

    db.query(`INSERT INTO BazaarStats VALUES($1,$2,$3,$4,$5)`, [
      interaction.user.id,
      JSON.stringify({}),
      amount * value,
      0,
      JSON.stringify({ global: null, personal: null }),
    ]);
  }
};

const addScrap = async (user: any, db: any, amount: number) => {
  const currentScrap = await db.query(`SELECT * FROM currency WHERE id=$1`, [user.id]);

  if (currentScrap.rows.length > 0) {
    let newTotal = parseInt(currentScrap.rows[0].scrap) + amount;
    db.query(`UPDATE currency SET scrap=$1 WHERE id=$2`, [newTotal, user.id]);
  } else {
    db.query(`INSERT INTO currency VALUES($1,$2,$3,$4)`, [user.id, 0, 0, amount]);
  }
};

const getLevelData = (exp: number) => {
  let level = 0;
  while (exp >= (level + 1) * 50) {
    exp -= (level + 1) * 50;
    level++;
  }

  return { level, excess: exp };
};

const getProgressBar = (val: number, total: number = 100) => {
  let z = (val / total) * 100;

  let progressBar = "";
  for (let i = 0; i < 100; i += 10) {
    if (z - 10 >= 0) {
      progressBar += "▰";
      z -= 10;
    } else {
      progressBar += "▱";
    }
  }

  return progressBar;
};

/**
 * Hp calculations - Each card owned
 * Common - +3
 * Rare - +15
 * Epic - +25
 * Legendary - +50
 * Celestial - +250
 */
const bz_getHealth = (inv: Inventory, level: number) => {
  let allItems = [...inv.getActiveItems(), ...inv.getItems()];
  let uniqueItems = {
    common: allItems.filter((e) => e.rarity.toLowerCase() === "common"),
    rare: allItems.filter((e) => e.rarity.toLowerCase() === "rare"),
    epic: allItems.filter((e) => e.rarity.toLowerCase() === "epic"),
    legendary: allItems.filter((e) => e.rarity.toLowerCase() === "legendary"),
    celestial: allItems.filter((e) => e.rarity.toLowerCase() === "celestial"),
  };

  let totals = {
    common: uniqueItems.common.reduce((acc, item) => acc + item.amount, 0) * 3,
    rare: uniqueItems.rare.reduce((acc, item) => acc + item.amount, 0) * 15,
    epic: uniqueItems.epic.reduce((acc, item) => acc + item.amount, 0) * 25,
    legendary: uniqueItems.legendary.reduce((acc, item) => acc + item.amount, 0) * 50,
    celestial: uniqueItems.celestial.reduce((acc, item) => acc + item.amount, 0) * 250,
  };

  return totals.common + totals.rare + totals.legendary + totals.celestial + level * 2;
};

/**
 * Dmg Calculations - Each unique card owned
 * Common - +10
 * Rare - +20
 * Epic - +25
 * Legendary - +30
 * Celestial - +50
 * Player level: level×2 dmg
 */
const bz_getDamage = (inv: Inventory, level: number) => {
  let allItems = [...inv.getActiveItems(), ...inv.getItems()];
  let uniqueItems = {
    common: allItems.filter((e) => e.rarity.toLowerCase() === "common"),
    rare: allItems.filter((e) => e.rarity.toLowerCase() === "rare"),
    epic: allItems.filter((e) => e.rarity.toLowerCase() === "epic"),
    legendary: allItems.filter((e) => e.rarity.toLowerCase() === "legendary"),
    celestial: allItems.filter((e) => e.rarity.toLowerCase() === "celestial"),
  };

  let totals = {
    common: uniqueItems.common.length * 10,
    rare: uniqueItems.rare.length * 20,
    epic: uniqueItems.epic.length * 25,
    legendary: uniqueItems.legendary.length * 30,
    celestial: uniqueItems.celestial.length * 50,
  };

  const totalDamage = Object.values(totals).reduce((acc, val) => acc + val, 0) + level * 2;
  const rng = Math.random() * 2 - 1;
  const tenPercent = totalDamage * 0.1;

  return Math.round(totalDamage + tenPercent * rng);
};

const userUsedPostCard = async (user: any, db: any) => {
  let currentTask = await db.query(`SELECT * FROM Bazaar WHERE active='true'`);
  if (currentTask.rows.length < 1) return false;
  else currentTask = currentTask.rows[0];

  let userList = JSON.parse(currentTask.participants);
  return userList.find((e: any) => e.id === user.id) !== undefined;
};

const updatePostCardUsed = async (card: Item, db: any, user: any) => {
  let currentTask = await db.query(`SELECT * FROM Bazaar WHERE active='true'`);
  if (currentTask.rows.length < 1) return;
  else currentTask = currentTask[0];

  let userList = JSON.parse(currentTask.participants);
  if (userList.find((e: any) => e.id === user.id)) return;

  const newUserObject = {
    id: user.id,
    card: card.id,
  };
  userList.push(newUserObject);

  db.query(`UPDATE Bazaar SET participants=$1 WHERE id=$2`, [
    JSON.stringify(userList),
    currentTask.id,
  ]);
};

const updatePVPStats = async (user: any, db: any, result: number) => {
  const currentStats = await db.query(`SELECT * FROM BazaarStats WHERE id=$1`, [user.id]);

  if (currentStats.rows.length > 0) {
    let stats = JSON.parse(currentStats.rows[0].stats); // fill the obect with the default values in case user has not participated in pvp yet
    if (stats === 0) stats = {};
    if (!stats.pvp_stats) stats.pvp_stats = { wins: 0, losses: 0 };
    if (!stats.pvp_stats.wins) stats.pvp_stats.wins = 0;
    if (!stats.pvp_stats.losses) stats.pvp_stats.losses = 0;

    if (result > 0) stats.pvp_stats.wins = stats.pvp_stats.wins + result;
    else stats.pvp_stats.losses = stats.pvp_stats.losses + Math.abs(result);

    db.query(`UPDATE BazaarStats SET stats=$1 WHERE id=$2`, [JSON.stringify(stats), user.id]);
  } else {
    let stats = {
      pvp_stats: {
        wins: result > 0 ? result : 0,
        losses: result < 0 ? Math.abs(result) : 0,
      },
    };

    db.query(`INSERT INTO BazaarStats VALUES($1,$2,$3,$4,$5)`, [
      user.id,
      JSON.stringify(stats),
      0,
      0,
      JSON.stringify({ global: null, personal: null }),
    ]);
  }
};

const updateTasksWon = async (user: any, db: any) => {
  const currentStats = db.query(`SELECT * FROM BazaarStats WHERE id=$1`, [user.id]);

  if (currentStats.rows.length > 0) {
    const stats = JSON.parse(currentStats.rows[0].stats);
    let newTotal = parseInt(stats.tasks_won ?? 0) + 1;
    stats.tasks_won = newTotal;

    db.query(`UPDATE BazaarStats SET stats=$1 WHERE id=$2`, [JSON.stringify(stats), user.id]);
  } else {
    db.query(`INSERT INTO BazaarStats VALUES($1,$2,$3,$4,$5)`, [
      user.id,
      JSON.stringify({ tasks_won: 1 }),
      0,
      0,
      JSON.stringify({ global: null, personal: null }),
    ]);
  }
};

const updateCardsLiquidated = async (user: any, db: any, amount: number = 1) => {
  const currentStats = await db.query(`SELECT * FROM BazaarStats WHERE id=$1`, [user.id]);

  if (currentStats.rows.length > 0) {
    const stats = JSON.parse(currentStats.rows[0].stats);
    let newTotal = parseInt(stats.cards_liquidated ?? 0) + amount;
    stats.cards_liquidated = newTotal;

    db.query(`UPDATE BazaarStats SET stats=$1 WHERE id=$2`, [JSON.stringify(stats), user.id]);
  } else {
    db.query(`INSERT INTO BazaarStats VALUES($1,$2,$3,$4,$5)`, [
      user.id,
      JSON.stringify({ cards_liquidated: amount }),
      0,
      0,
      JSON.stringify({ global: null, personal: null }),
    ]);
  }
};

const getModalInput = (
  client: Client,
  interaction: CommandInteraction,
  options: { label: string; title: string }
): Promise<{ input: string; interaction: CommandInteraction }> => {
  return new Promise((resolve, reject) => {
    const defaultField = new TextInputBuilder()
      .setCustomId("default_input_field")
      .setLabel(options.label ?? "User Input")
      .setStyle(TextInputStyle.Short);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(defaultField);

    const modal = new ModalBuilder()
      .setCustomId("default_input_modal")
      .setTitle(options.title ?? "Please submit your input")
      .addComponents(actionRow);

    interaction.showModal(modal);

    const listener = async (modalInteraction: any) => {
      if (!modalInteraction.isModalSubmit()) return;
      if (modalInteraction.customId !== "default_input_modal") return;

      const input = modalInteraction.fields.getTextInputValue("default_input_field");

      client.off("interactionCreate", listener);

      // Resolve the promise with the input value
      resolve({ input, interaction: modalInteraction });
    };

    client.on("interactionCreate", listener);
    setTimeout(() => {
      try {
        client.off("interactionCreate", listener);
      } catch {}
      reject(new Error("Modal input timed out"));
    }, 60_000);
  });
};

const updateItemProperties = (inventories: Array<any>, item: ItemType, { global = true }) => {
  if (!global) return;

  for (const entry of inventories) {
    let inv = new Inventory().fromJSON(entry.inventory);

    let activeIndex = inv.getActiveItems().findIndex((e) => e.id === item.id);
    if (activeIndex >= 0) {
      const newItem = new Item(item);
      const oldItem = JSON.parse(JSON.stringify(inv.activeItems[activeIndex]));
      inv.activeItems[activeIndex] = newItem;

      inv.activeItems[activeIndex].amount = oldItem.amount;
      if (typeof newItem.cardType !== "string") {
        newItem.cardType.cooldown.current =
          oldItem.cardType.cooldown?.current ?? newItem.cardType.cooldown.current;
      }

      if (
        inv.activeItems[activeIndex].cardType !== oldItem.cardType &&
        inv.activeItems[activeIndex].cardType !== "passive"
      ) {
        inv.moveToInventory(inv.activeItems[activeIndex]);

        if (typeof newItem.cardType !== "string") newItem.cardType.cooldown.current = 0;
      }

      updateInventoryRef(inv, { id: entry.userId, username: entry.userName });
    }

    let generalIndex = inv.getItems().findIndex((e) => e.id === item.id);
    if (generalIndex >= 0) {
      const newItem = new Item(item);
      const oldItem = JSON.parse(JSON.stringify(inv.list[generalIndex]));
      inv.list[generalIndex] = newItem;

      inv.list[generalIndex].amount = oldItem.amount;
      if (typeof newItem.cardType !== "string") {
        newItem.cardType.cooldown.current =
          oldItem.cardType.cooldown?.current ?? newItem.cardType.cooldown.current;
      }

      if (inv.list[generalIndex].cardType === "passive") inv.setActiveItem(inv.list[generalIndex]);

      updateInventoryRef(inv, { id: entry.userId, username: entry.userName });
    }
  }
};

const updatePackProperties = (inventories: Array<any>, pack: Pack, { global = true }) => {
  if (!global) return;

  for (const entry of inventories) {
    let inv = new Inventory().fromJSON(entry.inventory);

    let index = inv.getPacks().findIndex((e) => e.code === pack.code);
    if (index >= 0) {
      const newPack = JSON.parse(JSON.stringify(pack));
      const oldPack = JSON.parse(JSON.stringify(inv.packs[index]));
      inv.packs[index] = newPack;

      inv.packs[index].amount = oldPack.amount;

      updateInventoryRef(inv, { id: entry.userId, username: entry.userName });
    }
  }
};

const confirm = async (
  interaction: CommandInteraction | ButtonInteraction,
  client: Client,
  { ephemeral = false, message = "", embeds = [] }: any
) => {
  const confirmationRow: any = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("confirm_approve")
      .setStyle(ButtonStyle.Success)
      .setEmoji("<:BB_Check:1031690264089202698>"),
    new ButtonBuilder()
      .setCustomId("confirm_deny")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("<:BB_Cross:1031690265334911086>")
  );

  const interactionMessage = interaction.replied
    ? message.length === 0
      ? await interaction.editReply({
          embeds: embeds,
          components: [confirmationRow],
        })
      : await interaction.editReply({
          content: message,
          embeds: embeds,
          components: [confirmationRow],
        })
    : message.length === 0
    ? await interaction.reply({
        embeds: embeds,
        ephemeral: ephemeral,
        components: [confirmationRow],
        fetchReply: true,
      })
    : await interaction.reply({
        content: message,
        embeds: embeds,
        ephemeral: ephemeral,
        components: [confirmationRow],
        fetchReply: true,
      });

  const filter = (confInt: any) => {
    confInt.deferUpdate();
    return (
      confInt.message &&
      confInt.user.id === interaction.user.id &&
      confInt.message.id === interactionMessage.id
    );
  };
  if (!interaction.channel) return;

  const collector: any = interaction.channel.createMessageComponentCollector({
    filter,
    time: 30000, // 30 seconds
    max: 1, // Only collect 1 interaction
  });

  return new Promise((resolve) => {
    collector.on("end", (collected: any) => {
      if (collected.size === 0) {
        resolve(false);
      } else {
        const interaction = collected.first();
        resolve(interaction.customId === "confirm_approve");
      }
    });
  });
};

const getItemSprite = async (item: Item): Promise<any> => {
  let sprite;
  try {
    sprite = await loadImage(`./data/cards/${item.code}.png`);
  } catch {
    sprite = await loadImage(`./data/cards/template.png`);
  }
  return sprite;
};

const getRewardImage = async (rewards: Array<Item>) => {
  const canvas = createCanvas(rewards.length * 1000, 1080);
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < rewards.length; i++) {
    try {
      var sprite = await loadImage(`./data/cards/${rewards[i].code}.png`);
    } catch {
      var sprite = await loadImage(`./data/cards/template.png`);
    }
    ctx.drawImage(sprite, i * 1000 + 100, 0);
  }

  const buffer = canvas.toBuffer("image/png");
  const attachment = new AttachmentBuilder(buffer);
  return attachment;
};

const emoteApprove = "<:BB_Check:1031690264089202698>";
const emoteDeny = "<:BB_Cross:1031690265334911086>";
const emoteBlank = "<:blank:1019977634249187368>";
const separator = "┊";
const emoteBazaar = "<:bsoc:1142949974506750052>";
const emoteBazaar_Energy = "<:bene:1142949340164391073>";
const emoteBazaar_Pack = "<:bpack:1142934055822819438>";
const emoteBazaar_PVP = "<:bpvp:1142935775680409833>";
const emoteBazaar_Use = "<:buse:1142933093968261322>";
const emoteBazaar_Cards = "<:bcards:1142941345498017792>";
const emoteBazaar_Win = "<:bwin:1142939355921522708>";
const emoteBazaar_Liquid = "<:bss:1143263099219087360>";

const emoteCommon = "<:bcom:1143457091856633907>";
const emoteRare = "<:brare:1143456990006358066>";
const emoteEpic = "<:bepic:1150171205375102976>";
const emoteLegendary = "<:bleg:1143456863841693767>";
const emoteCelestial = "<:bcel:1143456627480076368>";

const emoteGems = "<:bgem:1109529198227361872>";
const emoteGold = "<:bgold:1109527028434219088>";
const emoteScrap = "<:bscrap:1109528259168837704>";

const emoteLevels = "<:BB_Levels:1027227604144640030>";
const emoteSteps = "<:BB_Steps:1027227609723047966>";
const emoteNPC = "<:BB_NPC:1027227605650391102>";
const emotePVP = "<:BB_PVP:1027227607034515456>";
const emoteQuests = "<:BB_Quests:1027227608267636816>";
const emoteTasks = "<:BB_Tasks:1027227610993938472>";
const emoteBoss = "<:BB_Boss:1027227600784982077>";
const emoteBounties = "<:BB_Bounties:1027227602320097361>";
const emoteHeart = "<:BB_Heart:1141096928747208795>";

export {
  wrapInColor,
  getUNIXStamp,
  confirm,
  randomPick,
  handleToggleCard,
  handleCustomCardUsage,
  handlePostTaskCard,
  getInventoryAsObject,
  updateInventoryRef,
  updateTotalPacksOpened,
  updateTotalEXP,
  addScrap,
  getLevelData,
  getProgressBar,
  bz_getHealth,
  bz_getDamage,
  userUsedPostCard,
  updatePostCardUsed,
  updatePVPStats,
  updateTasksWon,
  updateCardsLiquidated,
  getModalInput,
  updateItemProperties,
  updatePackProperties,
  separator,
  emoteApprove,
  emoteDeny,
  emoteBlank,
  emoteBazaar,
  emoteBazaar_Energy,
  emoteBazaar_Pack,
  emoteBazaar_PVP,
  emoteBazaar_Use,
  emoteBazaar_Cards,
  emoteBazaar_Win,
  emoteBazaar_Liquid,
  emoteCommon,
  emoteRare,
  emoteEpic,
  emoteLegendary,
  emoteCelestial,
  emoteGems,
  emoteGold,
  emoteScrap,
  emoteLevels,
  emoteSteps,
  emoteNPC,
  emotePVP,
  emoteQuests,
  emoteTasks,
  emoteBoss,
  emoteBounties,
  emoteHeart,
};
