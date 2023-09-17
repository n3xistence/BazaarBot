import { AttachmentBuilder, Client, CommandInteraction, EmbedBuilder } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import * as helper from "../ext/Helper";
import { Command } from "./ICommand";
import Pack from "../Classes/Pack";
import fs from "node:fs";

const findInDroppool = (droppool: Pack[], cardCode: string) => {
  for (const pack of droppool) {
    let item = pack.items.find((e) => e.code === cardCode);
    if (item) return item;
  }

  return;
};

export const give: Command = {
  name: "give",
  description: "Give a card to a user",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The Code of the card",
      required: true,
    },
    {
      name: "user",
      type: CommandOptions.USER,
      description: "The Target Player",
      required: true,
    },
    {
      name: "amount",
      type: CommandOptions.NUMBER,
      description: "The amount (defaults to 1)",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.member) return;

    let hasperms = (interaction.member.permissions as any).has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
        ephemeral: true,
      });

    const droppool = JSON.parse(fs.readFileSync("./data/droppool.json", "utf-8"));

    let cardCode = interaction.options.getString("code");
    let targetUser = interaction.options.getUser("user");
    let amount = interaction.options.getNumber("amount") ?? 1;
    if (!targetUser)
      return interaction.reply({
        content: "Please mention a valid user.",
        ephemeral: true,
      });
    if (targetUser.bot)
      return interaction.reply({
        content: "This user is a bot. Please do not send any cards to offshore accounts.",
        ephemeral: true,
      });

    if (amount === 0)
      return interaction.reply({
        content: "Amount must not be zero.",
        ephemeral: true,
      });

    let inv = helper.getInventoryAsObject(targetUser.id);

    const card = findInDroppool(droppool, cardCode ?? "");
    if (!card)
      return interaction.reply({
        content: `There is no Card with the code \`${cardCode}\`.`,
        ephemeral: true,
      });

    await interaction.deferReply();

    card.amount = amount;
    if (amount > 0) inv.addItem(card);
    else inv.removeItem(card, Math.abs(amount));
    helper.updateInventoryRef(inv, targetUser);

    const file = fs.existsSync(`./data/cards/${card.code}.png`)
      ? new AttachmentBuilder(`./data/cards/${card.code}.png`)
      : new AttachmentBuilder(`./data/cards/template.png`);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `${helper.emoteApprove} ${helper.separator} Successfully added ${amount}x \`${card.name}\` to ${targetUser}'s inventory.`
          )
          .setImage(
            `attachment://${
              fs.existsSync(`./data/cards/${card.code}.png`) ? card.code : "template"
            }.png`
          ),
      ],
      files: [file],
    });
  },
};
