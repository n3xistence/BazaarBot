import { Command } from "./ICommand";

import { info } from "./info";
import { additem } from "./additem";
import { attack } from "./attack";
import { removeitem } from "./removeitem";
import { inventory } from "./inventory";
import { daily } from "./daily";
import { buy } from "./buy";
import { give } from "./give";
import { help } from "./help";
import { lb } from "./lb";
import { merchant } from "./merchant";
import { open } from "./open";
import { pay } from "./pay";
import { scrap } from "./scrap";
import { sell } from "./sell";
import { send } from "./send";
import { shop } from "./shop";
import { spy } from "./spy";
import { stats } from "./stats";
import { status } from "./status";
import { task } from "./task";
import { trade } from "./trade";
import { tradelist } from "./tradelist";
import { use } from "./use";
import { view } from "./view";
import { access } from "./access";
import { forcedailyreset } from "./forcedailyreset";

export const Commands: Array<Command> = [
  info,
  forcedailyreset,
  tradelist,
  task,
  use,
  view,
  trade,
  status,
  stats,
  spy,
  shop,
  sell,
  send,
  pay,
  scrap,
  open,
  merchant,
  lb,
  give,
  help,
  buy,
  daily,
  inventory,
  additem,
  removeitem,
  attack,
  access,
];
