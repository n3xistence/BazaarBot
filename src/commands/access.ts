import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import AccessValidator from "../Classes/AccessValidator";
import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import * as Database from "../Database";
import { ACCESS_LEVEL } from "../enums/AccessLevel";
import * as helper from "../ext/Helper";

const getKeyByValue = (object: { [key: string]: any }, value: number) => {
  return Object.entries(object).find(([_, val]) => val === value)?.[0];
};

export const access: Command = {
  name: "access",
  description: "Edit a user's Access Level",
  options: [
    {
      name: "grant",
      type: CommandOptions.SUB_COMMAND,
      description: "Grant Access to a User",
      options: [
        {
          name: "level",
          type: CommandOptions.STRING,
          description: "Access Level",
          required: true,
        },
        {
          name: "user",
          type: CommandOptions.USER,
          description: "The User to grant access to",
          required: true,
        },
      ],
    },
    {
      name: "revoke",
      type: CommandOptions.SUB_COMMAND,
      description: "Revoke Access from a User",
      options: [
        {
          name: "level",
          type: CommandOptions.STRING,
          description: "Access Level",
          required: true,
        },
        {
          name: "user",
          type: CommandOptions.USER,
          description: "The User to revoke access from",
          required: true,
        },
      ],
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.member) return;

    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return interaction.reply({
        content: "Invalid Authorisation.",
        ephemeral: true,
      });

    const user = interaction.options.getUser("user");
    if (!user)
      return interaction.reply({
        content: "Please mention a valid user.",
        ephemeral: true,
      });

    const subCommand: string = interaction.options.getSubcommand();
    const level = interaction.options.getString("level")?.toUpperCase();
    if (!level)
      return interaction.reply({
        content: "You must specify a valid Access Level",
        ephemeral: true,
      });

    const accessLevel = ACCESS_LEVEL[level];
    if (!accessLevel)
      return interaction.reply({
        content: `${level} is not a valid Access Level.`,
        ephemeral: true,
      });

    if (subCommand === "grant") {
      db.query(`INSERT INTO accesslevel VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET level=$2`, [
        user.id,
        accessLevel,
      ]);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `${helper.emoteApprove} ${
                helper.separator
              } Successfully set Access Level to \`${getKeyByValue(
                ACCESS_LEVEL,
                accessLevel
              )}\` for ${user}`
            ),
        ],
      });
    }
    if (subCommand === "revoke") {
      const res = await db
        .query(`SELECT * FROM access_level($1,$2);`, [user.id, accessLevel])
        .catch((_) => ({ rows: [] }));

      if (res.rows.length > 0 && res.rows[0].access_level >= 0)
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                `${helper.emoteDeny} ${helper.separator} Could not revoke \`${getKeyByValue(
                  ACCESS_LEVEL,
                  accessLevel
                )}\` privileges from ${user}.\n${helper.emoteBlank} ${
                  helper.separator
                } They currently have \`${getKeyByValue(
                  ACCESS_LEVEL,
                  res.rows[0].access_level
                )}\` privileges.`
              ),
          ],
        });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `${helper.emoteApprove} ${helper.separator} Successfully revoked \`${getKeyByValue(
                ACCESS_LEVEL,
                accessLevel
              )}\` privileges from ${user}`
            ),
        ],
      });
    }
  },
};
