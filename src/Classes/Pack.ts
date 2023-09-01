import { ItemType } from "../types/";

type Pack = {
  name: string;
  code: string;
  rarities: {
    common: string;
    rare: string;
    legendary: string;
    celestial: string;
  };
  cost: {
    gems: string;
    scrap: string;
  };
  items: ItemType[];
  amount: number;
};

export default Pack;
