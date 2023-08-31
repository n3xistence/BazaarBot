import CommandOptions from "../types/CommandOptions";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("displays information about the server"),
  async execute({ interaction, version, db }: CommandOptions) {
    let link_data = db.prepare(`SELECT * FROM links`).all();
    let owner = await interaction.guild.fetchOwner();

    let created = Math.floor(
      new Date(interaction.guild.createdAt).getTime() / 1000
    );

    let sEmbed = new EmbedBuilder()
      .setColor("Blue")
      .setThumbnail(interaction.guild.iconURL())
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
          name: "**Linked Users**",
          value: `${link_data.length}`,
          inline: true,
        },
        {
          name: "**Created At**",
          value: `<t:${created}:R> (<t:${created}:d>)`,
          inline: true,
        },
        { name: "**Version**", value: `${version}`, inline: true }
      );
    interaction.reply({ embeds: [sEmbed] });
  },
};
