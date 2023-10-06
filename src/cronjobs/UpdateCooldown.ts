import Logger from "../ext/Logger";
import * as Database from "../Database";

export const UpdateCooldown = async () => {
  try {
    const db = Database.init();
    db.query(
      /* SQL */
      `UPDATE inventory
			 SET cooldown_current = cooldown_current -1
			 WHERE 
        NOT cooldown_current is NULL 
        AND cooldown_current > 0
      `
    );

    Logger.log("success", `Updated Cooldown.`);
  } catch (e) {
    Logger.log("error", "Error updating Cooldown:");
    console.error(e);
  }
};
