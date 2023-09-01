import { CommandInteraction, Client, Interaction } from "discord.js";
import { Commands } from "../commands/Commands";
import { CommandOptions } from "../types";

export default (client: Client): void => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isCommand()) {
      await handleSlashCommand(client, interaction as CommandInteraction);
    }
  });
};

const handleSlashCommand = async (
  client: Client,
  interaction: CommandInteraction
): Promise<any> => {
  const slashCommand = Commands.find((c) => c.name === interaction.commandName);
  if (!slashCommand)
    return interaction.followUp({ content: "An error has occurred" });

  slashCommand.execute(client, interaction as CommandInteraction);
};
