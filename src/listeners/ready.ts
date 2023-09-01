import { Client } from "discord.js";
import { Commands } from "../commands/Commands";
const { version, name } = require("../../package.json");

const wrapInColor = (color: string, str: string) => {
  const resetColor = "\x1b[0m";

  let clr;
  switch (color) {
    case "blue":
      clr = "\x1b[94m";
      break;
    case "green":
      clr = "\x1b[32m";
      break;
    default:
      clr = "\x1b[0m";
      break;
  }
  return `${clr}${str}${resetColor}`;
};

export default (client: Client): void => {
  client.on("ready", async () => {
    if (!client.user || !client.application) return;

    console.log(`╞ ${wrapInColor("blue", "[/]")} Started refreshing application commands.`);

    await client.application.commands.set(Commands);

    console.log(`╞ ${wrapInColor("blue", "[/]")} Successfully reloaded application commands.`);

    console.log(`└ ${wrapInColor("green", "[✓]")} ${name} : v.${version} - Online`);
  });
};
