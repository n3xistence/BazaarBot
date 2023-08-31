import ItemEffect from "./ItemEffect";
import Cooldown from "./Cooldown";

type Item = {
  name: string;
  id: number;
  amount: number;
  rarity: string;
  cardType: string | Cooldown;
  description: string;
  target: string;
  usage: string;
  targetUser?: string;
  effects: ItemEffect[];
};

export default Item;
