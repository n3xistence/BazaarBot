import { Command } from "./ICommand";
import { Client, CommandInteraction } from "discord.js";
import Paginator from "../Classes/Paginator";
import * as helper from "../ext/Helper";
import { PaginationOption } from "../types/PaginationOption";

const getEmote = (e: [string, unknown]) => {
  return (helper as any)[`emote${e[0].charAt(0).toUpperCase() + e[0].slice(1)}`];
};

export const shop: Command = {
  name: "shop",
  ephemeral: false,
  description: "Shows all items in the shop",
  async execute(client: Client, interaction: CommandInteraction) {
    const products: Array<{ pid: string; gems: number; scrap: number }> =
      await helper.fetchShopItems();

    const stringifiedProducts = products.map((e: any) => {
      const costValues = [
        `${e.gems} ${helper.emoteGems} gems`,
        `${e.scrap} ${helper.emoteScrap} scrap`,
      ].join("/ ");

      if (!e.cardType) {
        return `${helper.emoteBazaar_Pack} · \`Card Pack "${e.pid}"\n${helper.emoteBlank} ╚| ${costValues}`;
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
