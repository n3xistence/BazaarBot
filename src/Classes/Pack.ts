import Item from "../Classes/Item";

type Pack = {
  name: string;
  code: string;
  rarities: {
    common: string;
    rare: string;
    epic: string;
    legendary: string;
    celestial: string;
  };
  cost: {
    gems: string;
    scrap: string;
  };
  items: Item[];
  amount?: number;
};

export default Pack;
