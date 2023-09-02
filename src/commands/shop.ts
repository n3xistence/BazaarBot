import { Command } from "./ICommand";
import { Client, CommandInteraction } from "discord.js";
import Paginator from "../Classes/Paginator";
import fs from "node:fs";
import * as helper from "../ext/Helper";
import { PaginationOption } from "../types/PaginationOption";

const getEmote = (e: [string, unknown]) => {
  return (helper as any)[`emote${e[0].charAt(0).toUpperCase() + e[0].slice(1)}`];
};

export const shop: Command = {
  name: "shop",
  description: "Shows all items in the shop",
  async execute(client: Client, interaction: CommandInteraction) {
    const products: Array<any> = JSON.parse(fs.readFileSync("./data/shop.json", "utf-8"));

    const stringifiedProducts = products.map((e: any) => {
      let emote = "";
      const costValues = Object.entries(e.cost)
        .map((e) => `${e[1]} ${getEmote(e)} ${e[0]}`)
        .join(" / ");

      switch (e.cost.currency) {
        case "gems":
          emote = "<:bgem:1109529198227361872>";
          break;
        case "gold":
          emote = "<:bgold:1109527028434219088>";
          break;
        case "scrap":
          emote = "<:bscrap:1109528259168837704>";
          break;
        default:
          break;
      }

      if (!e.cardType) {
        return `${helper.emoteBazaar_Pack} · \`${e.code}\` · Card Pack "${e.name}"\n${helper.emoteBlank} ╚| ${costValues}`;
      } else {
        return `${e.name}`;
      }
    });

    const paginator = new Paginator();
    paginator.listToEmbeds(stringifiedProducts, null, {
      color: "DarkPurple",
      title: `${helper.emoteBazaar} ${helper.separator} Bazaar Shop`,
    });
    return paginator.paginate({ client, interaction } as PaginationOption);
  },
};
