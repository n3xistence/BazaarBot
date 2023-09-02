import { CommandInteraction, Client, Interaction } from "discord.js";
import { Commands } from "../commands/Commands";
import Logger from "../ext/Logger";

export default (client: Client): void => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isCommand()) {
      Logger.log(
        "info",
        `/${interaction.commandName} - ${interaction.user.username} (${interaction.user.id})`
      );

      try {
        await handleSlashCommand(client, interaction);
      } catch (e) {
        Logger.log("error", `Error handling Command ${interaction.commandName}`);
        console.log(e);
      }
    }
  });
};

const handleSlashCommand = async (
  client: Client,
  interaction: CommandInteraction
): Promise<any> => {
  if (interaction.isChatInputCommand()) {
    const slashCommand = Commands.find((c) => c.name === interaction.commandName);
    if (!slashCommand)
      return interaction.reply({ content: "An error has occurred", ephemeral: true });

    slashCommand.execute(client, interaction);
  }
};
