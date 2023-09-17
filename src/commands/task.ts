import { Command } from "./ICommand";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import * as helper from "../ext/Helper";
import * as Database from "../Database";
import CommandOptions from "../enums/CommandOptions";

const curseText = (text: string) => {
  const cursedText = [
    "a̸̩̾́͌̀́͑̔ͅ",
    "b̷̯̌͝",
    "c̴̯̞̗̺̏̀̈͗̀̃́͛͝",
    "ḑ̶͓̮̺̱̰̹̳̹̺͊",
    "ë̷͙̝̗̟̹͈͕̞́̈̓",
    "f̸̪͇̠͖̯͊͐̓̚͝",
    "g̴̥̟̲̱̜̰̬̥̫̙̓̈̀̄̓̀̽̉͆",
    "h̴̡͖̩̬͕̗̻̜̾̉̽̉̎̔̚̕͝͝",
    "ĭ̵̡͔̪͍̯̻̍̓̄͋ͅ",
    "ĵ̵͚̲̞̪̕",
    "k̶̙̮͇̤͖̝̃́̍͛͘͠͝͠ͅ",
    "ḻ̷̨̃̚͝",
    "m̶̛̹̟̮̣̥̙͔̳̆̈́́̀̀͠",
    "n̵͇̮̅̽̽͝",
    "o̶̧̧̘̊̂̋̌̍͊̈͘",
    "p̴̟͆̈̇́̆̍͘̚",
    "q̸͓̜̖͈̗̪̱̍̚͜͠ͅ",
    "r̶̡̺̪̮̜͛̄̏̔́",
    "s̷̢̧͔͓̭͍̗͉̳̜̃͛̆̊͐͌̍",
    "ṫ̷̡̰̬̜͚͖̬̩̬̩",
    "u̴̲͖̅̓̎̓̐̓̕̚͠",
    "v̷̱͎̰̝͋̎͆̽̐͂̈́͋̚̕͜",
    "w̷̧̗̭͎̣͐͆̊̿̾",
    "x̶̨̣͖̻͇̉̒͛",
    "y̷̳͍͐̀̈͆̌̃͘͝͝",
    "z̶͈̜͎̭̩̜̺̔̃̈́̇͛͛",
    "",
  ];

  let cursed = "";
  for (const char of text) {
    if (/\s/.test(char)) cursed += " ";
    else cursed += helper.randomPick(cursedText);
  }

  return cursed;
};

export const task: Command = {
  name: "task",
  description: "Starts a new task",
  options: [
    {
      name: "rewardtype",
      type: CommandOptions.STRING,
      description: "gold/gems",
      required: true,
    },
    {
      name: "amount",
      type: CommandOptions.NUMBER,
      description: "The amount",
      required: true,
    },
    {
      name: "winners",
      type: CommandOptions.NUMBER,
      description: "The amount of winners",
      required: true,
    },
    {
      name: "description",
      type: CommandOptions.STRING,
      description: "Describe the task goal",
      required: true,
    },
    {
      name: "notes",
      type: CommandOptions.STRING,
      description: "Optional additional information",
      required: false,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.member) return;

    let hasperms = (interaction.member.permissions as any).has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
        ephemeral: true,
      });

    const db = Database.init();
    const currentTasks = await db.query(`SELECT * FROM Bazaar`);

    let activeTasks = await db.query(`SELECT * FROM Bazaar WHERE active='true'`);

    if (activeTasks.rows.length > 0)
      return interaction.reply({
        content: `There is already an active task.`,
        ephemeral: true,
      });

    const task = {
      active: true,
      id: currentTasks.rows.length + 1,
      type: interaction.options.getString("rewardtype")?.toLowerCase(),
      amount: interaction.options.getNumber("amount"),
      timestamp: helper.getUNIXStamp(),
      participants: JSON.stringify([]),
      winners: interaction.options.getNumber("winners"),
      chosenWinners: JSON.stringify([]),
      activeCards: JSON.stringify([]),
      description: interaction.options.getString("description"),
      notes: interaction.options.getString("notes") ?? "",
    };

    const validTypes = ["gold", "gems"];
    if (!validTypes.includes(task.type ?? ""))
      return interaction.reply({
        content: `Invalid task type.\nTask must be of one of the following types:\n>>> ${validTypes.join(
          "\n"
        )}`,
        ephemeral: true,
      });

    const cursed = {
      description: curseText(task.description as string),
      winners: curseText(`${task.winners}`),
      reward: curseText(`${task.amount} ${task.type}`),
      notes: curseText(task.notes),
    };

    let embed = new EmbedBuilder()
      .setTitle(`${helper.emoteBazaar} ${helper.separator} Bazaar Task #${task.id}`)
      .setColor("DarkPurple")
      .setDescription(
        `Winners: ${cursed.winners}\nStarted: <t:${task.timestamp}:R>\nRewards: ${cursed.reward}\n\n> ${cursed.description}\n\n${cursed.notes}`
      );

    let row: any = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bz_add_winner")
        .setStyle(ButtonStyle.Primary)
        .setLabel("Add Winner"),
      new ButtonBuilder().setCustomId("bz_end_task").setStyle(ButtonStyle.Danger).setLabel("End"),
      new ButtonBuilder()
        .setCustomId("decrypttask")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Decrypt")
    );

    if (!interaction.channel)
      return interaction.reply({
        content: "There has been an issue fetching the channel.",
        ephemeral: true,
      });

    let msg = await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });

    db.query(`INSERT INTO Bazaar VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [
      task.id,
      `${task.active}`,
      task.timestamp,
      task.type,
      task.amount,
      task.participants,
      task.winners,
      task.chosenWinners,
      task.activeCards,
      task.description,
      msg.id,
      task.notes,
    ]);

    return await interaction.reply({
      content: `Successfully started task ${task.id}.`,
      ephemeral: true,
    });
  },
};
