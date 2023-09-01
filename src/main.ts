// import decompress from "decompress";
// import cron from "node-cron";
// import path from "node:path";
// import axios from "axios";
// import fs from "node:fs";

import { Client, GatewayIntentBits, Partials } from "discord.js";
import { ready, interactionCreate } from "./listeners";

import * as dotenv from "dotenv";
dotenv.config();

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

const TOKEN = process.env.TOKEN;

ready(client);

interactionCreate(client);

client.login(TOKEN);
