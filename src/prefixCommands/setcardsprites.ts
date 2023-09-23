import { Client, EmbedBuilder, Message } from "discord.js";
import { PrefixCommand } from "./IPrefixCommand";
import fs from "node:fs";
import axios from "axios";
import decompress from "decompress";
import Logger from "../ext/Logger";
import * as Database from "../Database";
import AccessValidator from "../Classes/AccessValidator";

export const setcardsprites: PrefixCommand = {
  name: "setcardsprites",
  async execute(client: Client, message: Message) {
    if (!message.member) return;

    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      message.author.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return;

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
