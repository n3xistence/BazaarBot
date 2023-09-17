import Item from "../Classes/Item";
import * as helper from "../ext/Helper";
import {
  ButtonInteraction,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import fs from "node:fs";

const getConfirmationButtons = () => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("accept_trade")
      .setStyle(ButtonStyle.Success)
      .setLabel("Accept"),
    new ButtonBuilder().setCustomId("deny_trade").setStyle(ButtonStyle.Danger).setLabel("Deny"),
    new ButtonBuilder()
      .setCustomId("open_trade_modal")
      .setStyle(ButtonStyle.Primary)
      .setLabel("Change Items")
  );
};

const stringifyItemList = (list: Array<Item>, helper: any) => {
  return [...list].map((item) => {
    let rarity = { emote: "" };
    switch (item.rarity) {
      case "Celestial":
        rarity.emote = helper.emoteCelestial;
        break;
      case "Legendary":
        rarity.emote = helper.emoteLegendary;
        break;
      case "Rare":
        rarity.emote = helper.emoteRare;
        break;
      default:
        rarity.emote = helper.emoteCommon;
        break;
    }

    return `${rarity.emote} [${item.code}] · \`${item.name}\``;
  });
};

export const accept_trade: any = {
  customId: "accept_trade",
  async execute(client: Client, interaction: ButtonInteraction) {
    let allTrades = JSON.parse(fs.readFileSync("./data/trades.json", "utf-8"));
    let tradeIndex = allTrades.findIndex((e: any) => e.msg.id === interaction.message.id);
    let activeTrade = allTrades[tradeIndex];

    let isOwner = activeTrade.owner.id === interaction.user.id;
    if (activeTrade[isOwner ? "owner" : "target"].accepted) return interaction.deferUpdate();

    if (activeTrade[isOwner ? "target" : "owner"].accepted) {
      activeTrade[isOwner ? "owner" : "target"].accepted = true;
      const ownerItemString = stringifyItemList(activeTrade.owner.items, helper).join("\n");
      const targetItemString = stringifyItemList(activeTrade.target.items, helper).join("\n");
      let embed = new EmbedBuilder()
        .setTitle("Trade Concluded")
        .setColor("Blue")
        .addFields(
          {
            name: `[${activeTrade.owner.accepted ? helper.emoteApprove : helper.emoteDeny}] ${
              activeTrade.owner.name
            }:`,
            value: `${ownerItemString.length > 1 ? ownerItemString : "No Items Added"}`,
            inline: true,
          },
          {
            name: `[${activeTrade.target.accepted ? helper.emoteApprove : helper.emoteDeny}] ${
              activeTrade.target.name
            }:`,
            value: `${targetItemString.length > 1 ? targetItemString : "No Items Added"}`,
            inline: true,
          }
        );

      let inv = helper.getInventoryAsObject(interaction.user.id);
      let targetInv = helper.getInventoryAsObject(activeTrade[isOwner ? "target" : "owner"].id);
      let targetUser = await client.users.fetch(activeTrade[isOwner ? "target" : "owner"].id);

      // send own items
      for (const item of activeTrade[isOwner ? "owner" : "target"].items) {
        item.amount = 1;
        targetInv.addItem(item);
        inv.removeItem(item);
      }

      // send target items
      for (const item of activeTrade[isOwner ? "target" : "owner"].items) {
        item.amount = 1;
        inv.addItem(item);
        targetInv.removeItem(item);
      }

      helper.updateInventoryRef(inv, interaction.user);
      helper.updateInventoryRef(targetInv, targetUser);

      allTrades.splice(tradeIndex, 1);
      fs.writeFileSync("./data/trades.json", JSON.stringify(allTrades, null, "\t"));

      let msg = await interaction.channel?.messages.fetch(activeTrade.msg.id);
      await msg?.edit({ embeds: [embed], components: [] });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `[${helper.emoteApprove}] The trade between ${interaction.user} and ${targetUser} was successfull.`
            ),
        ],
      });
    } else {
      activeTrade[isOwner ? "owner" : "target"].accepted = true;

      fs.writeFileSync("./data/trades.json", JSON.stringify(allTrades, null, "\t"));

      const ownerItemString = stringifyItemList(activeTrade.owner.items, helper).join("\n");
      const targetItemString = stringifyItemList(activeTrade.target.items, helper).join("\n");

      let embed = new EmbedBuilder()
        .setTitle("Active Trade")
        .setColor("Blue")
        .addFields(
          {
            name: `[${activeTrade.owner.accepted ? helper.emoteApprove : helper.emoteDeny}] ${
              activeTrade.owner.name
            }:`,
            value: `${ownerItemString.length > 1 ? ownerItemString : "No Items Added"}`,
            inline: true,
          },
          {
            name: `[${activeTrade.target.accepted ? helper.emoteApprove : helper.emoteDeny}] ${
              activeTrade.target.name
            }:`,
            value: `${targetItemString.length > 1 ? targetItemString : "No Items Added"}`,
            inline: true,
          }
        );

      let msg = await interaction.channel?.messages.fetch(activeTrade.msg.id);
      let row = getConfirmationButtons();
      await msg?.edit({ embeds: [embed], components: [row as any] });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `[${helper.emoteApprove}] ${interaction.user} has just accepted the trade with <@${
                activeTrade[!isOwner ? "owner" : "target"].id
              }>`
            ),
        ],
      });
    }
  },
};
