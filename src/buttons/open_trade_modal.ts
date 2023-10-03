import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  Client,
  ButtonInteraction,
} from "discord.js";
import * as Database from "../Database";

export const open_trade_modal: any = {
  customId: "open_trade_modal",
  async execute(client: Client, interaction: ButtonInteraction) {
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

    const { rows: tradeActive } = await db.query(ownTradesQuery);

    let isPartOfTrade =
      tradeActive.length > 0 &&
      [tradeActive[0].owner_id, tradeActive[0].target_id].includes(`${interaction.user.id}`);
    if (!isPartOfTrade) return interaction.deferUpdate();

    const componentOne = new TextInputBuilder()
      .setCustomId("add_trade_items")
      .setLabel("Add Items")
      .setPlaceholder("bz01, bz0N, bp01, bz0I")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const componentTwo = new TextInputBuilder()
      .setCustomId("remove_trade_items")
      .setLabel("Remove Items")
      .setPlaceholder("bz01, bz0N, bp01, bz0I")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const actionRowOne = new ActionRowBuilder().addComponents(componentOne);
    const actionRowTwo = new ActionRowBuilder().addComponents(componentTwo);

    const modal = new ModalBuilder()
      .setCustomId("change_trade")
      .setTitle("Change Trade Items")
      .addComponents(actionRowOne as any, actionRowTwo as any);

    return interaction.showModal(modal);
  },
};
