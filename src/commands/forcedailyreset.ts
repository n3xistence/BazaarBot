import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";
import { Command } from "./ICommand";
import Logger from "../ext/Logger";
import * as Database from "../Database";
import AccessValidator from "../Classes/AccessValidator";
import Inventory from "../Classes/Inventory";

export const forcedailyreset: Command = {
  name: "forcedailyreset",
  description: "Forces the daily reset",
  requiredLevel: "OWNER",
  async execute(client: Client, interaction: CommandInteraction) {
    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (
      accessEntry.length === 0 ||
      !new AccessValidator(accessEntry[0].level, this.requiredLevel as string).validate()
    )
      return interaction.reply({
        content: "Invalid Authorisation.",
        ephemeral: true,
      });

    try {
      let inventories = await helper.fetchAllInventories();

      for (let i = 0; i < inventories.length; i++) {
        let inv: Inventory = await helper.fetchInventory(inventories[i].userId as string);

        inv.moveTurn();

        helper.updateInventoryRef(inv);
      }

      Logger.log("success", `Updated Cooldown for ${inventories.length} users.`);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `${helper.emoteApprove} ${helper.separator} Successfully updated card cooldowns.`
            ),
        ],
        ephemeral: true,
      });
    } catch (e) {
      Logger.log("error", "Error updating Cooldown:");
      console.error(e);
    }
  },
};
