import * as Database from "../Database";
import * as helper from "../ext/Helper";
import Logger from "../ext/Logger";

export const UpdateBazaarEnergy = async () => {
  const userdata = await helper.fetchAllInventories();

  const db = Database.init();

  db.query(
    /* SQL */
    `
      UPDATE BazaarStats 
      SET energy=energy + 1 
      WHERE energy < 5
    `
  );

  Logger.log("success", `Updated energy for ${userdata.length} users.`);
};
