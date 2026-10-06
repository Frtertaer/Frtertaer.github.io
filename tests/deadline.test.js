const assert = require("assert");
const fs = require("fs");
const path = require("path");
const rules = require("../js/rules.js");

function holidayStore() {
  return {
    id: "fixture",
    name: "Fixture",
    market: "test",
    days: 30,
    holiday: { start: "2025-11-01", end: "2025-12-31", until: "2026-01-31" },
    source: "https://example.invalid/not-a-store",
  };
}

const ikea = rules.storeById("ikea");
const amazon = rules.storeById("amazon");
const apple = rules.storeById("apple");
const hm = rules.storeById("hm");

assert.strictEqual(rules.addDays("2026-01-31", 1), "2026-02-01");
assert.strictEqual(rules.addDays("2024-02-28", 1), "2024-02-29");
assert.strictEqual(rules.addDays("2026-02-28", 1), "2026-03-01");
assert.strictEqual(rules.addDays("2026-10-06", 30), "2026-11-05");
assert.strictEqual(rules.addDays("2026-10-06", 14), "2026-10-20");
assert.strictEqual(rules.addDays("2026-10-06", 365), "2027-10-06");

assert.strictEqual(rules.lastReturnDay(ikea, "2026-01-01", "2026-10-06").lastDay, "2027-01-01");
assert.strictEqual(rules.lastReturnDay(ikea, "2026-10-06", "2026-10-06").lastDay, "2027-10-06");
assert.strictEqual(ikea.title, "IKEA UK return window: last day from the receipt date");
assert.ok(amazon.source.indexOf("amazon.co.uk") !== -1);
assert.ok(rules.storeById("zalando").source.indexOf("zalando.co.uk") !== -1);
assert.ok(apple.source.indexOf("apple.com/uk") !== -1);
assert.strictEqual(amazon.anchor, "delivery");
assert.strictEqual(apple.anchor, "delivery");
assert.strictEqual(ikea.anchor, "purchase");
assert.strictEqual(rules.lastReturnDay(amazon, "2026-10-01", "2026-10-06").lastDay, "2026-10-31");
assert.strictEqual(rules.lastReturnDay(apple, "2026-10-06", "2026-10-06").lastDay, "2026-10-20");
assert.strictEqual(rules.lastReturnDay(hm, "2026-10-01", "2026-10-06", { sale: true }).daysUsed, 14);
assert.strictEqual(rules.lastReturnDay(hm, "2026-10-01", "2026-10-06").daysUsed, 30);

const extended = rules.lastReturnDay(holidayStore(), "2025-12-15", "2025-12-20");
assert.strictEqual(extended.lastDay, "2026-01-31");
assert.strictEqual(extended.holidayApplied, true);
const noHoliday = rules.lastReturnDay(holidayStore(), "2026-10-06", "2026-10-06");
assert.strictEqual(noHoliday.holidayApplied, false);
assert.strictEqual(noHoliday.lastDay, "2026-11-05");
assert.strictEqual(amazon.holiday, undefined);

assert.strictEqual(rules.lastReturnDay(apple, "2026-09-01", "2026-10-06").sellable, false);
assert.strictEqual(rules.lastReturnDay(apple, "2026-10-06", "2026-10-20").sellable, true);
assert.strictEqual(rules.lastReturnDay(apple, "2026-10-07", "2026-10-06").reason, "future");

const one = rules.parseReceiptDates("IKEA\n06.10.2026 14:22\nTOTAL 12.40", "2026-10-06");
assert.strictEqual(one.auto, "2026-10-06");
assert.strictEqual(rules.parseReceiptDates("Date: October 6, 2026", "2026-10-06").auto, "2026-10-06");
assert.strictEqual(rules.parseReceiptDates("6 октября 2026", "2026-10-06").auto, "2026-10-06");
const ambiguous = rules.parseReceiptDates("bought 06/10/2026", "2026-10-06");
assert.strictEqual(ambiguous.auto, null);
assert.strictEqual(ambiguous.ambiguous.length, 1);
assert.deepStrictEqual(ambiguous.ambiguous[0].options, ["2026-10-06", "2026-06-10"]);
assert.strictEqual(rules.parseReceiptDates("32.13.2026", "2026-10-06").candidates.length, 0);
assert.strictEqual(rules.parseReceiptDates("15.01.2020", "2026-10-06").auto, null);
assert.strictEqual(rules.parseReceiptDates("07/13/2026", "2026-10-06").auto, "2026-07-13");

const ics = rules.buildIcs({
  storeId: "ikea",
  storeName: "IKEA",
  market: "Великобритания",
  anchor: "2026-10-06",
  lastDay: "2027-10-06",
  source: ikea.source,
});
assert.ok(ics.includes("DTSTART;VALUE=DATE:20271006"));
assert.ok(ics.includes("TRIGGER:-P1D"));
assert.ok(ics.includes("BEGIN:VALARM"));
assert.ok(!ics.includes("localStorage"));

const layout = rules.stampLayout(640, 800, 88);
assert.strictEqual(layout.deadline.inTopMargin, true);
assert.strictEqual(layout.footer.inBottomMargin, true);

assert.strictEqual(rules.unlockMatches(
  { storeId: "ikea", anchor: "2026-10-06", lastDay: "2027-10-06", sale: false },
  { storeId: "ikea", anchor: "2026-10-06", lastDay: "2027-10-06", sale: false }
), true);
assert.strictEqual(rules.unlockMatches(
  { storeId: "ikea", anchor: "2026-10-06", lastDay: "2027-10-06", sale: false },
  { storeId: "ikea", anchor: "2026-10-07", lastDay: "2027-10-07", sale: false }
), false);

assert.strictEqual(rules.stores.length, 5);
const ids = rules.stores.map(function (store) { return store.id; });
assert.deepStrictEqual(ids, ["ikea", "amazon", "zalando", "hm", "apple"]);
rules.stores.forEach(function (store) {
  assert.ok(store.source.startsWith("https://"));
  assert.strictEqual(store.checked, "2026-10-06");
  assert.ok(store.days === 14 || store.days === 30 || store.days === 365);
  assert.ok(store.rule.includes(String(store.days)));
});
assert.strictEqual(rules.PRICE_EUR, 2);

const app = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
["localStorage", "sessionStorage", "indexedDB", "document.cookie"].forEach(function (banned) {
  assert.ok(!app.includes(banned), banned);
});

const root = path.join(__dirname, "..");
const titles = new Set();
["index.html", "ikea/index.html", "amazon/index.html", "zalando/index.html", "hm/index.html", "apple/index.html"].forEach(function (rel) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(!titles.has(title), title);
  titles.add(title);
  assert.ok(html.includes("2 €") || html.includes("2&nbsp;€") || rel === "index.html");
});
rules.stores.forEach(function (store) {
  const html = fs.readFileSync(path.join(root, store.page), "utf8");
  assert.ok(html.includes(store.source), store.id);
  assert.ok(html.includes(store.title.replace(/&/g, "&amp;")), store.id);
  assert.ok(!html.includes("does not charge a card"), store.id);
  assert.ok(!/касс|checkout/i.test(html), store.id);
  assert.ok(html.includes("Open the files for this purchase"), store.id);
});

assert.ok(app.includes("https://mergescribe.gumroad.com/l/return-files?wanted=true&ReceiptDate="), "pay-url");
assert.ok(!app.includes("does not charge a card"), "app-card");
