import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "./ICommand";
import * as helper from "../ext/Helper";

import Paginator from "../Classes/Paginator";
import { PaginationOption } from "../types/PaginationOption";

export const help: Command = {
  name: "help",
  ephemeral: false,
  description: "Shows help for command usage",
  async execute(client: Client, interaction: CommandInteraction) {
    const help = new EmbedBuilder()
      .setTitle(`${helper.emoteBazaar} Bazaar Help ${helper.emoteBazaar}`)
      .setColor("#8955d7")
      .setDescription(
        `- \`</inventory>\` : Allows you to access your Bazaar inventory.\n- \`</stats>\` : Allows you to see the stats of the Bazaar.\n- \`</open [pack code]>\` : Allows you to open the requested card pack.\n- \`</shop>\` : Allows you to access the Bazaar's shop.\n- \`</buy [gems/scrap] [pack code] [amount]>\` : Allows you to purchase card packs.\n- \`</use [card code]>\` : Allows you to use an owned card.\n- \`</view [card code]>\` : Allows you to view a specified card.\n- \`</scrap [card code] [amount]>\` : Allows you to scrap a specified card in exchange for scrap.\n- \`</send [card code] [amount] [@player]>\` : Allows you to send a specified card to another player.\n- \`</trade [@player]>\` : Allows you to start a trade with another player.\n- \`</tradelist>\` : Allows you to see your ongoing trades and offers easy access via link.\n- \`</daily>\` : Allows you to claim the daily benefit of eligible cards.\n- \`</attack [@player]>\` : Allows you to attack another player.\n- \`</merchant>\` : Allows you to access the merchant menu.\n- \`</spy [@player]>\` : Allows you to see another player's inventory.\n- \`</sell [card code] [amount]>\` : Allows you to sell a specified card in exchange for Gems.\n- \`</help>\` : Allows access to the command list.`
      );

    const credits = new EmbedBuilder()
      .setTitle(`${helper.emoteBazaar} Bazaar Credits ${helper.emoteBazaar}`)
      .setColor("#8955d7")
      .setDescription(
        `- Concept by [Ivan](https://simplemmo.me/mobile/?page=user/view/548796)\n- Coded by [Nex](https://simplemmo.me/mobile/?page=user/view/261266)\n- Built by [Blackout](https://simplemmo.me/mobile/?page=user/view/369859)\n- Cards made by [Mellow](https://simplemmo.me/mobile/?page=user/view/975880) and [Ivan](https://simplemmo.me/mobile/?page=user/view/548796)\n- Funded by [Babel](https://simplemmo.me/mobile/?page=guilds/view/1970)`
      );

    const paginator = new Paginator();
    paginator.embeds = [help, credits];
    paginator.paginate({ client, interaction } as PaginationOption);
  },
};
