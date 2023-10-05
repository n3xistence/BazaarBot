import { ButtonCommand } from "./IButtonCommand";
import { decrypptask } from "./decrypttask";
import { bz_add_winner } from "./bz_add_winner";
import { bz_end_task } from "./bz_end_task";
import { accept_trade } from "./accept_trade";
import { deny_trade } from "./deny_trade";
import { open_trade_modal } from "./open_trade_modal";
import { submit_balthazar } from "./submit_balthazar";

export const ButtonCommands: Array<ButtonCommand> = [
  decrypptask,
  submit_balthazar,
  bz_add_winner,
  bz_end_task,
  accept_trade,
  deny_trade,
  open_trade_modal,
];
