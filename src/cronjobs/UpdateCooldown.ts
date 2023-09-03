import fs from "node:fs";
import Logger from "../ext/Logger";
import Inventory from "../Classes/Inventory";
import * as helper from "../ext/Helper";

export const UpdateCooldown = () => {
  try {
    let inventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));

    for (let i = 0; i < inventories.length; i++) {
      let inv: Inventory = helper.getInventoryAsObject(inventories[i].userId);
      inv.moveTurn();
      inventories[i].inventory = inv;
    }

    fs.writeFileSync("./data/inventories.json", JSON.stringify(inventories, null, "\t"));

    Logger.log("success", `Updated Cooldown for ${inventories.length} users.`);
  } catch (e) {
    Logger.log("error", "Error updating Cooldown:");
    console.error(e);
  }
};
