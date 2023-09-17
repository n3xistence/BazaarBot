import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  Client,
  ButtonInteraction,
} from "discord.js";
import fs from "node:fs";

export const open_trade_modal: any = {
  customId: "open_trade_modal",
  async execute(client: Client, interaction: ButtonInteraction) {
    let allTrades = JSON.parse(fs.readFileSync("./data/trades.json", "utf-8"));
    let tradeActive = allTrades.find((e: any) => e.msg.id === interaction.message.id);
    let isPartOfTrade = [tradeActive.owner.id, tradeActive.target.id].includes(interaction.user.id);
    if (!isPartOfTrade) return interaction.deferUpdate();

    const componentOne = new TextInputBuilder()
      .setCustomId("set_trade_items")
      .setLabel("Set Items")
      .setPlaceholder("bz01, bz0N, bp01, bz0I")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    const componentTwo = new TextInputBuilder()
      .setCustomId("add_trade_items")
      .setLabel("Add Items")
      .setPlaceholder("bz01, bz0N, bp01, bz0I")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const componentThree = new TextInputBuilder()
      .setCustomId("remove_trade_items")
      .setLabel("Remove Items")
      .setPlaceholder("bz01, bz0N, bp01, bz0I")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const actionRowOne = new ActionRowBuilder().addComponents(componentOne);
    const actionRowTwo = new ActionRowBuilder().addComponents(componentTwo);
    const actionRowThree = new ActionRowBuilder().addComponents(componentThree);

    const modal = new ModalBuilder()
      .setCustomId("change_trade")
      .setTitle("Change Trade Items")
      .addComponents(actionRowOne, actionRowTwo, actionRowThree as any);

    return interaction.showModal(modal);
  },
};
