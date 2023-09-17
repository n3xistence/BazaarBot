import { ModalInteraction } from "./IModalInteraction";
import { add_task_winner } from "./add_task_winner";
import { card_50_pick } from "./card_50_pick";
import { change_trade } from "./change_trade";

export const Modals: Array<ModalInteraction> = [add_task_winner, card_50_pick, change_trade];
