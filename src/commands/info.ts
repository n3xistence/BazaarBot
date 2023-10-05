import { Client, EmbedBuilder, CommandInteraction } from "discord.js";
import { Command } from "./ICommand";
const { version } = require("../../package.json");

export const info: Command = {
  name: "info",
  ephemeral: false,
  description: "Shows info",
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.guild)
      return interaction.editReply({
        content: "Invalid Request.",
      });

    let owner = await interaction.guild.fetchOwner();

    let created = Math.floor(new Date(interaction.guild.createdAt).getTime() / 1000);

    let sEmbed = new EmbedBuilder()
      .setColor("Blue")
      .setThumbnail(client.user?.avatarURL() as string)
      .setTitle(`${interaction.guild.name} Server Info`)
      .addFields(
        {
          name: "**Server Name**",
          value: `${interaction.guild.name}`,
          inline: true,
        },
        { name: "**Server Owner**", value: `${owner}`, inline: true },
        {
          name: "**Member Count**",
          value: `${interaction.guild.memberCount}`,
          inline: true,
        },
        {
          name: "**Created At**",
          value: `<t:${created}:R> (<t:${created}:d>)`,
          inline: true,
        },
        { name: "**Version**", value: `${version}`, inline: true }
      );
    interaction.editReply({ embeds: [sEmbed] });
  },
};
