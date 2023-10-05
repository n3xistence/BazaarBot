import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import * as Database from "../Database";
import * as helper from "../ext/Helper";
import AccessValidator from "../Classes/AccessValidator";

export const pay: Command = {
  name: "pay",
  ephemeral: false,
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

    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return interaction.editReply({
        content: "Invalid Authorisation.",
      });

    let targetUser = interaction.options.getUser("user");
    let currency = {
      type: interaction.options.getString("currency"),
      amount: interaction.options.getNumber("amount"),
    };

    if (!targetUser)
      return interaction.editReply({
        content: "Please mention a valid user.",
      });
    if (!currency.type || !["gems", "scrap", "gold"].includes(currency.type))
      return interaction.editReply({
        content: "Please supply a valid currency.",
      });
    if (targetUser.bot)
      return interaction.editReply({
        content: "This user is a bot. Please do not send any money to offshore accounts.",
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

    return interaction.editReply({
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
