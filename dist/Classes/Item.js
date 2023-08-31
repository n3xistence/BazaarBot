"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Integer_1 = __importDefault(require("./Integer"));
class Item {
    name;
    id;
    code;
    amount;
    rarity;
    cardType;
    description;
    target;
    usage;
    effects;
    targetUser;
    constructor(props) {
        const { name, id, amount, rarity, cardType, description, target, usage, effects, } = props;
        this.name = name;
        this.id = id;
        this.code = `bz${new Integer_1.default(id).toBase36()}`;
        this.rarity = rarity;
        this.amount = amount ? amount : 1;
        this.cardType = cardType;
        this.description = description;
        this.target = target;
        if (target === "target")
            this.targetUser = "";
        this.usage = usage;
        this.effects = effects;
    }
    isCooldown(obj) {
        return "cooldown" in obj;
    }
    use() {
        if (this.isCooldown(this.cardType) && this.cardType.cooldown?.current > 0)
            return false;
        this.resetCooldown();
        return true;
    }
    getType() {
        return Object.keys(this.cardType)[0];
    }
    resetCooldown() {
        if (!this.isCooldown(this.cardType))
            return;
        this.cardType.cooldown.current = this.cardType.cooldown.max;
    }
    turn() {
        if (!this.isCooldown(this.cardType))
            return;
        if (this.cardType.cooldown.current === 0)
            return;
        this.cardType.cooldown.current -= 1;
    }
}
exports.default = Item;
