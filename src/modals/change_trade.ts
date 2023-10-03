import { ModalInteraction } from "./IModalInteraction";
import {
  Client,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import Item from "../Classes/Item";
import * as Database from "../Database";
import * as helper from "../ext/Helper";

const stringifyItemList = (list: Array<Item>, helper: any) => {
  return [...list].map((item) => {
    if (!(item instanceof Item))
      return `:black_joker: [${(item as any).code}] · \`${(item as any).name}\` · ≡ ${
        (item as any).amount
      }`;

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

export const change_trade: ModalInteraction = {
  modalId: "change_trade",
  async execute(client: Client, interaction: ModalSubmitInteraction) {
    const input = {
      set: interaction.fields.getTextInputValue("set_trade_items"),
      add: interaction.fields.getTextInputValue("add_trade_items"),
      remove: interaction.fields.getTextInputValue("remove_trade_items"),
    };
    if (Object.values(input).filter((e) => e !== "").length !== 1)
      return interaction.reply({
        content: `You need to fill out exactly one of the fields.`,
        ephemeral: true,
      });

    const cleanInput = Object.entries(input)
      .filter(([_, value]) => value !== "")
      .reduce((obj: any, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    const [[inputType, _]] = Object.entries(cleanInput);

    const re = /(bz|bp)[0-9A-Z]{2}/;
    const ids = cleanInput[inputType].split(",").map((e: any) => {
      e = e.trim();
      if (e.length !== 4) return e;

      let res = [e.slice(0, 2), e.slice(-2).toUpperCase()].join("");
      return re.test(res) ? res : e;
    });

    for (const id of ids) {
      if (re.test(id) && id.length === 4) continue;

      return interaction.reply({
        content: `\`${id}\` is not a valid card or pack id.`,
        ephemeral: true,
      });
    }

    const tradeQuery: string =
      /*sql*/
      `SELECT 
        dp.code, 
        dp.name,

        tr.msg_id, 
        tr.owner_id, 
        tr.target_id, 

        td.user_id, 
        td.item_type, 
        td.item_id, 
        td.amount,

        dp.name,
        dp.code
      FROM trade tr
      LEFT JOIN trade_details td 
      ON td.trade_id = tr.id  
      WHERE tr.msg_id=\'${interaction.message?.id}\'
      JOIN droppool dp
      ON td.item_id = dp.pid
    `;

    const db = Database.init();

    const { rows: tradeData } = await db.query(tradeQuery);
    if (tradeData.length === 0) return;
    const activeTrade = tradeData[0];

    const inv = await helper.fetchInventory(interaction.user.id);
    let isOwner = activeTrade.owner_id === interaction.user.id;

    let cards = [];
    for (const id of ids) {
      const card = [...inv.getItems(), ...inv.getActiveItems(), ...inv.getPacks()].find(
        (e) => e.code === id
      );
      if (!card)
        return interaction.reply({
          content: `You do not own an item with the code \`${id}\``,
          ephemeral: true,
        });

      cards.push(card);
    }

    if (inputType === "add") {
      for (const card of cards) {
        const item = activeTrade[isOwner ? "owner" : "target"].items.find(
          (e: any) => e.code === card.code
        );
        if (item)
          return interaction.reply({
            content: `The item with code \`${item.code}\` is already part of this trade.`,
            ephemeral: true,
          });
      }

      activeTrade[isOwner ? "owner" : "target"].items.push(...cards);
    }
    if (inputType === "remove") {
      for (const card of cards) {
        let cardIndex = activeTrade[isOwner ? "owner" : "target"].items.findIndex(
          (e: any) => e.code === card.code
        );

        activeTrade[isOwner ? "owner" : "target"].items.splice(cardIndex, 1);
      }
    }

    db.query(`UPDATE trade SET owner_accepted='false', target_accepted='false'`);

    activeTrade.owner.accepted = false;
    activeTrade.target.accepted = false;

    const ownerItemString = stringifyItemList(activeTrade.owner.items, helper).join("\n");
    const targetItemString = stringifyItemList(activeTrade.target.items, helper).join("\n");

    // fs.writeFileSync("./data/trades.json", JSON.stringify(allTrades, null, "\t"));

    let embed = new EmbedBuilder()
      .setTitle("Trade Offer")
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
      content: "Successfully updated Trade",
      ephemeral: true,
    });
  },
};
