import {
  CommandInteraction,
  Client,
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Commands } from "../commands/Commands";
import { ButtonCommands } from "../buttons/ButtonCommands";
import { Modals } from "../modals/Modals";
import Logger from "../ext/Logger";

export default (client: Client): void => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    switch (true) {
      case interaction.isCommand():
        console.log("is command");
        break;
      case interaction.isButton():
        console.log("is button");
        break;
      case interaction.isModalSubmit():
        console.log("is modal");
        break;
      default:
        console.log("is neither");
        break;
    }

    if (interaction.isCommand()) {
      Logger.log(
        "info",
        `/${interaction.commandName} - ${interaction.user.username} (${interaction.user.id})`
      );

      await handleSlashCommand(client, interaction);
    }

    if (interaction.isButton()) {
      Logger.log(
        "info",
        `[${interaction.customId}] - ${interaction.user.username} (${interaction.user.id})`
      );

      await handleButtonCommand(client, interaction);
    }

    if (interaction.isModalSubmit()) {
      Logger.log(
        "info",
        `{${interaction.customId}} - ${interaction.user.username} (${interaction.user.id})`
      );

      await handleModalSubmit(client, interaction);
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

const handleButtonCommand = async (
  client: Client,
  interaction: ButtonInteraction
): Promise<any> => {
  const buttonCommand = ButtonCommands.find((c) => c.customId === interaction.customId);
  if (!buttonCommand) return;

  buttonCommand.execute(client, interaction);
};

const handleModalSubmit = async (
  client: Client,
  interaction: ModalSubmitInteraction
): Promise<any> => {
  const modal = Modals.find((c) => c.modalId === interaction.customId);
  console.log(modal);
  if (!modal) return;

  modal.execute(client, interaction);
};
