import Logger from "../ext/Logger";
import Inventory from "../Classes/Inventory";
import * as helper from "../ext/Helper";

export const UpdateCooldown = async () => {
  try {
    let inventories = await helper.fetchAllInventories();

    for (let i = 0; i < inventories.length; i++) {
      let inv: Inventory = await helper.fetchInventory(inventories[i].userId as string);
      inv.moveTurn();

      helper.updateInventoryRef(inv);
    }

    Logger.log("success", `Updated Cooldown for ${inventories.length} users.`);
  } catch (e) {
    Logger.log("error", "Error updating Cooldown:");
    console.error(e);
  }
};
