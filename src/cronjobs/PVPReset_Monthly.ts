import * as Database from "../Database";
import Logger from "../ext/Logger";

export const PVPReset_Monthly = async () => {
  const db = Database.init();

  db.query(`UPDATE pvpdata SET past_monthly=monthly,monthly=0,monthly_claimed='false'`)
    .then(() => {
      Logger.log("success", "Successfully reset monthly PVP scores.");
    })
    .catch((e) => {
      Logger.log("error", "Error resetting monthly PVP scores:");
      Logger.log("error", e);
    });
};
