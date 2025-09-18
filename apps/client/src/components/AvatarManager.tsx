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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AvatarManager;
var react_1 = require("react");
var AuthContext_1 = require("../auth/AuthContext");
var API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
function apiFetch(url, init) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(url, __assign({ credentials: "include" }, init))];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error("HTTP ".concat(res.status));
                    return [2 /*return*/, res.json()];
            }
        });
    });
}
function AvatarManager(_a) {
    var _this = this;
    var _b, _c;
    var onAvatarUpdate = _a.onAvatarUpdate, onClose = _a.onClose;
    var _d = (0, AuthContext_1.useAuth)(), auth = _d.auth, refresh = _d.refresh;
    var _e = (0, react_1.useState)(""), avatarUrl = _e[0], setAvatarUrl = _e[1];
    var _f = (0, react_1.useState)(""), username = _f[0], setUsername = _f[1];
    var _g = (0, react_1.useState)(false), loading = _g[0], setLoading = _g[1];
    var _h = (0, react_1.useState)(null), error = _h[0], setError = _h[1];
    var _j = (0, react_1.useState)(null), success = _j[0], setSuccess = _j[1];
    // Initialize form values from user data
    (0, react_1.useEffect)(function () {
        var _a, _b;
        if ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.avatarUrl) {
            setAvatarUrl(auth.user.avatarUrl);
        }
        else {
            setAvatarUrl("");
        }
        if ((_b = auth.user) === null || _b === void 0 ? void 0 : _b.username) {
            setUsername(auth.user.username);
        }
        else {
            setUsername("");
        }
    }, [(_b = auth.user) === null || _b === void 0 ? void 0 : _b.avatarUrl, (_c = auth.user) === null || _c === void 0 ? void 0 : _c.username]);
    var handleSetAvatar = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!avatarUrl.trim()) {
                        setError("Please enter an avatar URL");
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    setError(null);
                    setSuccess(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiFetch("".concat(API, "/api/user/avatar"), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ avatarUrl: avatarUrl.trim() }),
                        })];
                case 2:
                    _b.sent();
                    setSuccess("Avatar updated successfully!");
                    setAvatarUrl("");
                    refresh(); // Refresh auth context to get updated user data
                    onAvatarUpdate === null || onAvatarUpdate === void 0 ? void 0 : onAvatarUpdate();
                    setTimeout(function () { return setSuccess(null); }, 3000);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _b.sent();
                    setError((_a = e_1 === null || e_1 === void 0 ? void 0 : e_1.message) !== null && _a !== void 0 ? _a : "Failed to update avatar");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleResetAvatar = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!confirm("Reset to Google avatar? This will remove your custom avatar.")) {
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    setError(null);
                    setSuccess(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiFetch("".concat(API, "/api/user/avatar/reset"), {
                            method: "PATCH",
                        })];
                case 2:
                    _b.sent();
                    setSuccess("Avatar reset to Google image!");
                    refresh(); // Refresh auth context to get updated user data
                    onAvatarUpdate === null || onAvatarUpdate === void 0 ? void 0 : onAvatarUpdate();
                    setTimeout(function () { return setSuccess(null); }, 3000);
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _b.sent();
                    setError((_a = e_2 === null || e_2 === void 0 ? void 0 : e_2.message) !== null && _a !== void 0 ? _a : "Failed to reset avatar");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSetUsername = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    setSuccess(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiFetch("".concat(API, "/api/user/username"), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: username.trim() || null }),
                        })];
                case 2:
                    _b.sent();
                    setSuccess("Username updated successfully!");
                    refresh(); // Refresh auth context to get updated user data
                    onAvatarUpdate === null || onAvatarUpdate === void 0 ? void 0 : onAvatarUpdate();
                    setTimeout(function () { return setSuccess(null); }, 3000);
                    return [3 /*break*/, 5];
                case 3:
                    e_3 = _b.sent();
                    setError((_a = e_3 === null || e_3 === void 0 ? void 0 : e_3.message) !== null && _a !== void 0 ? _a : "Failed to update username");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (!auth.user)
        return null;
    var currentAvatar = auth.user.avatarUrl || auth.user.image;
    var hasCustomAvatar = !!auth.user.avatarUrl;
    // Generate initials from name or email
    var getInitials = function (name, email) {
        var text = name || email || "U";
        var parts = text.split(" ");
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return text.slice(0, 2).toUpperCase();
    };
    var initials = getInitials(auth.user.name, auth.user.email);
    return (<div style={{
            padding: "40px 48px",
            borderRadius: "16px",
            backgroundColor: "#1e293b",
            maxWidth: "600px",
            width: "100%",
            margin: "0 auto",
            color: "#e2e8f0",
            border: "1px solid #334155",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            position: "relative"
        }}>
      <div style={{
            marginBottom: "32px",
            textAlign: "center",
            paddingBottom: "24px",
            borderBottom: "1px solid #334155"
        }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700", color: "#ffffff" }}>
          Profile Settings
        </h3>
        <p style={{ margin: 0, fontSize: "16px", color: "#94a3b8" }}>
          Manage your avatar and profile information
        </p>
      </div>
      
      {/* Current Avatar Display */}
      <div style={{
            marginBottom: "32px",
            padding: "24px",
            backgroundColor: "#334155",
            borderRadius: "12px",
            border: "1px solid #475569",
            textAlign: "center"
        }}>
        <p style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "600", color: "#e2e8f0" }}>
          Current Avatar
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          {currentAvatar ? (<img src={currentAvatar} alt="Current avatar" style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #64748b",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
            }}/>) : (<div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "28px",
                fontWeight: "700",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
            }}>
              {initials}
            </div>)}
          <div>
            <p style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "600", color: "#ffffff" }}>
              {hasCustomAvatar ? "Custom Avatar" : "Google Avatar"}
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
              {auth.user.image ? "Google avatar available" : "Using initials"}
            </p>
          </div>
        </div>
      </div>

      {/* Username Settings */}
      <div style={{
            marginBottom: "32px",
            padding: "24px",
            backgroundColor: "#1e293b",
            borderRadius: "12px",
            border: "1px solid #334155"
        }}>
        <label style={{ display: "block", marginBottom: "12px", fontSize: "16px", fontWeight: "600", color: "#e2e8f0" }}>
          Custom Username
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input type="text" value={username} onChange={function (e) { return setUsername(e.target.value); }} placeholder={auth.user.username || "Leave empty to use name/email"} style={{
            width: "100%",
            padding: "14px 16px",
            border: "2px solid #475569",
            borderRadius: "10px",
            fontSize: "14px",
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease"
        }} onFocus={function (e) {
            e.target.style.borderColor = "#3b82f6";
            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }} onBlur={function (e) {
            e.target.style.borderColor = "#475569";
            e.target.style.boxShadow = "none";
        }}/>
          <button onClick={handleSetUsername} disabled={loading} style={{
            padding: "14px 24px",
            backgroundColor: loading ? "#4b5563" : "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: loading ? "none" : "0 4px 8px rgba(22, 163, 74, 0.2)"
        }} onMouseOver={function (e) {
            if (!loading) {
                e.target.style.backgroundColor = "#15803d";
                e.target.style.transform = "translateY(-1px)";
            }
        }} onMouseOut={function (e) {
            if (!loading) {
                e.target.style.backgroundColor = "#16a34a";
                e.target.style.transform = "translateY(0)";
            }
        }}>
            {loading ? "Saving..." : "Save Username"}
          </button>
        </div>
        <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
          Currently displaying: <strong>{auth.user.username || auth.user.name || auth.user.email}</strong>
        </p>
      </div>

      {/* Set Custom Avatar */}
      <div style={{
            marginBottom: "32px",
            padding: "24px",
            backgroundColor: "#1e293b",
            borderRadius: "12px",
            border: "1px solid #334155"
        }}>
        <label style={{ display: "block", marginBottom: "12px", fontSize: "16px", fontWeight: "600", color: "#e2e8f0" }}>
          Set Custom Avatar URL
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input type="url" value={avatarUrl} onChange={function (e) { return setAvatarUrl(e.target.value); }} placeholder="https://example.com/avatar.jpg" style={{
            width: "100%",
            padding: "14px 16px",
            border: "2px solid #475569",
            borderRadius: "10px",
            fontSize: "14px",
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease"
        }} onFocus={function (e) {
            e.target.style.borderColor = "#3b82f6";
            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }} onBlur={function (e) {
            e.target.style.borderColor = "#475569";
            e.target.style.boxShadow = "none";
        }}/>
          <button onClick={handleSetAvatar} disabled={loading || !avatarUrl.trim()} style={{
            padding: "14px 24px",
            backgroundColor: loading || !avatarUrl.trim() ? "#4b5563" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: loading || !avatarUrl.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: loading || !avatarUrl.trim() ? "none" : "0 4px 8px rgba(59, 130, 246, 0.2)"
        }} onMouseOver={function (e) {
            if (!loading && avatarUrl.trim()) {
                e.target.style.backgroundColor = "#2563eb";
                e.target.style.transform = "translateY(-1px)";
            }
        }} onMouseOut={function (e) {
            if (!loading && avatarUrl.trim()) {
                e.target.style.backgroundColor = "#3b82f6";
                e.target.style.transform = "translateY(0)";
            }
        }}>
            {loading ? "Setting..." : "Set Custom Avatar"}
          </button>
        </div>
      </div>

      {/* Reset to Google */}
      {hasCustomAvatar && auth.user.image && (<div style={{
                marginBottom: "32px",
                padding: "20px",
                backgroundColor: "#0f172a",
                borderRadius: "12px",
                border: "1px solid #1e293b",
                textAlign: "center"
            }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#94a3b8" }}>
            Want to go back to your Google avatar?
          </p>
          <button onClick={handleResetAvatar} disabled={loading} style={{
                padding: "12px 24px",
                backgroundColor: loading ? "#4b5563" : "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }} onMouseOver={function (e) {
                if (!loading) {
                    e.target.style.backgroundColor = "#4b5563";
                    e.target.style.transform = "translateY(-1px)";
                }
            }} onMouseOut={function (e) {
                if (!loading) {
                    e.target.style.backgroundColor = "#6b7280";
                    e.target.style.transform = "translateY(0)";
                }
            }}>
            {loading ? "Resetting..." : "Reset to Google Avatar"}
          </button>
        </div>)}

      {/* Messages */}
      {error && (<div style={{
                marginBottom: "20px",
                padding: "16px 20px",
                backgroundColor: "#1e1b1b",
                border: "2px solid #dc2626",
                borderRadius: "12px",
                color: "#fca5a5",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 4px 6px rgba(220, 38, 38, 0.1)"
            }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            {error}
          </div>
        </div>)}

      {success && (<div style={{
                marginBottom: "20px",
                padding: "16px 20px",
                backgroundColor: "#0f1f0f",
                border: "2px solid #16a34a",
                borderRadius: "12px",
                color: "#86efac",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 4px 6px rgba(22, 163, 74, 0.1)"
            }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>✅</span>
            {success}
          </div>
        </div>)}

      {/* Close button */}
      {onClose && (<div style={{
                marginTop: "32px",
                textAlign: "center",
                paddingTop: "24px",
                borderTop: "1px solid #334155"
            }}>
          <button onClick={onClose} style={{
                padding: "14px 32px",
                backgroundColor: "#374151",
                color: "#e2e8f0",
                border: "1px solid #4b5563",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }} onMouseOver={function (e) {
                e.target.style.backgroundColor = "#4b5563";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            }} onMouseOut={function (e) {
                e.target.style.backgroundColor = "#374151";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}>
            Close
          </button>
        </div>)}

      {/* CSS for placeholder styling */}
      <style>{"\n        input::placeholder {\n          color: #64748b !important;\n        }\n      "}</style>
    </div>);
}
