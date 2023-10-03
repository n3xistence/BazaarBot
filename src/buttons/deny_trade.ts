import {
  ButtonInteraction,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import fs from "fs";
import * as Database from "../Database";
import * as helper from "../ext/Helper";

export const deny_trade: any = {
  customId: "deny_trade",
  async execute(client: Client, interaction: ButtonInteraction) {
    const ownTradesQuery: string =
      /*sql*/
      `
      SELECT 
        dp.code, dp.name, tr.msg_link, 
        tr.owner_id, tr.target_id, 
        td.user_id, td.item_type, 
        td.item_id, td.amount,
        tr.owner_accepted,
        tr.target_accepted,
        tr.id
      FROM trade tr
      LEFT JOIN trade_details td ON td.trade_id = tr.id 
      LEFT JOIN droppool dp ON td.item_id = dp.cid
      WHERE tr.msg_id=\'${interaction.message.id}\'
    `;
    const db = Database.init();

    let { rows: activeTrade } = await db.query(ownTradesQuery);
    if (activeTrade.length === 0) return interaction.deferUpdate();

    const owner = await client.users.fetch(activeTrade[0].owner_id);
    const target = await client.users.fetch(activeTrade[0].target_id);

    if (![owner.id, target.id].includes(interaction.user.id)) return interaction.deferUpdate();

    const { id: tradeID } = activeTrade[0];

    let verifyEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription("Are you sure you would like to cancel this trade?");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setStyle(ButtonStyle.Success)
        .setEmoji("<:BB_Check:1031690264089202698>"),
      new ButtonBuilder()
        .setCustomId("deny")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("<:BB_Cross:1031690265334911086>")
    );

    await interaction.reply({
      embeds: [verifyEmbed],
      components: [row as any],
      ephemeral: true,
    });

    const listener: unknown = async (int: any) => {
      if (int.customId === "verify") {
        db.query(
          /* SQL */
          `
            DELETE FROM trade 
            WHERE id=${tradeID}
          `
        );
        db.query(
          /* SQL */
          `
            DELETE FROM trade_details 
            WHERE trade_id=${tradeID}
          `
        );

        await interaction.message.delete().catch(() => {});

        interaction.deleteReply();
        interaction.channel?.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                `[${helper.emoteDeny}] ${interaction.user} has just cancelled the trade with <@${target.id}>`
              ),
          ],
        });

        return client.off("interactionCreate", listener as any);
      }

      if (int.customId === "deny") {
        int.reply({
          content: "The trade has not been cancelled.",
          ephemeral: true,
        });
        interaction.deleteReply();

        return client.off("interactionCreate", listener as any);
      }
    };

    client.on("interactionCreate", listener as any);
  },
};
