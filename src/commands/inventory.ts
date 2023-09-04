import Paginator from "../Classes/Paginator";
import Item from "../Classes/Item";
import Inventory from "../Classes/Inventory";
import { Command } from "./ICommand";
import { Client, CommandInteraction } from "discord.js";
import * as helper from "../ext/Helper";
import sql from "better-sqlite3";
import CommandOptions from "../enums/CommandOptions";
import { BazaarStats, Currency } from "../types/DBTypes";
import Pack from "../Classes/Pack";

const extractItemsFromInventory = (inv: Inventory) => {
  let allItems = [...inv.getActiveItems(), ...inv.getItems(), ...inv.getPacks()];

  return allItems;
};

export const inventory: Command = {
  name: "inventory",
  description: "Shows your inventory",
  options: [
    {
      name: "showpublic",
      type: CommandOptions.BOOLEAN,
      description: "Whether to show your inventory publically or not (default is false)",
      required: false,
    },
    {
      name: "type",
      type: CommandOptions.STRING,
      description: "Show only cards of a specific type",
      required: false,
    },
    {
      name: "rarity",
      type: CommandOptions.STRING,
      description: "Show only cards of a specific rarity",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const db = sql("./data/data.db");
    db.pragma("journal_mode = WAL");
    try {
      let showPublic = interaction.options.getBoolean("showpublic") ?? false;
      const rarityFilter = interaction.options.getString("rarity");
      const typeFilter = interaction.options.getString("type");

      let inv = helper.getInventoryAsObject(interaction.user.id);
      let items: Array<Item | Pack> = extractItemsFromInventory(inv);
      const uniqueCards = [...inv.getItems(), ...inv.getActiveItems()].length;

      items.sort((a, b) => a.name.localeCompare(b.name));
      if (typeFilter || rarityFilter) {
        items = items.filter(
          (e: Item | Pack) =>
            e instanceof Item &&
            (!rarityFilter || e.rarity.toLowerCase() === rarityFilter.toLowerCase()) &&
            (!typeFilter ||
              (typeof e.cardType === "string"
                ? e.cardType.toLowerCase() === typeFilter.toLowerCase()
                : typeFilter.toLowerCase() === "cooldown" && e.cardType.cooldown))
        );

        if (items.length === 0)
          return interaction.reply({
            content: `There are no cards for the following filters:\n${
              typeFilter ? `Type filter: ${typeFilter}\n` : ""
            }${rarityFilter ? `Rarity filter: ${rarityFilter}` : ""}`,
            ephemeral: true,
          });
      }
      let balance = {
        gems: "0",
        gold: "0",
        scrap: "0",
      };

      const data: Currency = db
        .prepare(`SELECT gold, gems, scrap FROM currency WHERE id=?`)
        .get(interaction.user.id) as Currency;

      const stats: number =
        (db.prepare(`SELECT * FROM BazaarStats WHERE id=?`).get(interaction.user.id) as BazaarStats)
          ?.energy ?? 0;

      if (data) {
        balance.gems = data.gems.toLocaleString();
        balance.gold = data.gold.toLocaleString();
        balance.scrap = data.scrap.toLocaleString();
      }

      let invStats = `- Gold: ${balance.gold} <:bgold:1109527028434219088>\n- Gems: ${
        balance.gems
      } <:bgem:1109529198227361872>\n- Scrap: ${
        balance.scrap
      } <:bscrap:1109528259168837704>\n- Energy: ${stats}/5 ${
        helper.emoteBazaar_Energy
      }\n\n- Cards: ${inv.getCardAmount()} ${
        helper.emoteBazaar_Cards
      }\n- Unique Cards: ${uniqueCards} ${
        helper.emoteBazaar_Use
      }\n- Packs: ${inv.getPackAmount()} ${helper.emoteBazaar_Pack}`;

      let stringifiedItems = items.map((item) => {
        if (item instanceof Item) {
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

          let effectIcon = helper.isCooldown(item.cardType) ? "⏳️" : "";
          if (!helper.isCooldown(item.cardType))
            switch (item.cardType.toLowerCase()) {
              case "passive":
                effectIcon = "✨";
                break;
              case "trash":
                effectIcon = "⚡";
                break;
              case "toggle":
                effectIcon = "🎚";
                break;
            }

          return `${rarity.emote} [${item.code}] · \`${item.name}\` ${effectIcon} · ${item.amount}`;
        } else {
          return `${helper.emoteBazaar_Pack} [${item.code}] · \`${item.name}\` · ${item.amount}`;
        }
      });

      const paginator = new Paginator();
      paginator.listToEmbeds(stringifiedItems, invStats, {
        color: "Green",
        title: `${interaction.user.username}'s Inventory`,
      });
      return paginator.paginate({ client, interaction, ephemeral: !showPublic });
    } finally {
      db.close();
    }
  },
};
