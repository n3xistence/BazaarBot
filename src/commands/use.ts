import { Command } from "./ICommand";
import { AttachmentBuilder, Client, CommandInteraction, EmbedBuilder } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import fs from "node:fs";
import * as Database from "../Database";
import * as helper from "../ext/Helper";

const getAllActiveItems = (data: any) => {
  let activeItems: Array<any> = [];

  for (const entry of data) {
    let inv = entry.activeItems;

    let items: Array<any> = [];
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
  ephemeral: false,
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
    let inv = await helper.fetchInventory(interaction.user.id);

    const db = Database.init();
    const activeCard = inv.getActiveItems().find((e) => e.code === cardCode);
    if (activeCard && activeCard.cardType === "toggle")
      return helper.handleToggleCard(activeCard, db, interaction);

    if (inv.getActiveItems().find((e) => e.code === cardCode))
      return interaction.editReply({
        content: `You have already equipped this card.`,
      });

    let card = inv.getItems().find((e) => e.code === cardCode);
    if (!card)
      return interaction.editReply({
        content: `You do not own the card with the code \`${cardCode}\``,
      });

    const currentTask = await db.query(`SELECT * FROM Bazaar WHERE active='true'`);
    if (currentTask.rows.length < 1 && card.usage === "post")
      return interaction.editReply({
        content: `This card can only be used while a task is active.`,
      });
    if ((await helper.userUsedPostCard(interaction.user, db)) && card.usage === "post")
      return interaction.editReply({
        content: `You may only use one card per task.`,
      });

    let isCustomCard = false;
    for (let effect of card.effects) {
      if (Object.values(effect).includes("null")) isCustomCard = true;
    }

    let isToggleCard = card.cardType === "toggle";
    if (isToggleCard) return helper.handleToggleCard(card, db, interaction);

    // Check Orphanage Card
    let inventories = await helper.fetchAllInventories();
    const allActiveItems = getAllActiveItems(inventories);
    if (card.id === 38 && allActiveItems.some((e) => e.id === 38))
      return interaction.editReply({
        content: `Another player has already played \`${card.name}\`. Only one may be in play at a time.`,
      });

    if (isCustomCard) {
      await helper.handleCustomCardUsage(card, db, interaction, client);
    } else {
      if (card.usage === "pre") {
        let used = card.use();
        if (!used)
          return interaction.editReply({
            content: `Could not use card \`${
              card.name
            }\` because it's currently on cooldown.\nIt is on cooldown for ${
              (card as any).cardType.cooldown.current
            } more ${(card as any).cardType.cooldown.current > 1 ? "turns" : "turn"}.`,
          });

        inv.setActiveItem(card);
        helper.updateInventoryRef(inv);

        const file = fs.existsSync(`./data/cards/${card.code}.png`)
          ? new AttachmentBuilder(`./data/cards/${card.code}.png`)
          : new AttachmentBuilder(`./data/cards/template.png`);

        return interaction.editReply({
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
  },
};
