import { Command } from "./ICommand";
import { Client, CommandInteraction } from "discord.js";
import Paginator from "../Classes/Paginator";
import sql from "better-sqlite3";
import * as helper from "../ext/Helper";
import { PaginationOption } from "../types/PaginationOption";
import Inventory from "../Classes/Inventory";
import Item from "../Classes/Item";
import CommandOptions from "../enums/CommandOptions";
import { BazaarStats, Currency } from "../types/DBTypes";

const extractItemsFromInventory = (inv: Inventory) => [
  ...inv.getActiveItems(),
  ...inv.getItems(),
  ...inv.getPacks(),
];
export const spy: Command = {
  name: "spy",
  description: "Spy on another player's inventory",
  options: [
    {
      name: "user",
      type: CommandOptions.USER,
      description: "The user to spy on",
      required: true,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    let targetUser = interaction.options.getUser("user");
    if (!targetUser || targetUser.id === interaction.user.id)
      return interaction.reply({
        content: "Please mention a valid user.",
        ephemeral: true,
      });

    const db = sql("./data/data.db");
    db.pragma("journal_mode = WAL");
    try {
      const ownInv = helper.getInventoryAsObject(interaction.user.id);
      const hasSpyglass = ownInv.getActiveItems().find((e) => e.id === 26);
      // if (!hasSpyglass)
      //   return interaction.reply({
      //     content: "You can only use this command when you own the card `Spyglass`.",
      //     ephemeral: true,
      //   });

      let inv = helper.getInventoryAsObject(targetUser.id);
      let items = extractItemsFromInventory(inv);
      const uniqueCards = [...inv.getItems(), ...inv.getActiveItems()].length;

      items.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

      let balance = {
        gems: "0",
        gold: "0",
        scrap: "0",
      };

      const data: Currency | undefined = db
        .prepare(`SELECT gold, gems, scrap FROM currency WHERE id=?`)
        .get(targetUser.id) as Currency;

      const stats: number =
        (db.prepare(`SELECT * FROM BazaarStats WHERE id=?`).get(targetUser.id) as BazaarStats)
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

          let effectIcon = typeof item.cardType !== "string" ? "⏳️" : "";
          if (typeof item.cardType === "string")
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
        title: `${targetUser.username}'s Inventory`,
      });
      return paginator.paginate({ client, interaction, ephemeral: true } as PaginationOption);
    } finally {
      db.close();
    }
  },
};
