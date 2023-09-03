import { Client, GatewayIntentBits, Partials } from "discord.js";
import { ready, interactionCreate, messageCreate } from "./listeners";

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

declare global {
  interface Number {
    mod: (n: number) => {};
  }
}
Number.prototype.mod = function (n: number) {
  return (((this as number) % n) + n) % n;
};

/**
 * Discord Events
 */
ready(client);
interactionCreate(client);
messageCreate(client);

/**
 * Cron Jobs
 */
// TODO

/**
 * LOGIN
 */
client.login(TOKEN);
