import { Client, EmbedBuilder, Message } from "discord.js";
import { PrefixCommand } from "./IPrefixCommand";
import fs from "node:fs";
import axios from "axios";
import decompress from "decompress";
import Logger from "../ext/Logger";

export const setitems: PrefixCommand = {
  name: "setitems",
  async execute(client: Client, message: Message) {
    if (!message.member) return;

    let hasperms = message.member.permissions.has("ManageGuild");
    if (!hasperms && message.author.id !== "189764769312407552") return;

    const attachment = message.attachments.first();

    if (!attachment || !attachment.name.endsWith(".zip"))
      return message.channel.send("You must provide a valid .zip folder.");

    let res = await axios.get(attachment.url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);

    fs.writeFile(`./data/${attachment.name}`, buffer, async () => {
      const files = await decompress(`./data/${attachment.name}`, "./data/cards");

      fs.unlink(`./data/${attachment.name}`, (err) => {
        if (err) console.error(`Error deleting zip file ${attachment.name}: ${err}`);
      });

      message.delete();
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Card Sprites Updated")
            .setColor("Green")
            .setDescription(
              `The Item List was successfully updated.\n${files.length} cards were extracted from ${attachment.name}`
            ),
        ],
      });

      Logger.log("success", "Successfully updated card sprites.");
    });
  },
};
