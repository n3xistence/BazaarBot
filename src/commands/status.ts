import { Command } from "./ICommand";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";
import CommandOptions from "../enums/CommandOptions";
import Paginator from "../Classes/Paginator";
import { PaginationOption } from "../types/PaginationOption";

export const status: Command = {
  name: "status",
  ephemeral: false,
  description: "Shows your active cards",
  options: [
    {
      name: "showpassive",
      type: CommandOptions.BOOLEAN,
      description: "Whether to show passive cards or not",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    let showPassive = interaction.options.getBoolean("showpassive") ?? false;

    const inv = await helper.fetchInventory(interaction.user.id);
    const activeItems = inv.getActiveItems().filter((e) => showPassive || e.cardType !== "passive");

    let stringifiedItems = activeItems.map((item) => {
      let rarity = { emote: "" };
      switch (item.rarity.toLowerCase()) {
        case "celestial":
          rarity.emote = helper.emoteCelestial;
          break;
        case "legendary":
          rarity.emote = helper.emoteLegendary;
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

      return `${rarity.emote} [${item.code}] · \`${item.name}\` ${effectIcon}`;
    });

    const paginator = new Paginator();
    paginator.listToEmbeds(stringifiedItems, null, {
      color: "Green",
      title: `${interaction.user.username}'s Active Items`,
    });
    return paginator.paginate({ client, interaction } as PaginationOption);
  },
};
