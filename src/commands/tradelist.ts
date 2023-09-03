import { Command } from "./ICommand";
import { Client, CommandInteraction } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import fs from "node:fs";
import Paginator from "../Classes/Paginator";
import { PaginationOption } from "../types/PaginationOption";

export const tradelist: Command = {
  name: "tradelist",
  description: "Open a new trade with another player",
  options: [
    {
      name: "user",
      type: CommandOptions.USER,
      description: "The user to trade with",
      required: true,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    let allTrades = JSON.parse(fs.readFileSync("./data/trades.json", "utf-8"));
    let ownTrades = allTrades.filter(
      (e: any) => e.owner.id === interaction.user.id || e.target.id === interaction.user.id
    );
    if (ownTrades.length === 0)
      return interaction.reply({
        content: "You do not have any active trades.",
        ephemeral: true,
      });

    let ownTradesStrings = ownTrades.map(
      (e: any) =>
        `[[Link]](${e.msg.link}) | <@${
          e.owner.id === interaction.user.id ? e.target.id : e.owner.id
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
