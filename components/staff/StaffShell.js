"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { useStaff } from "@/lib/staff/StaffStore";

// `roles` = who can see the page. Counter staff run the live order board;
// outlet owners/managers also manage the menu, promotions and reports (FR8-FR11).
export const NAV = [
  { href: "/staff", label: "Dashboard", icon: "dashboard", roles: ["owner", "staff"] },
  { href: "/staff/orders", label: "Orders", icon: "orders", roles: ["owner", "staff"] },
  { href: "/staff/menu", label: "Menu", icon: "menu", roles: ["owner"] },
  { href: "/staff/promotions", label: "Promotions", icon: "promo", roles: ["owner"] },
  { href: "/staff/analytics", label: "Analytics", icon: "analytics", roles: ["owner"] },
  { href: "/staff/settings", label: "Settings", icon: "settings", roles: ["owner", "staff"] },
];

export const ROLE_LABELS = { owner: "Outlet Owner", staff: "Counter Staff" };

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

export default function StaffShell({ children }) {
  const pathname = usePathname();
  const { outlet, outlets, outletId, role, orders, settings, actions } = useStaff();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  useClickOutside(profileRef, () => setProfileOpen(false));

  const newOrders = orders.filter((o) => o.status === "received").length;
  const nav = NAV.filter((n) => n.roles.includes(role));
  const isActive = (href) => (href === "/staff" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/staff" className="brand">
          <span className="logo-mark">🍴</span>
          <span className="brand-name">CampusEats</span>
          <span className="brand-tag">Staff</span>
        </Link>

        <div className="topbar-right">
          <span className={`live-dot ${settings.acceptingOrders ? "" : "is-paused"}`}>
            {settings.acceptingOrders ? "Accepting orders" : "Ordering paused"}
          </span>
          <label className="outlet-select">
            <span className="sr-only">Outlet</span>
            <select value={outletId} onChange={(e) => actions.setOutlet(e.target.value)}>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.name} · {o.campus}</option>
              ))}
            </select>
            <Icon name="chevron" size={16} />
          </label>
          <div className="profile" ref={profileRef}>
            <button className="avatar-btn" onClick={() => setProfileOpen((v) => !v)} aria-label="Account menu" aria-expanded={profileOpen}>
              <Icon name="user" />
            </button>
            {profileOpen && (
              <div className="dropdown">
                <div className="dropdown-head">
                  <strong>Sam Taylor</strong>
                  <span className="muted">{ROLE_LABELS[role]} · {outlet.name}</span>
                </div>
                <div className="dropdown-label">Preview as role</div>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`dropdown-item ${role === key ? "is-active" : ""}`}
                    onClick={() => { actions.setRole(key); setProfileOpen(false); }}
                  >
                    {label}
                    {role === key && <Icon name="check" size={16} />}
                  </button>
                ))}
                <hr />
                <Link href="/" className="dropdown-item"><span>Sign out</span><Icon name="logout" size={16} /></Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="sidebar" aria-label="Staff navigation">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={`nav-item ${isActive(n.href) ? "is-active" : ""}`}>
            <span className="nav-icon">
              <Icon name={n.icon} size={22} />
              {n.href === "/staff/orders" && newOrders > 0 && <span className="badge">{newOrders}</span>}
            </span>
            <span className="nav-label">{n.label}</span>
          </Link>
        ))}
      </nav>

      <main className="content">{children}</main>
    </div>
  );
}

// Page-level guard: shows an access notice instead of owner-only screens.
export function RoleGuard({ allow, children }) {
  const { role, actions } = useStaff();
  if (allow.includes(role)) return children;
  return (
    <div className="card access-denied">
      <Icon name="alert" size={32} />
      <h2>Owner access only</h2>
      <p className="muted">
        You are signed in as {ROLE_LABELS[role]}. Menu, promotions and sales reports are limited to the outlet owner or manager.
      </p>
      <div className="row">
        <Link href="/staff/orders" className="btn btn-primary">Go to orders</Link>
        <button className="btn btn-ghost" onClick={() => actions.setRole("owner")}>Preview as owner</button>
      </div>
    </div>
  );
}
