import { Command } from "./ICommand";
import {
  AttachmentBuilder,
  Client,
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import fs from "node:fs";
import * as helper from "../ext/Helper";
import Item from "../Classes/Item";

const getAllItems = (data: any) => {
  let allItems = [];

  for (const entry of data) {
    let inv = [...entry.activeItems, ...entry.list];

    for (const item of inv) {
      let index = allItems.findIndex((e) => e.code === item.code);

      if (index >= 0) allItems[index].amount += item.amount;
      else allItems.push(item);
    }
  }

  return allItems;
};

export const view: Command = {
  name: "view",
  description: "View a card",
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
    let card: Item | undefined = [...inv.getItems(), ...inv.getActiveItems()].find(
      (e) => e.code === cardCode
    );

    if (!card)
      return interaction.reply({
        content: `You do not own this card.`,
        ephemeral: true,
      });

    await interaction.deferReply();

    let rarity = { emote: "", color: "" };
    switch (card.rarity.toLowerCase()) {
      case "celestial":
        rarity.emote = helper.emoteCelestial;
        rarity.color = "White";
        break;
      case "legendary":
        rarity.emote = helper.emoteLegendary;
        rarity.color = "Yellow";
        break;
      case "epic":
        rarity.emote = helper.emoteEpic;
        rarity.color = "Purple";
        break;
      case "rare":
        rarity.emote = helper.emoteRare;
        rarity.color = "Blue";
        break;
      default:
        rarity.emote = helper.emoteCommon;
        rarity.color = "Grey";
        break;
    }

    const inventories = await helper.fetchAllInventories();
    const allItems = getAllItems(inventories);
    const circulation = [...allItems].find((e) => e.code === (card as Item).code)?.amount ?? 0;

    const file = fs.existsSync(`./data/cards/${card.code}.png`)
      ? new AttachmentBuilder(`./data/cards/${card.code}.png`)
      : new AttachmentBuilder(`./data/cards/template.png`);

    let cardEmbed = new EmbedBuilder()
      .setTitle(`${rarity.emote} ┊ ${card.name}`)
      .setColor(`${rarity.color}` as ColorResolvable)
      .setDescription(
        `Rarity: \`${card.rarity}\`\nCards Owned: ${
          card.amount
        }\nIn Circulation: ${circulation}\nCode: \`${card.code}\`\nType: ${
          (card as any).cardType.cooldown
            ? `cooldown (${(card as any).cardType.cooldown.current}/${
                (card as any).cardType.cooldown.max
              })`
            : card.cardType
        }\nTarget: ${card.target}\nEffect: ${card.description}`
      )
      .setImage(
        `attachment://${
          fs.existsSync(`./data/cards/${card.code}.png`) ? card.code : "template"
        }.png`
      );

    return interaction.editReply({ embeds: [cardEmbed], files: [file] });
  },
};
