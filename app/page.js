import Link from "next/link";

// Prototype entry point. Each team member's module links in from here.
const portals = [
  { href: "/staff", title: "Staff / Owner Portal", desc: "Live orders, menu, promotions and sales analytics.", ready: true },
  { href: "#", title: "Customer Ordering", desc: "Campus selection, outlets, menus, cart and checkout.", ready: false },
  { href: "#", title: "Admin Console", desc: "Users, campuses, outlets and audit records.", ready: false },
];

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-brand">
        <span className="logo-mark">🍴</span>
        <h1>CampusEats</h1>
      </div>
      <p className="landing-sub">Centralized food ordering for UOW campuses. Prototype build.</p>
      <div className="landing-grid">
        {portals.map((p) =>
          p.ready ? (
            <Link key={p.title} href={p.href} className="card landing-card">
              <h2>{p.title}</h2>
              <p>{p.desc}</p>
              <span className="btn btn-primary btn-sm">Open</span>
            </Link>
          ) : (
            <div key={p.title} className="card landing-card is-disabled">
              <h2>{p.title}</h2>
              <p>{p.desc}</p>
              <span className="pill pill-muted">In progress</span>
            </div>
          )
        )}
      </div>
    </main>
  );
}
