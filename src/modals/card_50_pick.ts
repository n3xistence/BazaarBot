import { Client, EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import * as helper from "../ext/Helper";
import { ModalInteraction } from "./IModalInteraction";
import fs from "node:fs";
import Item from "../Classes/Item";
import Pack from "../Classes/Pack";

export const card_50_pick: ModalInteraction = {
  modalId: "card_50_pick",
  async execute(client: Client, interaction: ModalSubmitInteraction) {
    const cardCode = interaction.fields.getTextInputValue("picked_card");

    const droppool = JSON.parse(fs.readFileSync("./data/droppool.json", "utf-8"));
    const inv = helper.getInventoryAsObject(interaction.user.id);
    const balthazar = [...inv.getActiveItems(), ...inv.getItems()].find((e) => e.id === 50);
    if (!balthazar)
      return interaction.reply({
        content: `You do not own the card \`Balthazar\``,
        ephemeral: true,
      });

    let card: any = [...inv.getActiveItems(), ...inv.getItems()].find((e) => e.code === cardCode);
    if (!card) {
      for (const pack of droppool) {
        const item = pack.find((e: Pack) => e.code === cardCode);
        if (!item) continue;

        return interaction.reply({
          content: `You do not own the card \`${item.name}\` with the code \`${item.code}\`.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `There is no card with the code \`${cardCode}\`.`,
        ephemeral: true,
      });
    }

    if (typeof card.cardType !== "string" && !card.cardType.cooldown)
      return interaction.reply({
        content: `\`${card.name}\` is not a cooldown based card.`,
        ephemeral: true,
      });

    if (typeof card.cardType !== "string" && card.cardType.cooldown.current === 0)
      return interaction.reply({
        content: `\`${card.name}\` is not on cooldown and cannot be reduced.`,
        ephemeral: true,
      });

    card = new Item(card);
    for (let i = 0; i < 3; i++) {
      card.turn();
    }

    balthazar.use();
    helper.updateInventoryRef(inv, interaction.user);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `${helper.emoteApprove} ${helper.separator} Successfully used card \`${
              balthazar.name
            }\`.\n${helper.emoteBlank} ${helper.separator} You reduced \`${
              card.name
            }\`'s cooldown by 3 turns.\n${helper.emoteBlank} ${
              helper.separator
            } It is on cooldown for ${card.cardType.cooldown.current} more ${
              card.cardType.cooldown.current === 1 ? "turn" : "turns"
            }.`
          ),
      ],
    });
  },
};
