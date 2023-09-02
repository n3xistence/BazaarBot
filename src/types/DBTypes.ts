export type Currency = {
  id: string;
  gold: number;
  gems: number;
  scrap: number;
};

export type BazaarStats = {
  id: string;
  stats: string;
  exp: number;
  energy: number;
  battle_log: string;
};

export type Bazaar = {
  id: number;
  active: number;
  timestamp: string;
  amount: number;
  participants: string;
  winners: number;
  chosen_winners: string;
  active_cards: string;
  messageID: string;
  notes: string;
  // TODO
  // Add guild_id
  // to ensure we can handle multiple active tasks across servers
};
