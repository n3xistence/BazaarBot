import Item from "./Item";
import Pack from "./Pack";
import { Cooldown } from "../types/";

class Inventory {
  activeItems: Item[] = [];
  list: Item[];
  packs: Pack[] = [];

  constructor(list: Item[] = []) {
    this.list = list;
  }

  getItems() {
    return this.list;
  }
  getActiveItems() {
    return this.activeItems;
  }
  getPacks(): Array<Pack> {
    return this.packs;
  }

  findByName(name: string) {
    return this.list.find((e) => e.name === name);
  }
  findById(id: number) {
    return this.list.find((e) => e.id === id);
  }
  findByCode(code: string) {
    return this.list.find((e) => e.code === code);
  }

  addItem(item: Item) {
    let found = this.list.find((e) => e.id === item.id);
    if (!found) found = this.activeItems.find((e) => e.id === item.id);

    if (found) found.amount += item.amount;
    else {
      if (item.cardType === "passive") this.activeItems.push(item);
      else this.list.push(item);
    }
  }
  addPack(pack: Pack) {
    const found = this.packs.find((e) => e.name === pack.name);

    if (found && found.amount) found.amount += pack.amount ? pack.amount : 1;
    else this.packs.push(pack);
  }

  removePack(pack: Pack) {
    const found = this.packs.find((e) => e.name === pack.name);
    if (!found) return;

    if (found.amount && found.amount > 1) found.amount -= 1;
    else
      this.packs.splice(
        this.packs.findIndex((e) => e.code === pack.code),
        1
      );

    return true;
  }
  removeItem(item: Item, amount = 1) {
    let found = this.list.find((e) => e.id === item.id);

    if (found) {
      if (found.amount > amount) found.amount -= amount;
      else {
        let index = this.list.findIndex((e) => e.id === item.id);
        this.list.splice(index, 1);
      }
    } else {
      found = this.activeItems.find((e) => e.id === item.id);
      if (!found) return;

      if (found.amount > amount) found.amount -= amount;
      else {
        let index = this.activeItems.findIndex((e) => e.id === item.id);
        this.activeItems.splice(index, 1);
      }
    }

    return true;
  }

  setActiveItem(item: Item) {
    const itemIsActive = this.activeItems?.find((e) => e.id === item.id);
    if (itemIsActive) {
      if (item.cardType !== "toggle") return false;

      this.moveToInventory(item);
      return true;
    }

    const itemIndex = this.list.findIndex((e) => e.id === item.id);
    if (itemIndex === -1) throw Error("No Such Item");

    this.list.splice(itemIndex, 1);
    this.activeItems.push(item);

    return true;
  }

  moveToInventory(item: Item) {
    const itemIndex = this.activeItems.findIndex((e) => e.id === item.id);
    if (itemIndex === -1) return;

    const [removedItem] = this.activeItems.splice(itemIndex, 1);
    this.list.push(removedItem);
  }

  deleteItem(item: Item) {
    const itemIndex = this.activeItems.findIndex((e) => e.id === item.id);
    if (itemIndex === -1) return;

    this.activeItems.splice(itemIndex, 1);
  }

  moveTurn() {
    for (const item of this.list) {
      item.turn();
    }
    for (let i = 0; i < this.activeItems.length; i++) {
      let item = this.activeItems[i];

      if (typeof item.cardType !== "string") {
        item.resetCooldown();
        this.moveToInventory(item);
        i--;
      } else if (item.cardType === "trash") {
        this.removeItem(item);

        if (item.amount === 1) i--;
      }
    }
  }

  endTask() {
    for (let i = 0; i < this.activeItems.length; i++) {
      let item = this.activeItems[i];

      if (typeof item.cardType !== "string") {
        item.resetCooldown();
        this.moveToInventory(item);
        i--;
      } else if (item.cardType === "trash") {
        this.removeItem(item);

        if (item.amount === 1) i--;
        else this.moveToInventory(item);
      }
    }
  }

  getCardAmount() {
    let totalCards = 0;
    for (const activeItem of this.activeItems) {
      totalCards += activeItem.amount;
    }

    for (const item of this.list) {
      totalCards += item.amount;
    }

    return totalCards;
  }

  getPackAmount() {
    let totalPacks = 0;
    for (const pack of this.packs) {
      totalPacks += pack.amount ?? 1;
    }

    return totalPacks;
  }

  fromJSON(json: string | Buffer) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    const inventory = new Inventory();
    Object.assign(inventory, data);

    const items = [];
    for (let item of inventory.getItems()) {
      const iData = typeof item === "string" ? JSON.parse(item) : item;
      items.push(new Item(iData));
    }
    Object.assign(inventory.list, items);

    const activeItems = [];
    for (let item of inventory.getActiveItems()) {
      const iData = typeof item === "string" ? JSON.parse(item) : item;
      activeItems.push(new Item(iData));
    }
    Object.assign(inventory.activeItems, activeItems);

    return inventory;
  }
}

export default Inventory;
