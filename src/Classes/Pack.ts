import Item from "../types/Item";

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
  items: Item[];
  amount: number;
};

export default Pack;
