import { Client } from "pg";
import Logger from "../ext/Logger";

export const init = () => {
  if (globalThis.DB) return globalThis.DB;

  Logger.log("warn", "No Database Connection, establishing now...");

  const client = new Client({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: parseInt(process.env.PORT as string),
  });

  client
    .connect()
    .then(() => Logger.log("success", "Successfully connected to Database!"))
    .catch((e) => Logger.log("error", "Could not connect to the database. Error: ", e));

  globalThis.DB = client;
  return globalThis.DB;
};
