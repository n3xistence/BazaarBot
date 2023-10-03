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
import * as Database from "../Database";

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

const stringifyItemList = (list: any, helper: any) => {
  return list.map((item: any) => {
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
    const ownTradesQuery: string =
      /*sql*/
      `
      SELECT 
        dp.code, dp.name, tr.msg_link, 
        tr.owner_id, tr.target_id, 
        td.user_id, td.item_type, 
        td.item_id, td.amount,
        tr.owner_accepted,
        tr.target_accepted
      FROM trade tr
      LEFT JOIN trade_details td ON td.trade_id = tr.id 
      LEFT JOIN droppool dp ON td.item_id = dp.cid
      WHERE tr.msg_id=\'${interaction.message.id}\'
    `;
    const db = Database.init();

    let { rows: activeTrade } = await db.query(ownTradesQuery);
    if (activeTrade.length === 0) return;

    const owner = await client.users.fetch(activeTrade[0].owner_id);
    const target = await client.users.fetch(activeTrade[0].target_id);

    let isOwner = activeTrade[0].owner_id === interaction.user.id;
    if (activeTrade[0][isOwner ? "owner_accepted" : "target_accepted"])
      return interaction.deferUpdate();

    if (activeTrade[0][isOwner ? "target_accepted" : "owner_accepted"]) {
      activeTrade[0][isOwner ? "owner_accepted" : "target_accepted"] = true;
      const ownerItemString = stringifyItemList(
        activeTrade
          .filter((e: any) => e.user_id === e.owner_id && e.item_id)
          .map((e: any) => [e.code, e.name]),
        helper
      ).join("\n");
      const targetItemString = stringifyItemList(
        activeTrade
          .filter((e: any) => e.user_id === e.target_id && e.item_id)
          .map((e: any) => [e.code, e.name]),
        helper
      ).join("\n");
      let embed = new EmbedBuilder()
        .setTitle("Trade Concluded")
        .setColor("Blue")
        .addFields(
          {
            name: `[${activeTrade[0].owner_accepted ? helper.emoteApprove : helper.emoteDeny}] ${
              owner.username
            }:`,
            value: `${ownerItemString.length > 1 ? ownerItemString : "No Items Added"}`,
            inline: true,
          },
          {
            name: `[${activeTrade[0].target_accepted ? helper.emoteApprove : helper.emoteDeny}] ${
              target.username
            }:`,
            value: `${targetItemString.length > 1 ? targetItemString : "No Items Added"}`,
            inline: true,
          }
        );

      let inv = await helper.fetchInventory(interaction.user.id);
      let targetInv = await helper.fetchInventory(
        activeTrade[0][isOwner ? "target_id" : "owner_id"]
      );
      let targetUser = await client.users.fetch(activeTrade[0][isOwner ? "target_id" : "owner_id"]);

      // send own items
      for (const item of activeTrade[0][isOwner ? "owner_id" : "target_id"].items) {
        item.amount = 1;
        targetInv.addItem(item);
        inv.removeItem(item);
      }

      // send target items
      for (const item of activeTrade[0][isOwner ? "target_id" : "owner_id"].items) {
        item.amount = 1;
        inv.addItem(item);
        targetInv.removeItem(item);
      }

      helper.updateInventoryRef(inv);
      helper.updateInventoryRef(targetInv);

      let msg = await interaction.channel?.messages.fetch(activeTrade[0].msg_id);
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
      activeTrade[0][isOwner ? "owner_accepted" : "target_accepted"] = true;
      db.query(
        /* SQL */
        `
          UPDATE trade 
          SET ${isOwner ? "owner_accepted" : "target_accepted"}='true' 
          WHERE msg_id=\'${interaction.message.id}\'
        `
      );

      const ownerItemString = stringifyItemList(
        activeTrade
          .filter((e: any) => e.user_id === e.owner_id && e.item_id)
          .map((e: any) => [e.code, e.name]),
        helper
      ).join("\n");
      const targetItemString = stringifyItemList(
        activeTrade
          .filter((e: any) => e.user_id === e.target_id && e.item_id)
          .map((e: any) => [e.code, e.name]),
        helper
      ).join("\n");

      let embed = new EmbedBuilder()
        .setTitle("Active Trade")
        .setColor("Blue")
        .addFields(
          {
            name: `[${activeTrade[0].owner_accepted ? helper.emoteApprove : helper.emoteDeny}] ${
              owner.username
            }:`,
            value: `${ownerItemString.length > 1 ? ownerItemString : "No Items Added"}`,
            inline: true,
          },
          {
            name: `[${activeTrade[0].target_accepted ? helper.emoteApprove : helper.emoteDeny}] ${
              target.username
            }:`,
            value: `${targetItemString.length > 1 ? targetItemString : "No Items Added"}`,
            inline: true,
          }
        );

      let row = getConfirmationButtons();
      await interaction.message.edit({ embeds: [embed], components: [row as any] });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `[${helper.emoteApprove}] ${interaction.user} has just accepted the trade with <@${
                activeTrade[0][!isOwner ? "owner_id" : "target_id"]
              }>`
            ),
        ],
      });
    }
  },
};
