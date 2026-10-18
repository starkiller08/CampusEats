// Mock data for the Staff / Owner prototype.
// Shapes mirror the planned MySQL tables (outlets, menu_items, orders,
// order_items, promotions) so the screens can later be wired to the REST API.

export const ORDER_STAGES = ["received", "preparing", "ready", "completed"];

export const STATUS_LABELS = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready for collection",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const CATEGORIES = ["Breakfast", "Lunch", "Snacks", "Coffee", "Drinks"];

export const ALLERGENS = ["Gluten", "Dairy", "Egg", "Nuts", "Soy", "Sesame", "Fish"];
export const DIETARY = ["Vegetarian", "Vegan", "Gluten free", "Halal"];

export const TIERS = { student: "Student", staff: "UOW Staff", public: "Public" };

export const outlets = [
  { id: "ugc", name: "Uni Grounds Cafe", campus: "Wollongong", building: "Building 11" },
  { id: "bgs", name: "Bluestone Grill", campus: "Wollongong", building: "UniCentre" },
  { id: "lsk", name: "Liverpool Spice Kitchen", campus: "Liverpool", building: "Level 1" },
];

const menus = {
  ugc: [
    { id: "m1", name: "Avocado Toast", category: "Breakfast", price: 12.0, staffPrice: 10.8, emoji: "🥑", description: "Sourdough, smashed avocado, feta, seeds", allergens: ["Gluten", "Dairy", "Sesame"], dietary: ["Vegetarian"], prepMins: 6, available: true },
    { id: "m2", name: "Chicken Wrap", category: "Lunch", price: 10.0, staffPrice: 9.0, emoji: "🌯", description: "Grilled chicken, salad, garlic aioli", allergens: ["Gluten", "Egg"], dietary: ["Halal"], prepMins: 5, available: true },
    { id: "m3", name: "Iced Latte", category: "Coffee", price: 5.0, staffPrice: 4.5, emoji: "🧋", description: "Double shot, ice, choice of milk", allergens: ["Dairy"], dietary: ["Vegetarian", "Gluten free"], prepMins: 3, available: true },
    { id: "m4", name: "Blueberry Muffin", category: "Snacks", price: 4.5, staffPrice: 4.0, emoji: "🧁", description: "Baked fresh each morning", allergens: ["Gluten", "Dairy", "Egg"], dietary: ["Vegetarian"], prepMins: 1, available: false },
    { id: "m5", name: "Flat White", category: "Coffee", price: 4.8, staffPrice: 4.3, emoji: "☕", description: "Double ristretto, steamed milk", allergens: ["Dairy"], dietary: ["Vegetarian", "Gluten free"], prepMins: 3, available: true },
    { id: "m6", name: "Burger Combo", category: "Lunch", price: 18.0, staffPrice: 16.2, emoji: "🍔", description: "Beef burger, chips and a soft drink", allergens: ["Gluten", "Dairy", "Sesame"], dietary: ["Halal"], prepMins: 10, available: true },
    { id: "m7", name: "Acai Bowl", category: "Breakfast", price: 13.5, staffPrice: 12.2, emoji: "🫐", description: "Acai, banana, granola, honey", allergens: ["Nuts"], dietary: ["Vegetarian"], prepMins: 5, available: true },
    { id: "m8", name: "Vegan Buddha Bowl", category: "Lunch", price: 14.0, staffPrice: 12.6, emoji: "🥗", description: "Quinoa, roast pumpkin, chickpeas, tahini", allergens: ["Sesame"], dietary: ["Vegan", "Gluten free"], prepMins: 7, available: true },
    { id: "m9", name: "Banana Bread", category: "Snacks", price: 5.5, staffPrice: 5.0, emoji: "🍞", description: "Toasted with whipped butter", allergens: ["Gluten", "Dairy", "Egg", "Nuts"], dietary: ["Vegetarian"], prepMins: 3, available: true },
    { id: "m10", name: "Mango Smoothie", category: "Drinks", price: 7.5, staffPrice: 6.8, emoji: "🥭", description: "Mango, yoghurt, honey", allergens: ["Dairy"], dietary: ["Vegetarian", "Gluten free"], prepMins: 4, available: true },
  ],
  bgs: [
    { id: "b1", name: "Steak Sandwich", category: "Lunch", price: 16.5, staffPrice: 14.9, emoji: "🥩", description: "Scotch fillet, caramelised onion, rocket", allergens: ["Gluten"], dietary: [], prepMins: 12, available: true },
    { id: "b2", name: "Fish & Chips", category: "Lunch", price: 15.0, staffPrice: 13.5, emoji: "🐟", description: "Beer-battered flathead, tartare", allergens: ["Gluten", "Fish", "Egg"], dietary: [], prepMins: 10, available: true },
    { id: "b3", name: "Loaded Fries", category: "Snacks", price: 9.0, staffPrice: 8.1, emoji: "🍟", description: "Cheese sauce, bacon, spring onion", allergens: ["Dairy"], dietary: [], prepMins: 6, available: true },
    { id: "b4", name: "Lemon Lime Bitters", category: "Drinks", price: 5.0, staffPrice: 4.5, emoji: "🍋", description: "House-made, served cold", allergens: [], dietary: ["Vegan", "Gluten free"], prepMins: 1, available: true },
  ],
  lsk: [
    { id: "l1", name: "Butter Chicken", category: "Lunch", price: 14.0, staffPrice: 12.6, emoji: "🍛", description: "With basmati rice and naan", allergens: ["Dairy", "Gluten"], dietary: ["Halal"], prepMins: 8, available: true },
    { id: "l2", name: "Vegetable Samosas", category: "Snacks", price: 6.0, staffPrice: 5.4, emoji: "🥟", description: "Two samosas with tamarind chutney", allergens: ["Gluten"], dietary: ["Vegan"], prepMins: 4, available: true },
    { id: "l3", name: "Mango Lassi", category: "Drinks", price: 5.5, staffPrice: 5.0, emoji: "🥤", description: "Sweet yoghurt drink", allergens: ["Dairy"], dietary: ["Vegetarian", "Gluten free"], prepMins: 2, available: true },
  ],
};

const customers = [
  { name: "Emma Lee", email: "ysd2334@uowmail.edu.au", tier: "student" },
  { name: "Jack Chen", email: "zxy7781@uowmail.edu.au", tier: "student" },
  { name: "Sophia Nguyen", email: "kmn4421@uowmail.edu.au", tier: "student" },
  { name: "Liam Brown", email: "trw9930@uowmail.edu.au", tier: "student" },
  { name: "Dr. Priya Raman", email: "praman@uow.edu.au", tier: "staff" },
  { name: "Noah Wilson", email: "nw552@uowmail.edu.au", tier: "student" },
  { name: "Mia Patel", email: "mia.patel@gmail.com", tier: "public" },
  { name: "Oliver Smith", email: "osmith@uow.edu.au", tier: "staff" },
  { name: "Ava Martin", email: "am881@uowmail.edu.au", tier: "student" },
  { name: "Lucas Garcia", email: "lg204@uowmail.edu.au", tier: "student" },
];

// Small seeded RNG so generated data is identical on every load.
export function seeded(seed) {
  // Scramble the seed first so neighbouring seeds (e.g. consecutive days) diverge.
  let s = Math.abs(Math.imul(seed ^ 0x5bd1e995, 0x27d4eb2d)) % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  next();
  next();
  return next;
}

const pickupCode = (rand) => String(1000 + Math.floor(rand() * 9000));

function line(item, qty, tier, note) {
  const unit = tier === "staff" ? item.staffPrice : item.price;
  return { menuId: item.id, name: item.name, emoji: item.emoji, qty, unitPrice: unit, note: note || "" };
}

export function orderTotal(items) {
  return Math.round(items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0) * 100) / 100;
}

// Today's live orders, timestamped relative to now so the demo always looks current.
function seedOrders(outletId, now) {
  const menu = menus[outletId];
  const rand = seeded(outletId.charCodeAt(0) * 31 + outletId.length);
  const min = 60 * 1000;
  const blueprint = outletId === "ugc"
    ? [
        { c: 0, items: [[1, 1], [2, 1]], status: "preparing", ago: 9 },
        { c: 1, items: [[0, 1]], status: "completed", ago: 48 },
        { c: 2, items: [[3, 1], [2, 1]], status: "preparing", ago: 6 },
        { c: 3, items: [[5, 1]], status: "completed", ago: 35, refund: { status: "requested", reason: "Burger was cold on pickup", amount: 18 } },
        { c: 4, items: [[4, 2], [8, 1]], status: "ready", ago: 12 },
        { c: 5, items: [[6, 1], [9, 1]], status: "received", ago: 2, note: "No honey please" },
        { c: 6, items: [[7, 1]], status: "received", ago: 1 },
        { c: 7, items: [[4, 1]], status: "ready", ago: 15 },
        { c: 8, items: [[1, 2], [2, 2]], status: "completed", ago: 70, refund: { status: "requested", reason: "Charged twice for one wrap", amount: 10 } },
        { c: 9, items: [[0, 1], [4, 1]], status: "completed", ago: 95 },
        { c: 2, items: [[2, 1]], status: "completed", ago: 120, refund: { status: "approved", reason: "Wrong milk used", amount: 5 } },
        { c: 0, items: [[5, 1], [9, 1]], status: "cancelled", ago: 140 },
      ]
    : [
        { c: 3, items: [[0, 1]], status: "received", ago: 3 },
        { c: 6, items: [[1, 1], [2, 1]], status: "preparing", ago: 8 },
        { c: 7, items: [[0, 1]], status: "completed", ago: 50 },
      ];

  return blueprint.map((b, i) => {
    const customer = customers[b.c];
    const items = b.items
      .filter(([idx]) => menu[idx])
      .map(([idx, qty]) => line(menu[idx], qty, customer.tier));
    const placedAt = now - b.ago * min;
    return {
      id: `${outletId}-${1024 + i}`,
      number: 1024 + i,
      outletId,
      customer,
      items,
      total: orderTotal(items),
      placedAt,
      pickupAt: placedAt + (15 + Math.floor(rand() * 4) * 5) * min,
      status: b.status,
      pickupCode: pickupCode(rand),
      payment: { method: "Card (sandbox)", status: b.status === "cancelled" ? "refunded" : "paid" },
      refund: b.refund ? { ...b.refund, requestedAt: placedAt + 20 * min } : null,
      note: b.note || "",
    };
  });
}

function seedPromotions(outletId, now) {
  const day = 24 * 60 * 60 * 1000;
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  if (outletId !== "ugc") {
    return [
      { id: `${outletId}-p1`, title: "Student lunch deal", type: "percent", value: 10, scope: "category", target: "Lunch", audience: "student", start: iso(now - 3 * day), end: iso(now + 10 * day), active: true },
    ];
  }
  return [
    { id: "ugc-p1", title: "Exam week coffee", type: "percent", value: 20, scope: "category", target: "Coffee", audience: "student", start: iso(now - 2 * day), end: iso(now + 12 * day), active: true },
    { id: "ugc-p2", title: "$3 off Burger Combo", type: "fixed", value: 3, scope: "item", target: "m6", audience: "all", start: iso(now - 1 * day), end: iso(now + 5 * day), active: true },
    { id: "ugc-p3", title: "O-Week welcome", type: "percent", value: 15, scope: "all", target: "", audience: "all", start: iso(now - 40 * day), end: iso(now - 26 * day), active: false },
  ];
}

const defaultSettings = {
  acceptingOrders: true,
  autoAccept: false,
  pickupSlotMins: 10,
  maxOrdersPerSlot: 8,
  hours: {
    Mon: ["07:30", "16:00"], Tue: ["07:30", "16:00"], Wed: ["07:30", "16:00"],
    Thu: ["07:30", "16:00"], Fri: ["07:30", "15:00"], Sat: null, Sun: null,
  },
};

export function buildInitialState(now = Date.now()) {
  const data = {};
  for (const o of outlets) {
    data[o.id] = {
      menu: menus[o.id].map((m) => ({ ...m })),
      orders: seedOrders(o.id, now),
      promotions: seedPromotions(o.id, now),
      settings: JSON.parse(JSON.stringify(defaultSettings)),
    };
  }
  return { outletId: "ugc", role: "owner", nextOrderNumber: 1040, data, seededAt: now };
}

export function randomCustomer(rand = Math.random) {
  return customers[Math.floor(rand() * customers.length)];
}

export { line as makeOrderLine, pickupCode as makePickupCode };
