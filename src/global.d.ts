import { Client } from "pg";

declare global {
  var DB: Client;
}
