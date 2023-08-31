"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importStar(require("discord.js"));
const v10_1 = require("discord-api-types/v10");
const rest_1 = require("@discordjs/rest");
const dotenv = __importStar(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const discord_js_2 = require("discord.js");
dotenv.config();
const version = "0.0.1";
const client = new discord_js_2.Client({
    partials: [discord_js_2.Partials.Message, discord_js_2.Partials.Channel, discord_js_2.Partials.Reaction],
    intents: [
        discord_js_2.GatewayIntentBits.Guilds,
        discord_js_2.GatewayIntentBits.GuildMembers,
        discord_js_2.GatewayIntentBits.GuildMessages,
        discord_js_2.GatewayIntentBits.MessageContent,
        discord_js_2.GatewayIntentBits.GuildMessageReactions,
    ],
});
const db = require("better-sqlite3")("./data/data.db");
db.pragma("journal_mode = WAL");
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const foldersPath = node_path_1.default.join(__dirname, "commands");
const commandFolders = node_fs_1.default.readdirSync(foldersPath);
//slash commands
const commands = [];
// client.commands = new Collection();
// const commandFiles = fs
//   .readdirSync("./src/commands")
//   .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
// console.log(commandFiles);
// for (const file of commandFiles) {
//   const command = require(`./src/commands/${file}`);
//   commands.push(command.data.toJSON());
//   client.commands.set(command.data.name, command);
// }
for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = node_path_1.default.join(foldersPath, folder);
    const commandFiles = node_fs_1.default
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = node_path_1.default.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            commands.push(command.data.toJSON());
        }
        else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
// buttons
client.buttons = new discord_js_2.Collection();
const buttonFiles = node_fs_1.default
    .readdirSync("./src/buttons")
    .filter((file) => file.endsWith(".js"));
for (const file of buttonFiles) {
    const button = require(`./src/buttons/${file}`);
    client.buttons.set(button.customId, button);
}
// ctx commands
const ctxCommands = [];
client.ctxCommands = new discord_js_2.Collection();
const ctxCmdFiles = node_fs_1.default
    .readdirSync("./src/contextCommands")
    .filter((file) => file.endsWith(".js"));
for (const file of ctxCmdFiles) {
    const contextCommand = require(`./src/contextCommands/${file}`);
    ctxCommands.push(contextCommand.data.toJSON());
    client.ctxCommands.set(contextCommand.data.name, contextCommand);
}
// modals
client.modals = new discord_js_2.Collection();
const modalFiles = node_fs_1.default
    .readdirSync("./src/modals")
    .filter((file) => file.endsWith(".js"));
for (const file of modalFiles) {
    const modal = require(`./src/modals/${file}`);
    client.modals.set(modal.modalId, modal);
}
const rest = new rest_1.REST({ version: "10" }).setToken(TOKEN);
// client.on(Events., () => {
client.user?.setPresence({
    activities: [{ name: `with his enemies`, type: discord_js_2.ActivityType.Playing }],
});
(async () => {
    try {
        console.log("Started refreshing application (/) commands.");
        await rest.put(v10_1.Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: [...commands, ...ctxCommands],
        });
        console.log("Successfully reloaded application (/) commands.");
    }
    catch (error) {
        console.error(error);
    }
    console.log(`v.${version} - Online`);
})();
// });
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (interaction.isCommand() && !interaction.isContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command)
            return;
        try {
            command
                .execute({ interaction, Discord: discord_js_1.default, client, version, /*helper,*/ db })
                .catch(console.log);
        }
        catch (err) {
            console.log(err);
        }
    }
});
client.on("messageCreate", (message) => {
    console.log(message);
});
client.login(TOKEN);
