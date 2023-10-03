import * as Database from "../Database";
import * as helper from "../ext/Helper";
import Logger from "../ext/Logger";

export const UpdateBazaarEnergy = async () => {
  const userdata = await helper.fetchAllInventories();

  const db = Database.init();
  for (const user of userdata) {
    let entry = await db.query(`SELECT * FROM BazaarStats WHERE id=$1`, [user.userId]);
    if (entry.rows.length > 0) {
      if (entry.rows[0].energy === 5) continue;

      const newEnergy = entry.rows[0].energy + 1;
      db.query(`UPDATE BazaarStats SET energy=$1 WHERE id=$2`, [newEnergy, user.userId]);
    } else {
      const battleLog = { global: null, personal: null };
      db.query(`INSERT INTO BazaarStats VALUES($1,$2,$3,$4,$5)`, [
        user.userId,
        JSON.stringify({}),
        0,
        5,
        JSON.stringify(battleLog),
      ]);
    }
  }

  Logger.log("success", `Updated energy for ${userdata.length} users.`);
};
