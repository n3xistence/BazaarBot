import { AttachmentBuilder, Client, CommandInteraction, EmbedBuilder } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import * as helper from "../ext/Helper";
import { Command } from "./ICommand";
import Pack from "../Classes/Pack";
import fs from "node:fs";
import * as Database from "../Database";
import AccessValidator from "../Classes/AccessValidator";

const findInDroppool = (droppool: Pack[], cardCode: string) => {
  for (const pack of droppool) {
    let item = pack.items.find((e) => e.code === cardCode);
    if (item) return item;
  }

  return;
};

export const give: Command = {
  name: "give",
  ephemeral: false,
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

    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return interaction.editReply({
        content: "Invalid Authorisation.",
      });

    const droppool = await helper.fetchDroppool();

    let cardCode = interaction.options.getString("code");
    let targetUser = interaction.options.getUser("user");
    let amount = interaction.options.getNumber("amount") ?? 1;
    if (!targetUser)
      return interaction.editReply({
        content: "Please mention a valid user.",
      });
    if (targetUser.bot)
      return interaction.editReply({
        content: "This user is a bot. Please do not send any cards to offshore accounts.",
      });

    if (amount === 0)
      return interaction.editReply({
        content: "Amount must not be zero.",
      });

    let inv = await helper.fetchInventory(targetUser.id);

    const card = findInDroppool(droppool, cardCode ?? "");
    if (!card)
      return interaction.editReply({
        content: `There is no Card with the code \`${cardCode}\`.`,
      });

    card.amount = amount;
    if (amount > 0) inv.addItem(card);
    else inv.removeItem(card, Math.abs(amount));
    helper.updateInventoryRef(inv);

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
