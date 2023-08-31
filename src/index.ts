import Discord, { Awaitable, Events } from "discord.js";
import { Routes } from "discord-api-types/v10";
import Inventory from "./Classes/Inventory.js";
// import helper from "./ext/helper/helper.js";
import Integer from "./Classes/Integer.js";
import { REST } from "@discordjs/rest";
import Item from "./Classes/Item.js";
import decompress from "decompress";
import * as dotenv from "dotenv";
import cron from "node-cron";
import path from "node:path";
import axios from "axios";
import fs from "node:fs";
import {
  Client,
  Interaction,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
} from "discord.js";
dotenv.config();

declare module "discord.js" {
  export interface Client {
    commands: Collection<any, any>;
    buttons: Collection<any, any>;
    modals: Collection<any, any>;
    ctxCommands: Collection<any, any>;
  }
}
const version = "0.0.1";

const client = new Client({
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const db = require("better-sqlite3")("./data/data.db");
db.pragma("journal_mode = WAL");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

//slash commands
const commands: any[] = [];
client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

console.log(commandFiles);

for (const file of commandFiles) {
  const command = require(`./src/commands/${file}`);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}

// buttons
client.buttons = new Collection();
const buttonFiles = fs
  .readdirSync("./src/buttons")
  .filter((file) => file.endsWith(".js"));

for (const file of buttonFiles) {
  const button = require(`./src/buttons/${file}`);
  client.buttons.set(button.customId, button);
}

// ctx commands
const ctxCommands: any[] = [];
client.ctxCommands = new Collection();
const ctxCmdFiles = fs
  .readdirSync("./src/contextCommands")
  .filter((file) => file.endsWith(".js"));

for (const file of ctxCmdFiles) {
  const contextCommand = require(`./src/contextCommands/${file}`);
  ctxCommands.push(contextCommand.data.toJSON());
  client.ctxCommands.set(contextCommand.data.name, contextCommand);
}

// modals
client.modals = new Collection();
const modalFiles = fs
  .readdirSync("./src/modals")
  .filter((file) => file.endsWith(".js"));

for (const file of modalFiles) {
  const modal = require(`./src/modals/${file}`);
  client.modals.set(modal.modalId, modal);
}

const rest = new REST({ version: "10" }).setToken(TOKEN as string);

// client.on(Events., () => {
client.user?.setPresence({
  activities: [{ name: `with his enemies`, type: ActivityType.Playing }],
});

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID as string, GUILD_ID as string),
      {
        body: [...commands, ...ctxCommands],
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
  console.log(`v.${version} - Online`);
})();
// });

client.on(
  Events.InteractionCreate,
  async (interaction: Interaction): Promise<void> => {
    if (interaction.isCommand() && !interaction.isContextMenuCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        command
          .execute({ interaction, Discord, client, version, /*helper,*/ db })
          .catch(console.log);
      } catch (err) {
        console.log(err);
      }
    }
  }
);

client.on("messageCreate", (message) => {
  console.log(message);
});

client.login(TOKEN);
