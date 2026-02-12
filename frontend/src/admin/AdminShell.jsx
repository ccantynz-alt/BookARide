import React from "react";

export default function AdminShell({ children }) {
  const logout = () => {
    localStorage.removeItem("HIBI_ADMIN_TOKEN");
    window.location.href = "/admin/login";
  };

  return (
    <div style={{ fontFamily: "system-ui, Segoe UI, Arial" }}>
      <div style={{ display: "flex", gap: 16, padding: 14, background: "#111", color: "#fff", alignItems: "center" }}>
        <a href="/admin/bookings" style={{ color: "#fff" }}>Bookings</a>
        <a href="/admin/cockpit" style={{ color: "#fff" }}>Cockpit</a>
        <a href="/service-areas" style={{ color: "#fff" }}>Public Site</a>
        <button onClick={logout} style={{ marginLeft: "auto", padding: "8px 10px", cursor: "pointer" }}>Logout</button>
      </div>
      {children}
    </div>
  );
}