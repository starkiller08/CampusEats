# CampusEats
A centralized food ordering system for the University of Wollongong (UOW) campuses

CSIT321 Capstone Project, Group 2. This repository holds the interactive frontend prototype (A3).

## Running the prototype

Requires Node.js 18.18 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Tech: Next.js (App Router) + React, plain CSS. Data is mocked on the client and saved to the browser's
localStorage, so changes survive a refresh. Settings → **Reset demo data** restores the sample data before a demo.

## Project structure

```
app/                  Routes (one folder per screen)
  staff/              Module 4: Staff / Owner portal
components/staff/     UI components for the staff portal
lib/staff/            Mock data, client store, formatting and analytics helpers
app/globals.css       Shared design tokens and styles (green CampusEats theme)
```

Other modules should add their own folders (e.g. `app/(customer)/...`, `app/admin/...`) and reuse the
tokens and classes in `globals.css` (`.btn`, `.card`, `.pill`, `.tabs`, `.table`, `.field`, ...) so every
screen looks consistent.

## Module 4: Staff / Owner Operations (Sarim Khan)

| Route | Screen | Requirements |
|---|---|---|
| `/staff` | **Staff Dashboard**: active orders, queue size and estimated wait, live status counts, incoming orders with one-tap accept, alerts (refunds, unavailable items, uncollected orders), pause online ordering | FR8 |
| `/staff/orders` | **Order Management**: live board (New, Preparing, Ready for collection) and searchable list with filters. Accept, mark ready (notifies customer), confirm pickup with the customer's 4-digit code, cancel with reason (auto refund), review refund requests, issue partial/full refunds | FR8, FR7 (staff side) |
| `/staff/menu` | **Menu Management**: add, edit and delete items, regular and UOW staff pricing, prep time, allergen and dietary tags, availability toggle | FR9 |
| `/staff/promotions` | **Promotions**: percentage or fixed discounts on the menu, a category or an item, by account tier, with date ranges | FR10 |
| `/staff/analytics` | **Basic Analytics**: revenue, orders, average order value and refund rate vs previous period; daily sales; peak hours; top items; orders by customer tier; CSV export | FR11 |
| `/staff/settings` | Outlet settings: ordering on/off, auto-accept, pickup slot size, max orders per slot, opening hours | FR9 (hours) |

**Roles:** use the account menu (top right) to preview as *Outlet Owner* (all screens) or *Counter Staff*
(dashboard, orders and settings only). The outlet switcher previews the other sample outlets.

**Demo tip:** press **Simulate order** on the Dashboard or Orders screen to create a new incoming order.

Each reducer action in `lib/staff/StaffStore.js` is annotated with the REST endpoint it will call once the
Node/Express + MySQL backend is built.
