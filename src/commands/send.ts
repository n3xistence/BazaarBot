import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";

export const send: Command = {
  name: "send",
  ephemeral: false,
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
      return interaction.editReply({
        content: "Please provide a valid amount.",
      });

    if (!targetUser)
      return interaction.editReply({
        content: "Please mention a valid user.",
      });
    if (targetUser.bot)
      return interaction.editReply({
        content: "This user is a bot. Please do not send your cards to offshore accounts.",
      });

    let inv = await helper.fetchInventory(interaction.user.id);
    let targetInv = await helper.fetchInventory(targetUser.id);

    let hasPermission = [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.id === 21);
    if (!hasPermission)
      return interaction.editReply({
        content: "You can only send cards to other users when you own the card `Player Market`.",
      });

    let itemToSend = inv.getActiveItems().find((e) => e.code === cardCode);
    if (itemToSend && itemToSend.cardType !== "passive")
      return interaction.editReply({
        content: "You can only send cards from your inventory. Please unequip your card.",
      });

    let card = [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.code === cardCode);
    if (!card)
      return interaction.editReply({
        content: "You do not own this card.",
      });
    if (card.id === 21)
      return interaction.editReply({
        content: "This card cannot be sent.",
      });

    inv.removeItem(card);
    helper.updateInventoryRef(inv);

    card.amount = amount;
    targetInv.addItem(card);
    helper.updateInventoryRef(targetInv);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Card Sent")
          .setColor("Green")
          .setDescription(`Successfully sent ${amount}x \`${card.name}\` to ${targetUser}.`),
      ],
    });
  },
};
