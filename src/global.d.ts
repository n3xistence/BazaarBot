import Database from "better-sqlite3";

declare global {
  var DB: Database.Database;
}
