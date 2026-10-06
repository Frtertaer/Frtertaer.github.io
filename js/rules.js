(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Returnline = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const CHECKED = "2026-10-06";
  const PRICE_EUR = 2;

  const stores = [
    {
      id: "ikea",
      name: "IKEA",
      market: "United Kingdom",
          days: 365,
          anchor: "purchase",
          anchorLabel: "Receipt date",
          source: "https://www.ikea.com/gb/en/customer-service/returns-claims/return-policy/",
          checked: CHECKED,
          page: "ikea/index.html",
          title: "IKEA UK return window: last day from the receipt date",
          description: "IKEA UK return window: last day from the receipt date. IKEA return policy is 365 days from the date on the receipt. The date is free.",
          lead: "Enter the date on the receipt. The page shows the last day. The date is free. A purchase on 6 October 2026 has a last day of 6 October 2027.",
          rule: "IKEA UK takes an unused item in its packaging, and an item you opened and checked, within 365 days. You need the receipt. Exceptions: food, plants, custom-made goods and items marked as is. The last day is the receipt date plus 365 calendar days. The receipt date is day 0. A purchase on 6 October 2026 has a last day of 6 October 2027.",
    },
    {
      id: "amazon",
      name: "Amazon",
      market: "United Kingdom",
days: 30,
anchor: "delivery",
anchorLabel: "Delivery date",
source: "https://www.amazon.co.uk/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7",
checked: CHECKED,
page: "amazon/index.html",
title: "Amazon UK return window: last day from the delivery date",
description: "Amazon UK return window: last day from the delivery date. 30 days from receipt of delivery, not the till date. The date is free.",
lead: "Most Amazon.co.uk orders can be returned within 30 days of delivery. Enter the delivery date. The till date is not the anchor. If the order states another date, that date wins.",
rule: "Amazon.co.uk: most items can be returned within 30 days of the delivery date. Some categories have a different window on the product page, and that window wins. A 2026 holiday extension was not on the public UK page when this was checked on 6 October 2026, so this page does not apply one. The delivery date is day 0. The till date is not the anchor.",
    },
    {
      id: "zalando",
      name: "Zalando",
      market: "United Kingdom",
days: 30,
anchor: "delivery",
anchorLabel: "Delivery date",
source: "https://www.zalando.co.uk/zalando-terms/",
checked: CHECKED,
page: "zalando/index.html",
title: "Zalando UK return window: last day from the delivery date",
description: "Zalando UK return window: last day from the delivery date. Last day to return a Zalando.co.uk order is 30 days after delivery. The date is free.",
lead: "Zalando.co.uk gives 30 days for a voluntary return from the delivery date. Enter that date. The legal cancellation right is shorter: 14 days. The till date is not the anchor.",
rule: "Zalando UK: voluntary returns within 30 days of receiving an order on zalando.co.uk. The legal cancellation right is 14 days. This page counts the 30 days the UK page publishes, from the delivery date you enter. A partner's window can differ and is on the product page. The till date is not the anchor.",
    },
    {
      id: "hm",
      name: "H&M",
      market: "United Kingdom",
days: 30,
saleDays: 14,
anchor: "delivery",
anchorLabel: "Delivery date, or the in-store purchase date",
source: "https://www2.hm.com/en_gb/customer-service/return-link.html",
checked: CHECKED,
page: "hm/index.html",
title: "H&M UK return window: last day from the delivery date",
description: "H&M UK return window: last day from the delivery date. 30 days, or 14 days on sale items. The date is free.",
lead: "H&M UK: an ordinary purchase can be returned within 30 days of delivery. A sale item is 14 days. Tick sale if the receipt says it was on sale. This page will not choose between two dates.",
rule: "H&M UK: 30 days after you receive the item, or from the in-store purchase date. Sale items: 14 days. Underwear and cosmetics may not be accepted. If you tick sale, this page counts 14 days, not 30. This page will not choose between two dates on a receipt.",
    },
    {
      id: "apple",
      name: "Apple",
      market: "United Kingdom",
days: 14,
anchor: "delivery",
anchorLabel: "Delivery date",
source: "https://www.apple.com/uk/shop/help/returns_refund",
checked: CHECKED,
page: "apple/index.html",
title: "Apple UK return window: last day from the delivery date",
description: "Apple UK return window: last day from the delivery date. 14 days from delivery, not the till date. The date is free.",
lead: "An Apple UK purchase can be returned within 14 days of the delivery date. Enter that date. The till date is not the anchor. This page will not choose between two dates on a receipt.",
rule: "Apple UK: a purchase from the UK Apple Store or apple.com/uk can be returned within 14 days of the delivery date. Some items cannot be returned. This page counts the delivery date plus 14 calendar days. The delivery date is day 0. The till date is not the anchor. Tell Apple by that day; you then have a further 14 days to send the item back.",
    },
  ];

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function todayIso(now) {
    const dt = now || new Date();
    return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate());
  }

  function isIso(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function isRealDate(year, month, day) {
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const dt = new Date(year, month - 1, day);
    return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
  }

  function addDays(iso, days) {
    if (!isIso(iso) || !Number.isInteger(days)) throw new Error("bad date");
    const parts = iso.split("-").map(Number);
    if (!isRealDate(parts[0], parts[1], parts[2])) throw new Error("bad date");
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    dt.setDate(dt.getDate() + days);
    return todayIso(dt);
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function formatRu(iso) {
    if (!isIso(iso)) throw new Error("bad date");
    const parts = iso.split("-").map(Number);
    return parts[2] + " " + MONTHS[parts[1] - 1] + " " + parts[0];
  }

  function storeById(id) {
    return stores.find(function (store) { return store.id === id; }) || null;
  }

  function lastReturnDay(store, anchorIso, today, opts) {
    opts = opts || {};
    if (!store || !isIso(anchorIso) || !isIso(today)) return { ok: false, reason: "bad-input" };
    const parts = anchorIso.split("-").map(Number);
    if (!isRealDate(parts[0], parts[1], parts[2])) return { ok: false, reason: "bad-input" };
    if (anchorIso > today) return { ok: false, reason: "future" };
    const days = opts.sale && store.saleDays ? store.saleDays : store.days;
    let last = addDays(anchorIso, days);
    let holidayApplied = false;
    const holiday = store.holiday;
    if (holiday && anchorIso >= holiday.start && anchorIso <= holiday.end && holiday.until > last) {
      last = holiday.until;
      holidayApplied = true;
    }
    return {
      ok: true,
      lastDay: last,
      expired: last < today,
      sellable: last >= today,
      holidayApplied: holidayApplied,
      daysUsed: days,
    };
  }

  function expandYear(year) {
    if (year >= 1000) return year;
    return year <= 69 ? 2000 + year : 1900 + year;
  }

  function pushUnique(list, item) {
    const key = item.iso + "|" + item.raw;
    if (!list.some(function (row) { return row.iso + "|" + row.raw === key; })) list.push(item);
  }

  function parseReceiptDates(text, today) {
    const candidates = [];
    const ambiguous = [];
    const source = String(text || "");
    const ru = {
      января: 1, января: 1, февраль: 2, февраля: 2, марта: 3, март: 3,
      апреля: 4, апрель: 4, мая: 5, май: 5, июня: 6, июнь: 6,
      июля: 7, июль: 7, августа: 8, август: 8, сентября: 9, сентябрь: 9,
      октября: 10, октябрь: 10, ноября: 11, ноябрь: 11, декабря: 12, декабрь: 12,
    };
    const en = {
      jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
      apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
      aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
      nov: 11, november: 11, dec: 12, december: 12,
    };

    function consider(year, month, day, raw, forcedAmbiguous) {
      year = expandYear(year);
      if (!isRealDate(year, month, day)) return;
      const iso = year + "-" + pad(month) + "-" + pad(day);
      if (today && iso > today) return;
      if (forcedAmbiguous) return;
      pushUnique(candidates, { iso: iso, raw: raw, ambiguous: false });
    }

    let match;
    const dotted = /\b(\d{1,2})[.](\d{1,2})[.](\d{2}|\d{4})\b/g;
    while ((match = dotted.exec(source))) {
      consider(Number(match[3]), Number(match[2]), Number(match[1]), match[0], false);
    }
    const isoRe = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
    while ((match = isoRe.exec(source))) {
      consider(Number(match[1]), Number(match[2]), Number(match[3]), match[0], false);
    }
    const ruRe = /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/gi;
    while ((match = ruRe.exec(source))) {
      consider(Number(match[3]), ru[match[2].toLowerCase()], Number(match[1]), match[0], false);
    }
    const enRe = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/gi;
    while ((match = enRe.exec(source))) {
      consider(Number(match[3]), en[match[1].toLowerCase()], Number(match[2]), match[0], false);
    }
    const enDayFirst = /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})/gi;
    while ((match = enDayFirst.exec(source))) {
      consider(Number(match[3]), en[match[2].toLowerCase()], Number(match[1]), match[0], false);
    }
    const slashed = /\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/g;
    while ((match = slashed.exec(source))) {
      const a = Number(match[1]);
      const b = Number(match[2]);
      const year = expandYear(Number(match[3]));
      if (a > 12 && b <= 12 && isRealDate(year, b, a)) {
        consider(year, b, a, match[0], false);
      } else if (b > 12 && a <= 12 && isRealDate(year, a, b)) {
        consider(year, a, b, match[0], false);
      } else if (a <= 12 && b <= 12) {
        const dayFirst = isRealDate(year, b, a) ? year + "-" + pad(b) + "-" + pad(a) : null;
        const monthFirst = isRealDate(year, a, b) ? year + "-" + pad(a) + "-" + pad(b) : null;
        const options = [];
        if (dayFirst && (!today || dayFirst <= today)) options.push(dayFirst);
        if (monthFirst && monthFirst !== dayFirst && (!today || monthFirst <= today)) options.push(monthFirst);
        if (options.length === 1) consider(Number(options[0].slice(0, 4)), Number(options[0].slice(5, 7)), Number(options[0].slice(8, 10)), match[0], false);
        else if (options.length === 2) ambiguous.push({ raw: match[0], options: options });
      }
    }

    const recent = candidates.filter(function (row) {
      return !today || row.iso >= addDays(today, -800);
    });
    const auto = recent.length === 1 && ambiguous.length === 0 ? recent[0].iso : null;
    return { candidates: candidates, ambiguous: ambiguous, auto: auto };
  }

  function escapeIcs(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
  }

  function foldLine(line) {
    const encoder = new TextEncoder();
    let out = "";
    let current = "";
    let length = 0;
    for (const ch of line) {
      const size = encoder.encode(ch).length;
      if (length + size > 73 && current) {
        out += current + "\r\n ";
        current = ch;
        length = 1 + size;
      } else {
        current += ch;
        length += size;
      }
    }
    return out + current;
  }

  function buildIcs(input) {
    const stamp = input.lastDay.replace(/-/g, "");
    const end = addDays(input.lastDay, 1).replace(/-/g, "");
    const uid = "returnline-" + input.storeId + "-" + input.anchor + "-" + input.lastDay + "@returnline.local";
    const summary = "Return by: " + input.storeName;
    const description = "Store: " + input.storeName + " (" + input.market + "). Date used: " + input.anchor + ". Last day: " + input.lastDay + ". Source: " + input.source + ". Not advice, and not the store's receipt.";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Returnline//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + stamp + "T090000",
      "DTSTART;VALUE=DATE:" + stamp,
      "DTEND;VALUE=DATE:" + end,
      "SUMMARY:" + escapeIcs(summary),
      "DESCRIPTION:" + escapeIcs(description),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-P1D",
      "DESCRIPTION:" + escapeIcs("Tomorrow is the last day to return"),
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    return lines.map(foldLine).join("\r\n") + "\r\n";
  }

  function stampLayout(width, height, margin) {
    margin = margin || 88;
    return {
      margin: margin,
      deadline: { x: 16, y: 36, inTopMargin: 36 < margin },
      footer: { x: 16, y: height - 24, inBottomMargin: height - 24 > height - margin },
    };
  }

  function unlockMatches(unlock, purchase) {
    if (!unlock || !purchase) return false;
    return unlock.storeId === purchase.storeId
      && unlock.anchor === purchase.anchor
      && unlock.lastDay === purchase.lastDay
      && !!unlock.sale === !!purchase.sale;
  }

  return {
    CHECKED: CHECKED,
    PRICE_EUR: PRICE_EUR,
    stores: stores,
    storeById: storeById,
    todayIso: todayIso,
    addDays: addDays,
    formatRu: formatRu,
    lastReturnDay: lastReturnDay,
    parseReceiptDates: parseReceiptDates,
    buildIcs: buildIcs,
    stampLayout: stampLayout,
    unlockMatches: unlockMatches,
  };
});
