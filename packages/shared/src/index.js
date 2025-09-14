"use strict";
// --- SHPoint Shared (complete minimal shared) ---
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRoll = exports.ClientJoin = exports.weightsDefault = exports.sidesDefault = void 0;
exports.weightedIndex = weightedIndex;
exports.rollOneIndex = rollOneIndex;
exports.rollDice = rollDice;
exports.summarizeDice = summarizeDice;
exports.summaryToString = summaryToString;
exports.rollOne = rollOne;
exports.normalizeDice = normalizeDice;
var zod_1 = require("zod");
/** Default faces distribution for 8-sided die */
exports.sidesDefault = [
    "crit", "success", "success", "strike",
    "strike", "expertise", "fail", "fail"
];
/** Equal weights by default */
exports.weightsDefault = Array(exports.sidesDefault.length).fill(1);
/** Pick weighted index helper */
function weightedIndex(weights) {
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0)
            return i;
    }
    return weights.length - 1;
}
/** Roll a single die -> face index 0..7 */
function rollOneIndex(weights) {
    if (weights === void 0) { weights = exports.weightsDefault; }
    return weightedIndex(weights);
}
/** Roll N dice -> array of SymbolType */
function rollDice(n, weights, faces) {
    var _a;
    if (weights === void 0) { weights = exports.weightsDefault; }
    if (faces === void 0) { faces = exports.sidesDefault; }
    var nn = Math.max(0, Math.floor(n));
    var out = [];
    for (var i = 0; i < nn; i++) {
        var idx = rollOneIndex(weights);
        out.push((_a = faces[idx]) !== null && _a !== void 0 ? _a : "fail");
    }
    return out;
}
/** Summary of rolled dice */
function summarizeDice(rolled) {
    var counts = { success: 0, crit: 0, strike: 0, fail: 0, expertise: 0 };
    for (var _i = 0, rolled_1 = rolled; _i < rolled_1.length; _i++) {
        var s = rolled_1[_i];
        counts[s] = counts[s] + 1;
    }
    var success = counts.success + counts.crit;
    var crit = counts.crit;
    return __assign(__assign({}, counts), { success: success, crit: crit });
}
/** Human readable summary string */
function summaryToString(s) {
    return "success=".concat(s.success, ", crit=").concat(s.crit, ", strike=").concat(s.strike, ", expertise=").concat(s.expertise, ", fail=").concat(s.fail);
}
/** Legacy helpers kept for compatibility */
function rollOne() { return Math.floor(Math.random() * exports.sidesDefault.length) + 1; }
function normalizeDice(n) { return Math.max(0, Math.floor(n)); }
/* -------------------- Zod schemas for server -------------------- */
/** Message: client -> server join */
exports.ClientJoin = zod_1.z.object({
    t: zod_1.z.literal("join"),
    room: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    idToken: zod_1.z.string().min(1),
    role: zod_1.z.enum(["player", "spectator"]).default("player")
});
/** Message: client -> server roll */
exports.ClientRoll = zod_1.z.object({
    t: zod_1.z.literal("roll"),
    pool: zod_1.z.enum(["attack", "defense"]).optional()
});
/** Default export (optional metadata) */
var sharedDefault = { version: "0.0.3" };
exports.default = sharedDefault;
