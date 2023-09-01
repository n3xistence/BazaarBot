import { Client, CommandInteraction } from "discord.js";
import Inventory from "./Inventory";
import Item from "./Item";
import { Cooldown } from "../types";

import {
  EmbedBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputStyle,
} from "discord.js";
import * as helper from "../ext/Helper";
import fs from "fs";

const applyGemBonus = (inv: Inventory, baseValue: number) => {
  let item = [...inv.getItems(), ...inv.getActiveItems()].find((e: any) => e.id === 40);
  if (!item) return baseValue;

  return Math.round(baseValue * 1.1);
};

/**
 * Common
 * Mahols Hut
 * Gain +5 gems when using /bz daily
 */
const handleCard23 = (card: Item, db: any, interaction: CommandInteraction) => {
  const baseReward = 3;

  const inv = helper.getInventoryAsObject(interaction.user.id);
  if ((card.cardType as Cooldown).cooldown.current > 0) return { error: true };

  let points = db.prepare(`SELECT * FROM points WHERE id=?`).get(interaction.user.id);

  if (points) {
    var reward = applyGemBonus(inv, baseReward);
    var newBalance = points.gems + reward;
    db.prepare(`UPDATE points SET gems=? WHERE id=?`).run(newBalance, interaction.user.id);
  } else {
    db.prepare(`INSERT INTO points VALUES(?,?,?,?,?,?)`).run(
      interaction.user.id,
      interaction.user.username,
      0,
      0,
      baseReward,
      0
    );
  }

  card.resetCooldown();
  helper.updateInventoryRef(inv, interaction.user);

  return { error: false, reward: baseReward, type: "gems" };
};

/**
 * Common
 * Fragile Vase
 * +10% reward from the task (gold/gems)
 */
const handleCard24 = (card: Item, db: any, interaction: CommandInteraction) => {
  let inv = helper.getInventoryAsObject(interaction.user.id);

  inv.setActiveItem(card);
  helper.updateInventoryRef(inv, interaction.user);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully used card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Common
 * Green Artifact
 * Gain a random celestial card on use
 */
const handleCard25 = (card: Item, db: any, interaction: CommandInteraction) => {
  if (card.amount < 25)
    return interaction.reply({
      content: `You can only use this card if you have 25 duplicates.\nYou currently own ${card.amount} duplicates.`,
      ephemeral: true,
    });

  let inv = helper.getInventoryAsObject(interaction.user.id);

  const droppool = JSON.parse(fs.readFileSync("./data/droppool.json", "utf-8"))[0];
  const celestialCards = [...droppool.items].filter((e: any) => e.rarity === "Celestial");
  const randomCelestial = celestialCards[Math.floor(Math.random() * celestialCards.length)];
  randomCelestial.amount = 1;

  inv.removeItem(card, 25);
  inv.addItem(randomCelestial);
  helper.updateInventoryRef(inv, interaction.user);

  interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(
          `Successfully used card \`${card.name}\`.\nYou received one \`${randomCelestial.name}\`.\nYou now own ${card.amount} duplicates of \`${card.name}\`.`
        ),
    ],
  });
};

/**
 * Rare
 * Game Center
 * 50/50 chance to gain +100% reward or pay the Bazaar the reward
 */
const toggleCard28 = (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);
  const isActive = inv.getActiveItems().find((e: any) => e.id === card.id) !== undefined;
  const action = isActive ? "disabled" : "enabled";

  inv.setActiveItem(card);
  helper.updateInventoryRef(inv, interaction.user);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully ${action} card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Rare
 * Job
 * Gain +7 gems when using /bz daily
 */
const handleCard29 = (card: Item, db: any, interaction: CommandInteraction) => {
  const baseValue = 7;

  const inv = helper.getInventoryAsObject(interaction.user.id);
  if ((card.cardType as Cooldown).cooldown.current > 0) return { error: true };

  let points = db.prepare(`SELECT * FROM points WHERE id=?`).get(interaction.user.id);

  if (points) {
    var reward = applyGemBonus(inv, baseValue);
    var newBalance = points.gems + reward;
    db.prepare(`UPDATE points SET gems=? WHERE id=?`).run(newBalance, interaction.user.id);
  } else {
    db.prepare(`INSERT INTO points VALUES(?,?,?,?,?,?)`).run(
      interaction.user.id,
      interaction.user.username,
      0,
      0,
      baseValue,
      0
    );
  }

  card.resetCooldown();
  helper.updateInventoryRef(inv, interaction.user);

  return { error: false, reward: baseValue, type: "gems" };
};

/**
 * Rare
 * Scorpion Claw
 * Multiplies passive card buffs by 50% for 1 day
 */
const handleCard30 = async (
  card: Item,
  db: any,
  interaction: CommandInteraction,
  client: Client
) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);

  if ((card.cardType as Cooldown).cooldown.current > 0)
    return interaction.reply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
      ephemeral: true,
    });

  let { input, interaction: newInteraction } = await helper.getModalInput(client, interaction, {
    label: "User ID",
    title: "Please provide a user to target.",
  });
  if (!/\d+/.test(input))
    return newInteraction.reply({
      content: "Invalid user id.",
      ephemeral: true,
    });

  let user = await client.users.fetch(input).catch(() => {});
  if (!user)
    return newInteraction.reply({
      content: `Could not fetch user by id \`${input}\`.`,
      ephemeral: true,
    });
  if (user.bot)
    return newInteraction.reply({
      content: `You cannot target bots with this card.`,
      ephemeral: true,
    });

  card.targetUser = user;
  inv.setActiveItem(card);
  helper.updateInventoryRef(inv, interaction.user);

  return newInteraction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} ${interaction.user} just used card \`${card.name}\` and targeted ${user}.`
        ),
    ],
  });
};

/**
 * Rare
 * Folen the Healer
 * Removes dubuffs from target player
 */
const handleCard31 = (card: Item, db: any, interaction: CommandInteraction) => {
  return interaction.reply(`Card Interaction for \`${card.name}\` has not been implemented yet.`);
};

/**
 * Rare
 * Dumping Grounds
 * Lose 3 scrap gain one Base Set pack (scrap needed to use)
 */
const handleCard32 = (card: Item, db: any, interaction: CommandInteraction) => {
  const scrapCost = 3;

  if ((card.cardType as Cooldown).cooldown.current > 0)
    return interaction.reply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
      ephemeral: true,
    });

  const inv = helper.getInventoryAsObject(interaction.user.id);
  const cardName = card.name;
  if (!card)
    return interaction.reply({
      content: `Could not find card \`${cardName}\` in your inventory.`,
      ephemeral: true,
    });

  let balance = db.prepare(`SELECT scrap FROM points WHERE id=?`).get(interaction.user.id);
  if (!balance)
    return interaction.reply({
      content: `You have no points.`,
      ephemeral: true,
    });

  const { scrap } = balance;
  if (scrap < scrapCost)
    return interaction.reply({
      content: `You can not afford this item. You only have ${scrap} scrap.`,
      ephemeral: true,
    });

  let newBalance = scrap - scrapCost;
  db.prepare(`UPDATE points SET scrap=? WHERE id=?`).run(newBalance, interaction.user.id);

  if ((card.cardType as Cooldown).cooldown.current > 0)
    return interaction.reply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
      ephemeral: true,
    });

  const droppool = JSON.parse(fs.readFileSync("./data/droppool.json", "utf-8"));
  let dropPoolIndex = droppool.findIndex((e: any) => e.code === "alpha");
  let cardPool = {
    common: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity === "Common"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.common),
    },
    rare: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity === "Rare"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.rare),
    },
    legendary: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity === "Legendary"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.legendary),
    },
    celestial: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity === "Celestial"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.celestial),
    },
  };

  let reward;
  let roll = Math.random() * 1;
  if (roll <= cardPool.celestial.chance) reward = helper.randomPick(cardPool.celestial.pool);
  else if (roll <= cardPool.legendary.chance) reward = helper.randomPick(cardPool.legendary.pool);
  else if (roll <= cardPool.rare.chance) reward = helper.randomPick(cardPool.rare.pool);
  else reward = helper.randomPick(cardPool.common.pool);

  inv.addItem(reward);

  card.resetCooldown();
  helper.updateInventoryRef(inv, interaction.user);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(
          `You have successfully used \`${card.name}\` and gained one \`${reward.name}\` \`(${reward.code})\``
        ),
    ],
  });
};

/**
 * Rare
 * Crafting
 * Gain one Base Set Card and 10 exp
 */
const handleCard33 = (card: Item, db: any, interaction: CommandInteraction) => {
  const expAmount = 10;

  const inv = helper.getInventoryAsObject(interaction.user.id);
  if ((card.cardType as Cooldown).cooldown.current > 0)
    return interaction.reply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
      ephemeral: true,
    });

  const droppool = JSON.parse(fs.readFileSync("./data/droppool.json", "utf-8"));

  let dropPoolIndex = droppool.findIndex((e: any) => e.code === "alpha");
  let cardPool = {
    common: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity === "Common"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.common),
    },
    rare: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity === "Rare"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.rare),
    },
    legendary: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity === "Legendary"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.legendary),
    },
    celestial: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity === "Celestial"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.celestial),
    },
  };

  let reward;
  let roll = Math.random() * 1;
  if (roll <= cardPool.celestial.chance) reward = helper.randomPick(cardPool.celestial.pool);
  else if (roll <= cardPool.legendary.chance) reward = helper.randomPick(cardPool.legendary.pool);
  else if (roll <= cardPool.rare.chance) reward = helper.randomPick(cardPool.rare.pool);
  else reward = helper.randomPick(cardPool.common.pool);

  inv.addItem(reward);

  card.resetCooldown();
  helper.updateInventoryRef(inv, interaction.user);
  helper.updateTotalEXP(interaction, db, 1, expAmount);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(
          `You have successfully used \`${card.name}\` and gained one \`${reward.name}\` \`(${reward.code})\` and ${expAmount} exp ${helper.emoteLevels}`
        ),
    ],
  });
};

/**
 * Rare
 * Horse and Carriage
 * Bypass a tasks location requirement
 */
const handleCard34 = (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);

  if ((card.cardType as Cooldown).cooldown.current > 0)
    return interaction.reply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
      ephemeral: true,
    });

  card.resetCooldown();
  helper.updateInventoryRef(inv, interaction.user);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(`Successfully used card \`${card.name}\``),
    ],
  });
};

/**
 * Rare
 * NPC
 * Gain +50 exp when using /bz daily
 */
const handleCard35 = (card: Item, db: any, interaction: CommandInteraction) => {
  const reward = 50;
  const inv = helper.getInventoryAsObject(interaction.user.id);
  let used = card.use();
  if (!used) return { error: true };

  card.resetCooldown();
  helper.updateInventoryRef(inv, interaction.user);

  const currentEXP = db.prepare(`SELECT * FROM BazaarStats WHERE id=?`).get(interaction.user.id);

  if (currentEXP) {
    let newTotal = parseInt(currentEXP.exp) + reward;

    let formerLevel = helper.getLevelData(currentEXP.exp).level;
    let levelNow = helper.getLevelData(newTotal).level;

    if (levelNow > formerLevel) {
      helper.addScrap(interaction.user, db, levelNow);
      interaction.channel?.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `${helper.emoteLevels} ${helper.separator} ${interaction.user} just leveled up and gained ${levelNow} scrap ${helper.emoteScrap}! They are now level ${levelNow}.`
            ),
        ],
      });
    }

    db.prepare(`UPDATE BazaarStats SET exp=? WHERE id=?`).run(newTotal, interaction.user.id);
  } else {
    db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
      interaction.user.id,
      JSON.stringify({}),
      reward,
      0,
      JSON.stringify({ global: null, personal: null })
    );
  }

  return { error: false, reward: reward, type: "exp" };
};

/**
 * Rare
 * Crystal
 * +25% reward from the task (gold/gems)
 */
const handleCard36 = (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);

  inv.setActiveItem(card);
  helper.updateInventoryRef(inv, interaction.user);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully used card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Rare
 * Human Remains
 * Gain between 15 and 30 gems
 */
const handleCard37 = (card: Item, db: any, interaction: CommandInteraction) => {
  const min = 15;
  const max = 30;

  let points = db.prepare(`SELECT * FROM points WHERE id=?`).get(interaction.user.id);

  let inv = helper.getInventoryAsObject(interaction.user.id);

  if (points) {
    let { gems } = points;
    let reward = applyGemBonus(inv, Math.round(Math.random() * (max - min)) + min);
    gems += reward;

    db.prepare(`UPDATE points SET gems=? WHERE id=?`).run(gems, interaction.user.id);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `Successfully used card \`${
              card.name
            }\`\n\nRewards: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>\nNew Balance: ${gems.toLocaleString()} gems<:bgem:1109529198227361872>`
          ),
      ],
    });
  } else {
    const reward = Math.round(Math.random() * 60) + 60;
    let gems = applyGemBonus(inv, reward);

    db.prepare(`INSERT INTO points VALUES(?,?,?,?,?,?)`).run(
      interaction.user.id,
      interaction.user.username,
      0,
      0,
      0,
      0,
      gems,
      0
    );

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `Successfully used card \`${
              card.name
            }\`\n\nRewards: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>\nNew Balance: ${gems.toLocaleString()} gems<:bgem:1109529198227361872>`
          ),
      ],
    });
  }

  inv.removeItem(card);
  helper.updateInventoryRef(inv, interaction.user);
};

/**
 * Rare
 * Collection
 * Gain gems equal to 2*(unique cards owned)
 */
const handleCard39 = (card: Item, db: any, interaction: CommandInteraction) => {
  let points = db.prepare(`SELECT * FROM points WHERE id=?`).get(interaction.user.id);

  let inv = helper.getInventoryAsObject(interaction.user.id);
  let uniqueItems = inv.getItems().length + inv.getActiveItems().length;

  if (points) {
    let { gems } = points;
    let reward = uniqueItems * 2;
    gems += applyGemBonus(inv, reward);

    db.prepare(`UPDATE points SET gems=? WHERE id=?`).run(gems, interaction.user.id);

    inv.removeItem(card);
    helper.updateInventoryRef(inv, interaction.user);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Card Used")
          .setColor("Green")
          .setDescription(
            `Successfully used card \`${
              card.name
            }\`\n\nRewards: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>\nNew Balance: ${gems.toLocaleString()} gems<:bgem:1109529198227361872>`
          ),
      ],
    });
  } else {
    let reward = applyGemBonus(inv, uniqueItems * 2);

    db.prepare(`INSERT INTO points VALUES(?,?,?,?,?,?)`).run(
      interaction.user.id,
      interaction.user.username,
      0,
      0,
      reward,
      0
    );

    inv.removeItem(card);
    helper.updateInventoryRef(inv, interaction.user);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Card Used")
          .setColor("Green")
          .setDescription(
            `Successfully used card \`${
              card.name
            }\`\n\nRewards: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>\nNew Balance: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>`
          ),
      ],
    });
  }
};

/**
 * Rare
 * Colosseum
 * Enables /bz attack (@player) command allowing for pvp
 */
const toggleCard40 = (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);

  const isActive = inv.getActiveItems().find((e: any) => e.id === card.id) !== undefined;
  const action = isActive ? "disabled" : "enabled";

  inv.setActiveItem(card);
  helper.updateInventoryRef(inv, interaction.user);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully ${action} card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Legendary
 * Bank
 * Gain 5% interest on your Gems when using /bz daily (capped at 10/day)
 */
const handleCard44 = (card: Item, db: any, interaction: CommandInteraction) => {
  const cap = 10;

  if ((card.cardType as Cooldown).cooldown.current > 0) return { error: true };

  const inv = helper.getInventoryAsObject(interaction.user.id);

  let points = db.prepare(`SELECT * FROM points WHERE id=?`).get(interaction.user.id);

  if (!points || points.gems <= 0) return { error: true };

  let gains = Math.round(applyGemBonus(inv, Math.round(points.gems * 0.05)));
  if (gains < 1) return { error: true };
  if (gains > cap) gains = cap;
  let newBalance = points.gems + gains;

  db.prepare(`UPDATE points SET gems=? WHERE id=?`).run(newBalance, interaction.user.id);

  card.resetCooldown();
  helper.updateInventoryRef(inv, interaction.user);

  return { error: false, reward: gains, type: "gems" };
};

/**
 * Legendary
 * O'Lo
 * Reduce cooldown of cards by 1
 */
const handleCard45 = (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);
  const allItems = [...inv.getItems()];

  const dailyCard = [23, 29, 35, 44];
  for (const item of allItems) {
    if (dailyCard.includes(item.id)) continue; // don't reduce daily gem cards

    item.turn();
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(`Successfully used card \`${card.name}\``),
    ],
  });
};

/**
 * Legendary
 * Snail Shell
 * Add 3 minutes to target players winning time
 */
const handleCard46 = async (
  card: Item,
  db: any,
  interaction: CommandInteraction,
  client: Client
) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);
  const cardName = card.name;
  if (!card)
    return interaction.reply({
      content: `You do not own the card \`${cardName}\`.`,
    });

  if ((card.cardType as Cooldown).cooldown.current > 0)
    return interaction.reply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
      ephemeral: true,
    });

  let { input, interaction: newInteraction } = await helper.getModalInput(client, interaction, {
    label: "User ID",
    title: "Please provide a user to target.",
  });
  if (!/\d+/.test(input))
    return newInteraction.reply({
      content: "Invalid user id.",
      ephemeral: true,
    });

  let user = await client.users.fetch(input).catch(() => {});
  if (!user)
    return newInteraction.reply({
      content: `Could not fetch user by id \`${input}\`.`,
      ephemeral: true,
    });
  if (user.bot)
    return newInteraction.reply({
      content: `You cannot target bots with this card.`,
      ephemeral: true,
    });

  card.targetUser = user;
  inv.setActiveItem(card);
  helper.updateInventoryRef(inv, interaction.user);

  return newInteraction.reply({
    content: "<@755563171758211154>",
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} ${interaction.user} just used card \`${card.name}\` and targeted ${user}.`
        ),
    ],
  });
};

/**
 * Legendary
 * Treasure Chest
 * +100% reward from the task (gold/gems)
 */
const handleCard47 = (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);

  inv.setActiveItem(card);
  helper.updateInventoryRef(inv, interaction.user);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully used card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Celestial
 * Balthazar
 * Reduce the cooldown of a chosen card by 3
 */
const handleCard50 = (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = helper.getInventoryAsObject(interaction.user.id);
  const balthazar = [...inv.getActiveItems(), ...inv.getItems()].find((e: any) => e.id === 50);
  if (balthazar && (balthazar.cardType as Cooldown).cooldown.current !== 0)
    return interaction.reply({
      content: `\`${balthazar.name}\` is currently on cooldown for ${
        (balthazar.cardType as Cooldown).cooldown.current
      } more ${(balthazar.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
      ephemeral: true,
    });

  const userNameField = new TextInputBuilder()
    .setCustomId("picked_card")
    .setLabel("Card Code")
    .setStyle(TextInputStyle.Short);

  const actionRowOne = new ActionRowBuilder<TextInputBuilder>().addComponents(userNameField);

  const modal = new ModalBuilder()
    .setCustomId("card_50_pick")
    .setTitle("Choose a card whose cooldown to reduce")
    .addComponents(actionRowOne);

  return interaction.showModal(modal);
};

export {
  handleCard23,
  handleCard24,
  handleCard25,
  toggleCard28,
  handleCard29,
  handleCard30,
  handleCard31,
  handleCard32,
  handleCard33,
  handleCard34,
  handleCard35,
  handleCard36,
  handleCard37,
  handleCard39,
  toggleCard40,
  handleCard44,
  handleCard45,
  handleCard46,
  handleCard47,
  handleCard50,
};
