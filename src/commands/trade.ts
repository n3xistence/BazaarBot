import { Command } from "./ICommand";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import * as Database from "../Database";
import * as helper from "../ext/Helper";
import CommandOptions from "../enums/CommandOptions";

const getConfirmationButtons = () => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("accept_trade")
      .setStyle(ButtonStyle.Success)
      .setLabel("Accept"),
    new ButtonBuilder().setCustomId("deny_trade").setStyle(ButtonStyle.Danger).setLabel("Deny"),
    new ButtonBuilder()
      .setCustomId("open_trade_modal")
      .setStyle(ButtonStyle.Primary)
      .setLabel("Change Items")
  );
};

export const trade: Command = {
  name: "trade",
  ephemeral: false,
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
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild || !interaction.channel) return;

    return interaction.editReply({
      content: `The trade feature is currently unavailable.`,
    });

    // let inv = await helper.fetchInventory(interaction.user.id);
    // let hasPermission = [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.id === 27);
    // if (!hasPermission)
    //   return interaction.editReply({
    //     content: "You can only start trades when you own the card `Trade Pass`.",
    //   });

    // const targetUser = interaction.options.getUser("user");
    // if (!targetUser || targetUser.id === interaction.user.id)
    //   return interaction.editReply({
    //     content: `Please mention a valid user`,
    //   });

    // const row: any = getConfirmationButtons();
    // let embed = new EmbedBuilder()
    //   .setTitle("Trade Offer")
    //   .setColor("Blue")
    //   .addFields(
    //     {
    //       name: `${interaction.user.username}:`,
    //       value: `No Items Added`,
    //       inline: true,
    //     },
    //     {
    //       name: `${targetUser.username}:`,
    //       value: `No Items Added`,
    //       inline: true,
    //     }
    //   );

    // const ownTradesQuery: string =
    //   /*sql*/
    //   `SELECT tr.msg_link, tr.owner_id, tr.target_id
    //     FROM trade tr
    //     LEFT JOIN trade_details td
    //     ON td.trade_id = tr.id
    //     WHERE tr.owner_id in (\'${interaction.user.id}\', \'${targetUser.id}\')
    //     AND tr.target_id in (\'${interaction.user.id}\', \'${targetUser.id}\')
    //   `;

    // const db = Database.init();

    // const { rows: tradeActive } = await db.query(ownTradesQuery);

    // if (tradeActive.length > 0)
    //   return interaction.editReply({
    //     embeds: [
    //       new EmbedBuilder()
    //         .setTitle("Trade Error")
    //         .setColor("Red")
    //         .setDescription(
    //           `You already have a pending trade with ${targetUser} [here](${tradeActive[0].msg_link}).`
    //         ),
    //     ],
    //   });

    // let msg = await interaction.editReply({
    //   embeds: [embed],
    //   components: [row],
    //   fetchReply: true,
    // });

    // let tradeData = {
    //   owner: {
    //     id: interaction.user.id,
    //     name: interaction.user.username,
    //     accepted: false,
    //     items: [],
    //   },
    //   target: {
    //     id: targetUser.id,
    //     name: targetUser.username,
    //     accepted: false,
    //     items: [],
    //   },
    //   timestamp: helper.getUNIXStamp(),
    //   msg: {
    //     id: msg.id,
    //     link: `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${msg.id}`,
    //   },
    // };

    // const insertTrade =
    //   /* sql */
    //   `
    //     INSERT INTO trade (owner_id, target_id, timestamp, msg_id, msg_link)
    //     VALUES(
    //       \'${interaction.user.id}\',
    //       \'${targetUser.id}\',
    //       ${helper.getUNIXStamp()},
    //       \'${tradeData.msg.id}\',
    //       \'${tradeData.msg.link}\'
    //     )
    //   `;

    // db.query(insertTrade);
  },
};
