const fs = require("fs");
const path = require("path");
const rules = require("../js/rules.js");

const root = path.join(__dirname, "..");

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nav(prefix, current) {
  const links = ['<a href="' + prefix + 'index.html">All</a>'].concat(
    rules.stores.map(function (store) {
      const href = prefix + store.page;
      if (store.id === current) return "<strong>" + esc(store.name) + " UK</strong>";
      return '<a href="' + href + '">' + esc(store.name) + " UK</a>";
    })
  );
  return '<nav aria-label="Stores">' + links.join("") + "</nav>";
}

function form() {
  return [
    '<form id="calc" class="slip">',
    '<label class="field"><span>Store</span><select id="store" name="store" required></select></label>',
    '<label class="field"><span id="anchor-label">Date</span><input id="anchor" name="anchor" type="date" required></label>',
    '<label id="sale-wrap" class="check" hidden><input id="sale" type="checkbox"><span>Sale item — shorter window</span></label>',
    '<label class="photo"><span>Receipt photo — only to read the date</span><input id="photo" name="photo" type="file" accept="image/*"></label>',
    '<button type="button" class="ghost" id="read-photo">Read the date</button>',
    '<p id="photo-note" aria-live="polite"></p>',
    '<ul id="candidates" hidden></ul>',
    '<button type="submit">Show the last day</button>',
    "</form>",
  ].join("");
}

function resultBlock() {
  return [
    '<section id="result" hidden aria-live="polite">',
    '<p class="brand">Last day</p>',
    '<p id="result-date" class="stamp"></p>',
    '<p id="result-status" class="status"></p>',
    "</section>",
    '<section id="till" class="till" hidden>',
    "<h2>Files for this purchase</h2>",
    '<p id="till-copy"></p>',
    '<button type="button" id="open-files">Open the files for this purchase</button>',
    '<div id="downloads" hidden>',
    '<button type="button" id="get-ics">Download the calendar reminder</button>',
    '<button type="button" id="get-receipt">Download the receipt with the date in the margin</button>',
    "</div>",
    "</section>",
  ].join("");
}

function page(opts) {
  const prefix = opts.prefix;
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>" + esc(opts.title) + "</title>",
    '<meta name="description" content="' + esc(opts.description) + '">',
    '<link rel="canonical" href="https://frtertaer.github.io/' + (opts.storeId ? opts.storeId + "/" : "") + '">',
    '<link rel="stylesheet" href="' + prefix + 'css/returnline.css">',
    "</head>",
    '<body data-store="' + esc(opts.storeId || "") + '" data-root="' + esc(prefix) + '">',
    '<main class="sheet">',
    '<p class="brand">Returnline</p>',
    "<h1>" + esc(opts.h1) + "</h1>",
    '<p class="lead">' + esc(opts.lead) + "</p>",
    nav(prefix, opts.storeId || ""),
    opts.extra || "",
    form(),
    resultBlock(),
    opts.rule || '<section class="rule" id="rule"></section>',
    "<footer><p>The date is free. Files for this purchase are 2 €. Not legal advice. If the order states a different date, that date wins.</p></footer>",
    "</main>",
    '<script src="' + prefix + 'js/rules.js"></script>',
    '<script src="' + prefix + 'js/app.js"></script>',
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function ruleHtml(store) {
  return [
    '<section class="rule" id="rule">',
    "<h2>The rule this page counts</h2>",
    "<p>" + esc(store.rule) + "</p>",
    "<p>Country: " + esc(store.market) + ". Checked " + esc(rules.formatRu(store.checked)) + ".</p>",
    '<p><a href="' + esc(store.source) + '" rel="noopener noreferrer">Store page</a></p>',
    "<p>Not legal advice. The store can refuse the return. If the order states a different date, that date wins.</p>",
    "</section>",
  ].join("");
}

const index = page({
  prefix: "",
  title: "UK return windows: IKEA, Amazon, Zalando, H&M and Apple",
  h1: "UK return windows: IKEA, Amazon, Zalando, H&M and Apple",
  description: "IKEA UK, Amazon UK, Zalando UK, H&M UK and Apple UK return windows. The last day is free. One site, five pages.",
  lead: "Enter the store and the date on the receipt. The last day is free. Files for this purchase are 2 €.",
  extra: "<p>Five stores. Only windows checked against the store's own page. Missing stores are not invented.</p>",
});

fs.writeFileSync(path.join(root, "index.html"), index);
rules.stores.forEach(function (store) {
  const html = page({
    prefix: "../",
    storeId: store.id,
    title: store.title,
    h1: store.title,
    description: store.description,
    lead: store.lead,
    rule: ruleHtml(store),
  });
  const dir = path.join(root, path.dirname(store.page));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(root, store.page), html);
});

fs.writeFileSync(path.join(root, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://frtertaer.github.io/sitemap.xml\n");
const urls = ["https://frtertaer.github.io/"].concat(rules.stores.map(function (store) {
  return "https://frtertaer.github.io/" + store.id + "/";
}));
fs.writeFileSync(path.join(root, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(function (url) { return "  <url><loc>" + url + "</loc></url>"; }).join("\n") + "\n</urlset>\n");
console.log("pages built");
