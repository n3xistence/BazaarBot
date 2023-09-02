import Integer from "./Integer";
import { ItemEffect, ItemType } from "../types/";
import { Cooldown } from "../types/";

class Item {
  name: string;
  id: number;
  code: string;
  amount: number;
  rarity: string;
  cardType: string | Cooldown;
  description: string;
  target: string;
  usage: string;
  effects: Array<ItemEffect>;
  targetUser?: string | object;

  constructor(props: ItemType) {
    const { name, id, amount, rarity, cardType, description, target, usage, effects } = props;

    this.name = name;
    this.id = id;
    this.code = `bz${new Integer(id).toBase36()}`;
    this.rarity = rarity;
    this.amount = amount ?? 1;
    this.cardType = cardType;
    this.description = description;
    this.target = target;
    if (target === "target") this.targetUser = "";
    this.usage = usage;
    this.effects = effects;
  }

  cardIsCooldown() {
    return this.isCooldown(this);
  }

  isCooldown(obj: any = {}): obj is Cooldown {
    return typeof obj === "object" && "cooldown" in obj;
  }

  use() {
    if (this.isCooldown(this.cardType) && this.cardType.cooldown.current > 0) return false;

    this.resetCooldown();
    return true;
  }

  getType() {
    return Object.keys(this.cardType)[0];
  }

  resetCooldown() {
    if (!this.isCooldown(this.cardType)) return;

    this.cardType.cooldown.current = this.cardType.cooldown.max;
  }

  turn() {
    if (!this.isCooldown(this.cardType)) return;

    if (this.cardType.cooldown.current === 0) return;
    this.cardType.cooldown.current -= 1;
  }
}

export default Item;
