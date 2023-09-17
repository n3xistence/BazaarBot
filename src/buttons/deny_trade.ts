import {
  ButtonInteraction,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import fs from "fs";
import * as helper from "../ext/Helper";

export const deny_trade: any = {
  customId: "deny_trade",
  async execute(client: Client, interaction: ButtonInteraction) {
    let allTrades = JSON.parse(fs.readFileSync("./data/trades.json", "utf-8"));
    let tradeIndex = allTrades.findIndex((e: any) => e.msg.id === interaction.message.id);
    const activeTrade = allTrades[tradeIndex];
    if (![activeTrade.owner.id, activeTrade.target.id].includes(interaction.user.id))
      return interaction.deferUpdate();

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
        let allTrades = JSON.parse(fs.readFileSync("./data/trades.json", "utf-8"));
        let tradeIndex = allTrades.findIndex((e: any) => e.msg.id === interaction.message.id);
        const activeTrade = allTrades[tradeIndex];
        allTrades.splice(tradeIndex, 1);

        let isOwner = activeTrade.owner.id === interaction.user.id;

        fs.writeFileSync("./data/trades.json", JSON.stringify(allTrades, null, "\t"));

        let msg = await interaction.channel?.messages.fetch(activeTrade.msg.id);
        await msg?.delete();

        interaction.deleteReply();
        interaction.channel?.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                `[${helper.emoteDeny}] ${interaction.user} has just cancelled the trade with <@${
                  activeTrade[!isOwner ? "owner" : "target"].id
                }>`
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
