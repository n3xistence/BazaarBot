import Item from "../Classes/Item";
import { AttachmentBuilder, Client, CommandInteraction } from "discord.js";
import * as Database from "../Database";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import * as helper from "../ext/Helper";
import { Command } from "./ICommand";
import CommandOptions from "../enums/CommandOptions";
import Pack from "../Classes/Pack";

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

export const open: Command = {
  name: "open",
  description: "Open a card pack",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The code of the pack to open",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const expAmount = 30;

    const db = Database.init();
    const droppool = await helper.fetchDroppool();
    let packCode = interaction.options.getString("code");
    let inv = await helper.fetchInventory(interaction.user.id);
    let invIndex = inv.getPacks().findIndex((e) => e.code === (packCode ?? inv.getPacks()[0].code));

    if (invIndex < 0) {
      let packs = inv.getPacks();
      if (packs.length >= 1) invIndex = 0;
      else
        return interaction.reply({
          content: packCode
            ? `You do not own a pack with the id \`${packCode}\``
            : `You do not own any card packs.`,
          ephemeral: true,
        });
    }
    let dropPoolIndex = droppool.findIndex(
      (e: Pack) => e.code === (packCode ?? inv.getPacks()[0].code)
    );
    if (dropPoolIndex < 0)
      return interaction.reply({
        content: `There is no pack with the id \`${packCode ?? inv.getPacks()[0].code}\``,
        ephemeral: true,
      });

    const hasZimosCard =
      [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.id === 43) !== undefined;
    const hasMortemCard =
      [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.id === 48) !== undefined;

    await interaction.deferReply();
    let cardPool = {
      common: {
        pool: droppool[dropPoolIndex].items.filter(
          (e: Item) => e.rarity.toLowerCase() === "common"
        ),
        chance: parseFloat(droppool[dropPoolIndex].rarities.common),
      },
      rare: {
        pool: droppool[dropPoolIndex].items.filter((e: Item) => e.rarity.toLowerCase() === "rare"),
        chance: parseFloat(droppool[dropPoolIndex].rarities.rare),
      },
      epic: {
        pool: droppool[dropPoolIndex].items.filter((e: Item) => e.rarity.toLowerCase() === "epic"),
        chance: parseFloat(droppool[dropPoolIndex].rarities.epic),
      },
      legendary: {
        pool: droppool[dropPoolIndex].items.filter(
          (e: Item) => e.rarity.toLowerCase() === "legendary"
        ),
        chance: parseFloat(droppool[dropPoolIndex].rarities.legendary),
      },
      celestial: {
        pool: droppool[dropPoolIndex].items.filter(
          (e: Item) => e.rarity.toLowerCase() === "celestial"
        ),
        chance: parseFloat(droppool[dropPoolIndex].rarities.celestial),
      },
    };

    if (hasZimosCard) {
      cardPool.celestial.chance *= 1.1;
      cardPool.legendary.chance *= 1.1;
      cardPool.epic.chance *= 1.1;
      cardPool.rare.chance *= 1.1;
      cardPool.common.chance =
        1 -
        (cardPool.rare.chance +
          cardPool.epic.chance +
          cardPool.legendary.chance +
          cardPool.celestial.chance);
    }

    let rewardAmount = 3;
    if (Math.random() <= 0.25 && hasMortemCard) rewardAmount += 1;

    let rewards: Item[] = [];
    for (let i = 0; i < rewardAmount; i++) {
      let roll = Math.random() * 1;

      let reward: Item;
      if (roll <= cardPool.celestial.chance) reward = helper.randomPick(cardPool.celestial.pool);
      else if (roll <= cardPool.legendary.chance)
        reward = helper.randomPick(cardPool.legendary.pool);
      else if (roll <= cardPool.epic.chance) reward = helper.randomPick(cardPool.epic.pool);
      else if (roll <= cardPool.rare.chance) reward = helper.randomPick(cardPool.rare.pool);
      else reward = helper.randomPick(cardPool.common.pool);

      if (!rewards.some((e) => e.id === reward.id)) rewards.push(reward);
      else i--;
    }

    const pack = inv.packs[invIndex];
    inv.removePack(pack);

    for (const reward of rewards) {
      inv.addItem(reward);
    }

    inv.setUserId(interaction.user.id);
    helper.updateInventoryRef(inv);
    helper.updateTotalPacksOpened(interaction.user, db, 1);
    helper.updateTotalEXP(interaction, db, 1, expAmount);

    const attachment = await getRewardImage(rewards);

    return interaction.editReply({
      content: `Successfully opened one ${pack.name} pack:`,
      files: [attachment],
    });
  },
};
