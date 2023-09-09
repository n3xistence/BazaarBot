import { Client, EmbedBuilder, Message } from "discord.js";
import { PrefixCommand } from "./IPrefixCommand";
import * as helper from "../ext/Helper";
import Item from "../Classes/Item";
import Pack from "../Classes/Pack";
import fs from "node:fs";
import axios from "axios";
import Logger from "../ext/Logger";

export const setitems: PrefixCommand = {
  name: "setitems",
  async execute(client: Client, message: Message) {
    if (!message.member) return;

    let hasperms = message.member.permissions.has("ManageGuild");
    if (!hasperms && message.author.id !== "189764769312407552") return;
    const inventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));

    const xlsx = require("read-excel-file/node");

    const attachment = message.attachments.first();

    if (!attachment || (!attachment.name.endsWith(".xlsx") && !attachment.name.endsWith(".xls")))
      return message.channel.send("You must provide a valid .xls or .xlsx file.");

    let res = await axios.get(attachment.url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data, "binary");
    const sheets = await xlsx(buffer, { getSheets: true });

    const packs: Array<Pack> = [];
    let totalItems: number = 0;
    let itemIDs: Array<number> = [];
    for (const sheet of sheets) {
      let rows = await xlsx(buffer, { sheet: sheet.name });

      const items: Array<Item> = [];

      const costs = rows.shift();
      const costTypes = costs[0].split(",").map((e: any) => e.trim());
      const costAmounts = `${costs[1]}`
        .replace(".", ",")
        .split(",")
        .map((e) => e.trim());
      const cost: any = {};
      for (let i = 0; i < costTypes.length; i++) {
        cost[costTypes[i]] = costAmounts[i];
      }

      const rar = rows.shift();
      const rarities = {
        common: rar[0],
        rare: rar[1],
        epic: rar[2],
        legendary: rar[3],
        celestial: rar[4],
      };

      const columnNames = rows.shift();
      const objs = rows.map((row: any) => {
        const obj: any = {};

        row.forEach((cell: string, i: number) => {
          obj[columnNames[i]] = cell;
        });

        return obj;
      });

      for (let obj of objs) {
        let cardActivity = obj.activity;
        if (cardActivity === "cooldown") {
          cardActivity = { cooldown: { max: obj.cooldown_max, current: 0 } };
        }

        const userContext: any = {
          category: obj.effect_category,
          type: obj.effect_type,
          modifier: obj.effect_modifier,
        };

        const splitUserContext = Object.keys(userContext).reduce((acc: any, key: any) => {
          acc[key] = `${userContext[key]}`.split(",");
          return acc;
        }, {});

        let effects = [];
        for (let i = 0; i < splitUserContext.category.length; i++) {
          let effect = {
            category: splitUserContext.category[i],
            type: splitUserContext.type[i],
            modifier: splitUserContext.modifier[i],
          };

          effects.push(effect);
        }

        let item = new Item({
          name: obj.name,
          id: obj.id,
          amount: 1,
          rarity: obj.rarity,
          cardType: cardActivity,
          description: obj.description,
          target: obj.target,
          usage: obj.usage,
          effects: effects,
        });

        helper.updateItemProperties(inventories, JSON.parse(JSON.stringify(item)), {
          global: true,
        });

        if (itemIDs.includes(item.id)) {
          message.delete();
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setTitle("Error Parsing Item List")
                .setColor("Red")
                .setDescription(
                  `Item IDs must be unique.\nItem \`${item.name}\` with id \`${item.id}\` is not unique.`
                ),
            ],
          });
        }

        itemIDs.push(item.id);
        items.push(item);
      }

      totalItems += items.length;
      const pack: Pack = {
        name: sheet.name,
        code: sheet.name.toLowerCase(),
        rarities: rarities,
        cost: cost,
        items: items,
      };
      packs.push(pack);
      helper.updatePackProperties(inventories, pack, { global: true });
    }

    fs.writeFileSync("./data/droppool.json", JSON.stringify(packs, null, "\t"));
    message.delete();
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("New Item List")
          .setColor("Green")
          .setDescription(
            `The Item List was successfully updated.\nIt now includes ${packs.length} packs for a total of ${totalItems} items.`
          ),
      ],
    });

    Logger.log("success", "Successfully updated card data.");
  },
};
