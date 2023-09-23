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
  description: string;
  type: string;
  notes: string;
  // TODO
  // Add guild_id
  // to ensure we can handle multiple active tasks across servers
};

export type PVPScore = {
  id: number;
  score: string;
  past_score: string;
  weekly_claimed: string;
  monthly_claimed: string;
};
