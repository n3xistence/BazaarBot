import { ButtonCommand } from "./IButtonCommand";
import { decrypptask } from "./decrypttask";
import { bz_add_winner } from "./bz_add_winner";
import { bz_end_task } from "./bz_end_task";

export const ButtonCommands: Array<ButtonCommand> = [decrypptask, bz_add_winner, bz_end_task];
