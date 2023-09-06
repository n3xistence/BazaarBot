import fs from "node:fs";
import * as Database from "../Database";
import { BazaarStats } from "../types/DBTypes";
import Logger from "../ext/Logger";

export const UpdateBazaarEnergy = () => {
  const userdata = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));

  const db = Database.init();
  for (const user of userdata) {
    let entry: BazaarStats = db
      .prepare(`SELECT * FROM BazaarStats WHERE id=?`)
      .get(user.userId) as BazaarStats;
    if (entry) {
      if (entry.energy === 5) continue;

      const newEnergy = entry.energy + 1;
      db.prepare(`UPDATE BazaarStats SET energy=? WHERE id=?`).run(newEnergy, user.userId);
    } else {
      const battleLog = { global: null, personal: null };
      db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
        user.userId,
        JSON.stringify({}),
        0,
        5,
        JSON.stringify(battleLog)
      );
    }
  }

  Logger.log("success", `Updated energy for ${userdata.length} users.`);
};
