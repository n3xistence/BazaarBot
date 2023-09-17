import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";

export const send: Command = {
  name: "send",
  description: "Send cards to another user",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The Code of the pack",
      required: true,
    },
    {
      name: "user",
      type: CommandOptions.USER,
      description: "The user to send the card to",
      required: true,
    },
    {
      name: "amount",
      type: CommandOptions.NUMBER,
      description: "The amount of duplicates to send",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    let cardCode = interaction.options.getString("code");
    let targetUser = interaction.options.getUser("user");
    let amount = interaction.options.getNumber("amount") ?? 1;
    if (amount <= 0)
      return interaction.reply({
        content: "Please provide a valid amount.",
        ephemeral: true,
      });

    if (!targetUser)
      return interaction.reply({
        content: "Please mention a valid user.",
        ephemeral: true,
      });
    if (targetUser.bot)
      return interaction.reply({
        content: "This user is a bot. Please do not send your cards to offshore accounts.",
        ephemeral: true,
      });

    let inv = helper.getInventoryAsObject(interaction.user.id);
    let targetInv = helper.getInventoryAsObject(targetUser.id);

    let hasPermission = [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.id === 21);
    if (!hasPermission)
      return interaction.reply({
        content: "You can only send cards to other users when you own the card `Player Market`.",
        ephemeral: true,
      });

    let itemToSend = inv.getActiveItems().find((e) => e.code === cardCode);
    if (itemToSend && itemToSend.cardType !== "passive")
      return interaction.reply({
        content: "You can only send cards from your inventory. Please unequip your card.",
        ephemeral: true,
      });

    let card = [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.code === cardCode);
    if (!card)
      return interaction.reply({
        content: "You do not own this card.",
        ephemeral: true,
      });
    if (card.id === 21)
      return interaction.reply({
        content: "This card cannot be sent.",
        ephemeral: true,
      });

    inv.removeItem(card);
    helper.updateInventoryRef(inv, interaction.user);

    card.amount = amount;
    targetInv.addItem(card);
    helper.updateInventoryRef(targetInv, targetUser);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Card Sent")
          .setColor("Green")
          .setDescription(`Successfully sent ${amount}x \`${card.name}\` to ${targetUser}.`),
      ],
    });
  },
};
