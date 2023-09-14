import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import * as helper from "../ext/Helper";
import { Command } from "./ICommand";
import CommandOptions from "../enums/CommandOptions";
import * as Database from "../Database";
import { BazaarStats, Currency } from "../types/DBTypes";

const updateWarEmbed = (
  user: any,
  targetUser: any,
  players: any,
  progress = true
) => {
  let embed = new EmbedBuilder()
    .setTitle(
      `<:BB_PVP:1027227607034515456> ${helper.separator} ${user.username} is heading to war!`
    )
    .setColor("Red")
    .setThumbnail(
      `https://i.pinimg.com/originals/e6/3d/15/e63d154a9c6d4598c0215801a1b3de6f.gif`
    )
    .addFields(
      {
        name: `${user.username}:`,
        value: `${helper.emotePVP} ${
          helper.separator
        } Attack: ${players.attacker.atk.toLocaleString()}\n${
          helper.emoteHeart
        } ${
          helper.separator
        } Health: ${players.attacker.hp.toLocaleString()}/${players.attacker.max_hp.toLocaleString()}\n${helper.getProgressBar(
          players.attacker.hp,
          players.attacker.max_hp
        )}`,
        inline: true,
      },
      {
        name: `${targetUser.username}:`,
        value: `${helper.emotePVP} ${
          helper.separator
        } Attack: ${players.defender.atk.toLocaleString()}\n${
          helper.emoteHeart
        } ${
          helper.separator
        } Health: ${players.defender.hp.toLocaleString()}/${players.defender.max_hp.toLocaleString()}\n${helper.getProgressBar(
          players.defender.hp,
          players.defender.max_hp
        )}`,
        inline: true,
      }
    );

  if (progress)
    embed.setFooter({
      text: "Fighting...",
      iconURL: "https://i.gifer.com/ZKZg.gif",
    });

  return embed;
};

const getUnixTimestampOfNextHalfHour = (): number => {
  const currentTime = Math.floor(Date.now() / 1000);
  const currentMinute = new Date().getMinutes();
  const secondsUntilNextHalfHour = (30 - (currentMinute % 30)) * 60;
  const unixTimestampOfNextHalfHour = currentTime + secondsUntilNextHalfHour;
  const roundedUnixTimestamp = Math.round(unixTimestampOfNextHalfHour);
  return roundedUnixTimestamp;
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const attack: Command = {
  name: "attack",
  description: "Attack another player",
  options: [
    {
      name: "user",
      type: CommandOptions.USER,
      description: "The Target Player",
      required: true,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    const db = Database.init();
    let targetUser = interaction.options.getUser("user");
    if (!targetUser || targetUser.id === interaction.user.id)
      return interaction.reply({
        content: "Please mention a valid user.",
        ephemeral: true,
      });
    if (targetUser.bot)
      return interaction.reply({
        content: "This user is a bot and cannot participate in PVP.",
        ephemeral: true,
      });

    const ownInv = helper.getInventoryAsObject(interaction.user.id);
    const targetInv = helper.getInventoryAsObject(targetUser.id);

    const selfHasCard = ownInv.getActiveItems().find((e) => e.id === 40);
    const targetHasCard = targetInv.getActiveItems().find((e) => e.id === 40);
    if (!selfHasCard)
      return interaction.reply({
        content:
          "You have not activated the card `Colosseum` and cannot participate in PVP.",
        ephemeral: true,
      });
    if (!targetHasCard)
      return interaction.reply({
        content: `${targetUser} has not activated the card \`Colosseum\` and cannot participate in PVP.`,
        ephemeral: true,
      });

    const selfCooldownData: BazaarStats | undefined = db
      .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
      .get(interaction.user.id) as BazaarStats | undefined;

    if (selfCooldownData && selfCooldownData.energy <= 0)
      return interaction.reply({
        content: `You don't have enough energy to do this. You will regain one energy point <t:${getUnixTimestampOfNextHalfHour()}:R>.`,
        ephemeral: true,
      });

    if (
      selfCooldownData &&
      JSON.parse(selfCooldownData.battle_log).global &&
      helper.getUNIXStamp() < JSON.parse(selfCooldownData.battle_log).global
    )
      return interaction.reply({
        content: `You cannot enter combat at the moment. Try again <t:${
          JSON.parse(selfCooldownData.battle_log).global
        }:R>`,
        ephemeral: true,
      });

    const targetCooldownData: BazaarStats | undefined = db
      .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
      .get(targetUser.id) as BazaarStats | undefined;

    if (
      targetCooldownData &&
      JSON.parse(targetCooldownData.battle_log).personal &&
      helper.getUNIXStamp() < JSON.parse(targetCooldownData.battle_log).personal
    )
      return interaction.reply({
        content: `You may not enter combat with ${targetUser}. Try again <t:${
          JSON.parse(targetCooldownData.battle_log).personal
        }:R>`,
        ephemeral: true,
      });

    const ownExp: BazaarStats | { exp: number } | undefined = (db
      .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
      .get(interaction.user.id) as BazaarStats | undefined) ?? { exp: 0 };

    const targetExp: BazaarStats | { exp: number } | undefined = (db
      .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
      .get(targetUser.id) as BazaarStats | undefined) ?? { exp: 0 };

    const ownLevel = helper.getLevelData(ownExp.exp).level;
    const targetLevel = helper.getLevelData(targetExp.exp).level;

    const players = {
      attacker: {
        atk: helper.bz_getDamage(ownInv, ownLevel),
        hp: helper.bz_getHealth(ownInv, ownLevel),
        max_hp: helper.bz_getHealth(ownInv, ownLevel),
      },
      defender: {
        atk: helper.bz_getDamage(targetInv, targetLevel),
        hp: helper.bz_getHealth(targetInv, targetLevel),
        max_hp: helper.bz_getHealth(targetInv, targetLevel),
      },
    };

    await interaction.reply({
      embeds: [new EmbedBuilder().setDescription("Entering Battle...")],
    });
    while (players.attacker.hp > 0 && players.defender.hp > 0) {
      interaction.editReply({
        embeds: [updateWarEmbed(interaction.user, targetUser, players)],
      });
      await sleep(2500);

      players.attacker.hp -= players.defender.atk;
      players.defender.hp -= players.attacker.atk;

      players.attacker.atk = helper.bz_getDamage(ownInv, ownLevel);
      players.defender.atk = helper.bz_getDamage(targetInv, targetLevel);
    }

    let winner, loser;
    if (players.attacker.hp <= 0 && players.defender.hp <= 0) {
      winner = null;
    } else if (players.attacker.hp <= 0) {
      winner = targetUser;
      loser = interaction.user;
    } else {
      winner = interaction.user;
      loser = targetUser;
    }

    if (winner === null) {
      const energy: number | null =
        (
          db
            .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
            .get(interaction.user.id) as BazaarStats
        )?.energy ?? null;

      if (!energy) {
        db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
          interaction.user.id,
          JSON.stringify({}),
          0,
          0,
          JSON.stringify({
            global: null,
            personal: null,
          })
        );
      } else {
        db.prepare(`UPDATE BazaarStats SET energy=? WHERE id=?`).run(
          energy - 1,
          interaction.user.id
        );
      }

      return interaction.editReply({
        content: `Both warriors have fallen in battle!`,
        embeds: [updateWarEmbed(interaction.user, targetUser, players, false)],
      });
    }
    await interaction.editReply({
      content: `${winner} has triumphed over ${loser}!`,
      embeds: [updateWarEmbed(interaction.user, targetUser, players, false)],
    });

    if (winner.id === interaction.user.id) {
      const spoils = {
        exp: targetLevel,
        gems: Math.min(targetLevel - ownLevel, 5),
      };

      helper.updateTotalEXP(interaction, db, 1, spoils.exp);
      if (spoils.gems < 0) spoils.gems = 0;

      const currentPoints: Currency | undefined = db
        .prepare(`SELECT * FROM currency WHERE id=?`)
        .get(interaction.user.id) as Currency | undefined;

      if (currentPoints) {
        let newTotal = currentPoints.gems + spoils.gems;
        db.prepare(`UPDATE currency SET gems=? WHERE id=?`).run(
          newTotal,
          interaction.user.id
        );
      } else {
        db.prepare(`INSERT INTO currency VALUES(?,?,?,?,?,?)`).run(
          interaction.user.id,
          0,
          spoils.gems,
          0
        );
      }

      const targetCooldown: BazaarStats | undefined = db
        .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
        .get(targetUser.id) as BazaarStats | undefined;

      if (targetCooldown) {
        db.prepare(`UPDATE BazaarStats SET battle_log=? WHERE id=?`).run(
          JSON.stringify({
            global: JSON.parse(targetCooldown.battle_log).global,
            personal: helper.getUNIXStamp() + 3600,
          }),
          targetUser.id
        );
      } else {
        db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
          targetUser.id,
          JSON.stringify({}),
          0,
          0,
          JSON.stringify({
            global: null,
            personal: helper.getUNIXStamp() + 3600,
          })
        );
      }

      helper.updatePVPStats(interaction.user, db, 1);
      helper.updatePVPStats(targetUser, db, -1);

      interaction.channel?.send({
        embeds: [
          new EmbedBuilder()
            .setColor("DarkPurple")
            .setDescription(
              `${winner} has gained ${spoils.exp} exp ${helper.emoteLevels} and ${spoils.gems} gems ${helper.emoteGems} from defeating ${loser}.`
            ),
        ],
      });
    } else {
      const currentCooldown: BazaarStats | undefined = db
        .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
        .get(interaction.user.id) as BazaarStats | undefined;

      if (currentCooldown) {
        db.prepare(`UPDATE BazaarStats SET battle_log=? WHERE id=?`).run(
          JSON.stringify({
            global: helper.getUNIXStamp() + 3600,
            personal: JSON.parse(currentCooldown.battle_log).personal,
          }),
          interaction.user.id
        );
      } else {
        db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
          interaction.user.id,
          JSON.stringify({}),
          0,
          0,
          JSON.stringify({
            global: helper.getUNIXStamp() + 3600,
            personal: null,
          })
        );
      }

      helper.updatePVPStats(targetUser, db, 1);
      helper.updatePVPStats(interaction.user, db, -1);
    }

    const { energy } = db
      .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
      .get(interaction.user.id) as BazaarStats;

    let newEnergy = energy - 1 >= 0 ? energy - 1 : 0;
    db.prepare(`UPDATE BazaarStats SET energy=? WHERE id=?`).run(
      newEnergy,
      interaction.user.id
    );
  },
};
