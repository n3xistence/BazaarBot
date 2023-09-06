import Logger from "../ext/Logger";
import Database from "better-sqlite3";

export const init = (): Database.Database => {
  if (globalThis.DB) return globalThis.DB;

  Logger.log("warn", "No Database Connection, establishing now...");
  globalThis.DB = new Database("./data/data.db");
  globalThis.DB.pragma("journal_mode = WAL");
  Logger.log("success", "Successfully connected to Database!");

  return globalThis.DB;
};
