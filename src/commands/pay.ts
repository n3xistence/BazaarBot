import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import * as Database from "../Database";
import * as helper from "../ext/Helper";

export const pay: Command = {
  name: "pay",
  description: "Add or remove currencies from a user",
  options: [
    {
      name: "currency",
      type: CommandOptions.STRING,
      description: "The type of currency",
      required: true,
    },
    {
      name: "user",
      type: CommandOptions.USER,
      description: "The user to pay",
      required: true,
    },
    {
      name: "amount",
      type: CommandOptions.NUMBER,
      description: "The amount",
      required: true,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.member) return;

    const db = Database.init();
    let hasperms = (interaction.member.permissions as any).has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
        ephemeral: true,
      });

    let targetUser = interaction.options.getUser("user");
    let currency = {
      type: interaction.options.getString("currency"),
      amount: interaction.options.getNumber("amount"),
    };

    if (!targetUser)
      return interaction.reply({
        content: "Please mention a valid user.",
        ephemeral: true,
      });
    if (!currency.type || !["gems", "scrap", "gold"].includes(currency.type))
      return interaction.reply({
        content: "Please supply a valid currency.",
        ephemeral: true,
      });
    if (targetUser.bot)
      return interaction.reply({
        content: "This user is a bot. Please do not send any money to offshore accounts.",
        ephemeral: true,
      });

    let entry: any = await db.query(`SELECT * FROM currency WHERE id=$1`, [targetUser.id]);
    if (entry.rows.length > 0) {
      let newCurrency = currency.amount + entry.rows[0][currency.type];
      db.query(`UPDATE currency SET ${currency.type}=$1 WHERE id=$2`, [newCurrency, targetUser.id]);
    } else {
      let pointObj: any = {
        points: 0,
        gold: 0,
        gems: 0,
        scrap: 0,
      };
      pointObj[currency.type] = currency.amount;

      db.query(`INSERT INTO currency VALUES($1,$2,$3,$4)`, [
        targetUser.id,
        pointObj.gold,
        pointObj.gems,
        pointObj.scrap,
      ]);
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `${helper.emoteApprove} ${helper.separator} Successfully added ${currency.amount} ${currency.type} to ${targetUser}.`
          ),
      ],
    });
  },
};
