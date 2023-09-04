import { Command } from "./ICommand";
import { AttachmentBuilder, Client, CommandInteraction, EmbedBuilder } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import fs from "node:fs";
import sql from "better-sqlite3";
import * as helper from "../ext/Helper";

const getAllActiveItems = (data: any) => {
  let activeItems = [];

  for (const entry of data) {
    let inv = entry.inventory.activeItems;

    let items = [];
    for (const item of inv) {
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

export const use: Command = {
  name: "use",
  description: "Use a card",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The card's code",
      required: true,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    let cardCode = interaction.options.getString("code");
    let inv = helper.getInventoryAsObject(interaction.user.id);

    const db = sql("./data/data.db");
    db.pragma("journal_mode = WAL");
    try {
      const activeCard = inv.getActiveItems().find((e) => e.code === cardCode);
      if (activeCard && activeCard.cardType === "toggle")
        return helper.handleToggleCard(activeCard, db, interaction);

      if (inv.getActiveItems().find((e) => e.code === cardCode))
        return interaction.reply({
          content: `You have already equipped this card.`,
          ephemeral: true,
        });

      let card = inv.getItems().find((e) => e.code === cardCode);
      if (!card)
        return interaction.reply({
          content: `You do not own the card with the code \`${cardCode}\``,
          ephemeral: true,
        });

      const currentTask = db.prepare(`SELECT * FROM Bazaar WHERE active='true'`).all();
      if (currentTask.length < 1 && card.usage === "post")
        return interaction.reply({
          content: `This card can only be used while a task is active.`,
          ephemeral: true,
        });
      if (helper.userUsedPostCard(interaction.user, db) && card.usage === "post")
        return interaction.reply({
          content: `You may only use one card per task.`,
          ephemeral: true,
        });

      let isCustomCard = false;
      for (let effect of card.effects) {
        if (Object.values(effect).includes("null")) isCustomCard = true;
      }

      let isToggleCard = card.cardType === "toggle";
      if (isToggleCard) return helper.handleToggleCard(card, db, interaction);

      // Check Orphanage Card
      let inventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));
      const allActiveItems = getAllActiveItems(inventories);
      if (card.id === 38 && allActiveItems.some((e) => e.id === 38))
        return interaction.reply({
          content: `Another player has already played \`${card.name}\`. Only one may be in play at a time.`,
          ephemeral: true,
        });

      if (isCustomCard) {
        await helper.handleCustomCardUsage(card, db, interaction, client);
      } else {
        if (card.usage === "pre") {
          let used = card.use();
          if (!used)
            return interaction.reply({
              content: `Could not use card \`${
                card.name
              }\` because it's currently on cooldown.\nIt is on cooldown for ${
                (card as any).cardType.cooldown.current
              } more ${(card as any).cardType.cooldown.current > 1 ? "turns" : "turn"}.`,
              ephemeral: true,
            });

          inv.setActiveItem(card);
          helper.updateInventoryRef(inv, interaction.user);

          const file = fs.existsSync(`./data/cards/${card.code}.png`)
            ? new AttachmentBuilder(`./data/cards/${card.code}.png`)
            : new AttachmentBuilder(`./data/cards/template.png`);

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Green")
                .setDescription(
                  `${helper.emoteApprove} ${helper.separator} Card Used: \`${card.name}\`\nEffect: ${card.description}\nTarget: ${card.target}`
                )
                .setImage(
                  `attachment://${
                    fs.existsSync(`./data/cards/${card.code}.png`) ? card.code : "template"
                  }.png`
                ),
            ],
            files: [file],
          });
        } else {
          await helper.handlePostTaskCard(card, db, interaction);
        }
      }

      if (card.usage === "post") await helper.updatePostCardUsed(card, db, interaction.user);

      // return interaction
      //   .reply({
      //     content: `\`${card.name}\` has no effect when used with \`/bz use\``,
      //     ephemeral: true,
      //   })
      //   .catch(() => {}); // this means the interaction has already been acknowledged so we do not need to catch any errors.
    } finally {
      db.close();
    }
  },
};
