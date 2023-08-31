"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Integer {
    value;
    constructor(n = 0) {
        this.value = n;
    }
    setValue(n) {
        this.value = n;
    }
    valueOf() {
        return this.value;
    }
    compare(n) {
        if (n === this.value)
            return 0;
        if (n < this.value)
            return -1;
        return 1;
    }
    greaterThan(n) {
        return this.compare(n) === 1;
    }
    lessThan(n) {
        return this.compare(n) === -1;
    }
    equals(n) {
        return this.compare(n) === 0;
    }
    toBase36() {
        let decimal = this.value;
        let base36 = "";
        while (decimal > 0) {
            const remainder = decimal % 36;
            decimal = Math.floor(decimal / 36);
            base36 = remainder.toString(36) + base36;
        }
        return base36.toUpperCase().padStart(2, "0");
    }
}
exports.default = Integer;
