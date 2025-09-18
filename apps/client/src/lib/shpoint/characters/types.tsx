"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCharacters = normalizeCharacters;
var taxo_json_1 = require("@shpoint/shared/data/taxo.json");
var ERA_FIX = {
    "Galatic Civil War": "Galactic Civil War",
};
var aliasFaction = function (x) { var _a, _b; return (_b = (_a = taxo_json_1.default.factionAliases) === null || _a === void 0 ? void 0 : _a[x]) !== null && _b !== void 0 ? _b : x; };
var known = new Set((_a = taxo_json_1.default.knownFactions) !== null && _a !== void 0 ? _a : []);
var tagRegexes = ((_b = taxo_json_1.default.forceTagPatterns) !== null && _b !== void 0 ? _b : []).map(function (p) { return new RegExp(p, "i"); });
function looksLikeTag(x) {
    return tagRegexes.some(function (r) { return r.test(x); });
}
function fixEra(e) {
    var _a;
    return (_a = ERA_FIX[e]) !== null && _a !== void 0 ? _a : e;
}
function normSetCode(s) {
    if (!s)
        return null;
    var m = s.match(/^SWP0?(\d+)$/i);
    return m ? "SWP".concat(String(m[1]).padStart(2, "0")) : s;
}
function hardFixById(c) {
    if (c.id === "ct-411-commander-ponds")
        return __assign(__assign({}, c), { factions: ["Galactic Republic"] });
    if (c.id === "ahsoka-tano-jedi-no-more")
        return __assign(__assign({}, c), { set_code: "SWP01" });
    return c;
}
function splitFactionsAndTags(factions, tags) {
    var _a, _b;
    var f = [];
    var t = new Set(tags !== null && tags !== void 0 ? tags : []);
    var unknown = [];
    for (var _i = 0, _c = factions !== null && factions !== void 0 ? factions : []; _i < _c.length; _i++) {
        var raw = _c[_i];
        var val = aliasFaction(raw);
        if (looksLikeTag(val)) {
            t.add(val);
            continue;
        }
        if (known.has(val)) {
            f.push(val);
        }
        else {
            if (((_b = (_a = taxo_json_1.default.defaults) === null || _a === void 0 ? void 0 : _a.unknownFactionPolicy) !== null && _b !== void 0 ? _b : "demote") === "demote") {
                t.add(val);
                unknown.push(val);
            }
            else {
                f.push(val);
            }
        }
    }
    return { factions: Array.from(new Set(f)), tags: Array.from(t), unknown: unknown };
}
function normalizeCharacters(data) {
    return data.map(function (raw) {
        var _a;
        var c = hardFixById(raw);
        if (c.perdiod && !c.period)
            c = __assign(__assign({}, c), { period: c.perdiod });
        var periodArr = Array.isArray(c.period) ? c.period : c.period ? [c.period] : [];
        var fixedPeriod = Array.from(new Set(periodArr.map(function (p) { return fixEra(p); })));
        var _b = splitFactionsAndTags(c.factions, c.tags), factions = _b.factions, tags = _b.tags, unknown = _b.unknown;
        var setCode = normSetCode(c.set_code);
        var searchable = __spreadArray(__spreadArray(__spreadArray(__spreadArray([
            c.name
        ], (tags !== null && tags !== void 0 ? tags : []), true), factions, true), fixedPeriod, true), [
            (_a = c.unit_type) !== null && _a !== void 0 ? _a : "",
            setCode !== null && setCode !== void 0 ? setCode : "",
        ], false).join(" ")
            .toLowerCase();
        var out = __assign(__assign({}, c), { period: fixedPeriod, factions: factions, tags: Array.from(new Set(tags !== null && tags !== void 0 ? tags : [])), set_code: setCode, searchable: searchable });
        if (unknown.length)
            out.meta = { unknownFactions: Array.from(new Set(unknown)) };
        return out;
    });
}
