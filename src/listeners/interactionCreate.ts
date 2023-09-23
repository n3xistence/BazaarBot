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
import * as Helper from "../ext/Helper";

let userCooldowns: Array<{ userId: string; stamp: number }> = [];
const COOLDOWN_LENGTH: number = 5_000; // ms

export default (client: Client): void => {
  client.on("interactionCreate", async (interaction: Interaction) => {
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

    const user = userCooldowns.find((e) => e.userId === interaction.user.id);
    if (!user)
      userCooldowns.push({ userId: interaction.user.id, stamp: Helper.getUNIXStamp(true) });
    else {
      const diff = Helper.getUNIXStamp(true) - user.stamp;

      if (diff < COOLDOWN_LENGTH)
        return interaction.reply({
          content: `You must wait another **${((COOLDOWN_LENGTH - diff) / 1000).toFixed(2)}s**`,
          ephemeral: true,
        });
    }

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
  if (!modal) return;

  modal.execute(client, interaction);
};

// dump the list every 5 minutes to reduce lookup overhead
setInterval(() => {
  userCooldowns = [];
}, 300_000);
