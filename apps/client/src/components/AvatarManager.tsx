import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface AvatarManagerProps {
  onAvatarUpdate?: () => void;
  onClose?: () => void;
}

export default function AvatarManager({ onAvatarUpdate, onClose }: AvatarManagerProps) {
  const { auth, refresh } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form values from user data
  useEffect(() => {
    if (auth.user?.avatarUrl) {
      setAvatarUrl(auth.user.avatarUrl);
    } else {
      setAvatarUrl("");
    }
    if (auth.user?.username) {
      setUsername(auth.user.username);
    } else {
      setUsername("");
    }
  }, [auth.user?.avatarUrl, auth.user?.username]);

  const handleSetAvatar = async () => {
    if (!avatarUrl.trim()) {
      setError("Please enter an avatar URL");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`${API}/api/user/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: avatarUrl.trim() }),
      });
      setSuccess("Avatar updated successfully!");
      setAvatarUrl("");
      refresh(); // Refresh auth context to get updated user data
      onAvatarUpdate?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAvatar = async () => {
    if (!confirm("Reset to Google avatar? This will remove your custom avatar.")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`${API}/api/user/avatar/reset`, {
        method: "PATCH",
      });
      setSuccess("Avatar reset to Google image!");
      refresh(); // Refresh auth context to get updated user data
      onAvatarUpdate?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleSetUsername = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`${API}/api/user/username`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() || null }),
      });
      setSuccess("Username updated successfully!");
      refresh(); // Refresh auth context to get updated user data
      onAvatarUpdate?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update username");
    } finally {
      setLoading(false);
    }
  };

  if (!auth.user) return null;

  const currentAvatar = auth.user.avatarUrl || auth.user.image;
  const hasCustomAvatar = !!auth.user.avatarUrl;

  // Generate initials from name or email
  const getInitials = (name?: string | null, email?: string) => {
    const text = name || email || "U";
    const parts = text.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(auth.user.name, auth.user.email);

  return (
    <div style={{
      padding: "24px 32px",
      borderRadius: "16px",
      backgroundColor: "#1e293b",
      maxWidth: "600px",
      width: "100%",
      margin: "20px auto",
      color: "#e2e8f0",
      border: "1px solid #334155",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      position: "relative",
      maxHeight: "80vh",
      overflowY: "auto"
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
          {currentAvatar ? (
            <img 
              src={currentAvatar} 
              alt="Current avatar" 
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #64748b",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
              }}
              onError={(e) => {
                // Hide the broken image and show initials
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div 
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              display: currentAvatar ? "none" : "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "28px",
              fontWeight: "700",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
            }}
          >
            {initials}
          </div>
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
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder={auth.user.username || "Leave empty to use name/email"} 
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "2px solid #475569",
              borderRadius: "10px",
              fontSize: "14px",
              backgroundColor: "#0f172a",
              color: "#e2e8f0",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#475569";
              e.target.style.boxShadow = "none";
            }}
          />
          <button 
            onClick={handleSetUsername} 
            disabled={loading} 
            style={{
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
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#15803d";
                e.target.style.transform = "translateY(-1px)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#16a34a";
                e.target.style.transform = "translateY(0)";
              }
            }}
          >
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
          <input 
            type="url" 
            value={avatarUrl} 
            onChange={(e) => setAvatarUrl(e.target.value)} 
            placeholder="https://example.com/avatar.jpg" 
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "2px solid #475569",
              borderRadius: "10px",
              fontSize: "14px",
              backgroundColor: "#0f172a",
              color: "#e2e8f0",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#475569";
              e.target.style.boxShadow = "none";
            }}
          />
          <button 
            onClick={handleSetAvatar} 
            disabled={loading || !avatarUrl.trim()} 
            style={{
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
            }}
            onMouseOver={(e) => {
              if (!loading && avatarUrl.trim()) {
                e.target.style.backgroundColor = "#2563eb";
                e.target.style.transform = "translateY(-1px)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading && avatarUrl.trim()) {
                e.target.style.backgroundColor = "#3b82f6";
                e.target.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "Setting..." : "Set Custom Avatar"}
          </button>
        </div>
      </div>

      {/* Reset to Google */}
      {hasCustomAvatar && auth.user.image && (
        <div style={{
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
          <button 
            onClick={handleResetAvatar} 
            disabled={loading} 
            style={{
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
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#4b5563";
                e.target.style.transform = "translateY(-1px)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#6b7280";
                e.target.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "Resetting..." : "Reset to Google Avatar"}
          </button>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div style={{
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
        </div>
      )}

      {success && (
        <div style={{
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
        </div>
      )}

      {/* Close button */}
      {onClose && (
        <div style={{
          marginTop: "32px",
          textAlign: "center",
          paddingTop: "24px",
          borderTop: "1px solid #334155"
        }}>
          <button 
            onClick={onClose} 
            style={{
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
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#4b5563";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#374151";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* CSS for placeholder styling */}
      <style>
        {`
          input::placeholder {
            color: #64748b !important;
          }
        `}
      </style>
    </div>
  );
}
