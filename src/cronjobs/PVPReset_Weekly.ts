import * as Database from "../Database";
import Logger from "../ext/Logger";

export const PVPReset_Weekly = async () => {
  const db = Database.init();

  db.query(`UPDATE pvpdata SET past_weekly=weekly,weekly=0,weekly_claimed='false'`)
    .then(() => {
      Logger.log("success", "Successfully reset weekly PVP scores.");
    })
    .catch((e) => {
      Logger.log("error", "Error resetting weekly PVP scores:");
      Logger.log("error", e);
    });
};
