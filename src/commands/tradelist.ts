import { Command } from "./ICommand";
import { Client, CommandInteraction } from "discord.js";
import Paginator from "../Classes/Paginator";
import * as Database from "../Database";
import { PaginationOption } from "../types/PaginationOption";

export const tradelist: Command = {
  name: "tradelist",
  ephemeral: false,
  description: "Shows your current trades",
  async execute(client: Client, interaction: CommandInteraction) {
    const ownTradesQuery: string =
      /*sql*/
      `SELECT tr.msg_link, tr.owner_id, tr.target_id
        FROM trade tr
        LEFT JOIN trade_details td 
        ON td.trade_id = tr.id  
        WHERE tr.owner_id=\'${interaction.user.id}\' 
        OR tr.target_id=\'${interaction.user.id}\'
      `;

    const db = Database.init();

    const { rows: ownTrades } = await db.query(ownTradesQuery);

    if (ownTrades.length === 0)
      return interaction.editReply({
        content: "You do not have any active trades.",
      });

    let ownTradesStrings = ownTrades.map(
      (e: any) =>
        `[[Link]](${e.msg_link}) | <@${
          e.owner_id === interaction.user.id ? e.target_id : e.owner_id
        }>`
    );

    let totalTrades = `Total: ${ownTrades.length}`;
    let pg = new Paginator();
    pg.listToEmbeds(ownTradesStrings, totalTrades, {
      color: "Blue",
      title: `${interaction.user.username}'s Active Trades`,
    });
    return pg.paginate({ client, interaction } as PaginationOption);
  },
};
