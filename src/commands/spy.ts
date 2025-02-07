import { Command } from "./ICommand";
import { Client, CommandInteraction } from "discord.js";
import Paginator from "../Classes/Paginator";
import * as Database from "../Database";
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
  ephemeral: true,
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
      return interaction.editReply({
        content: "Please mention a valid user.",
      });

    const db = Database.init();
    const ownInv = await helper.fetchInventory(interaction.user.id);
    const hasSpyglass = ownInv.getActiveItems().find((e) => e.id === 26);
    if (!hasSpyglass)
      return interaction.editReply({
        content: "You can only use this command when you own the card `Spyglass`.",
      });

    let inv = await helper.fetchInventory(targetUser.id);
    let items = extractItemsFromInventory(inv);
    const uniqueCards = [...inv.getItems(), ...inv.getActiveItems()].length;

    items.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

    let balance = {
      gems: "0",
      gold: "0",
      scrap: "0",
    };

    const data = await db.query(`SELECT gold, gems, scrap FROM currency WHERE id=$1`, [
      targetUser.id,
    ]);

    const statsQuery = `SELECT * FROM BazaarStats WHERE id=$1`;
    const stats: number =
      ((await db.query(statsQuery, [interaction.user.id])).rows[0] as BazaarStats)?.energy ?? 0;

    if (data) {
      balance.gems = data.rows[0].gems.toLocaleString();
      balance.gold = data.rows[0].gold.toLocaleString();
      balance.scrap = data.rows[0].scrap.toLocaleString();
    }

    let invStats = `- Gold: ${balance.gold} <:bgold:1109527028434219088>\n- Gems: ${
      balance.gems
    } <:bgem:1109529198227361872>\n- Scrap: ${
      balance.scrap
    } <:bscrap:1109528259168837704>\n- Energy: ${stats}/5 ${
      helper.emoteBazaar_Energy
    }\n\n- Cards: ${inv.getCardAmount()} ${
      helper.emoteBazaar_Cards
    }\n- Unique Cards: ${uniqueCards} ${helper.emoteBazaar_Use}\n- Packs: ${inv.getPackAmount()} ${
      helper.emoteBazaar_Pack
    }`;

    let stringifiedItems = items.map((item) => {
      if (item instanceof Item) {
        let rarity = { emote: "" };
        switch (item.rarity.toLowerCase()) {
          case "celestial":
            rarity.emote = helper.emoteCelestial;
            break;
          case "legendary":
            rarity.emote = helper.emoteLegendary;
            break;
          case "epic":
            rarity.emote = helper.emoteEpic;
            break;
          case "rare":
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
  },
};
