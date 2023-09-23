import { Client } from "pg";
import Logger from "../ext/Logger";

export const init = () => {
  if (globalThis.DB) return globalThis.DB;

  Logger.log("warn", "No Database Connection, establishing now...");

  const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: parseInt(`${process.env.PG_PORT}`),
  });

  client
    .connect()
    .then(() => Logger.log("success", "Successfully connected to Database!"))
    .catch((e) => {
      Logger.log("error", "Could not connect to Database. Error:\n", e);
      process.exit();
    });

  globalThis.DB = client;
  return globalThis.DB;
};
