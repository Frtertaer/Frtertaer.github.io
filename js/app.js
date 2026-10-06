(function () {
  var R = window.Returnline;
  var body = document.body;
  var root = body.getAttribute("data-root") || "";
  var pageStore = body.getAttribute("data-store") || "";
  var unlock = null;
  var photoImage = null;
  var current = null;

  var storeSelect = document.getElementById("store");
  var anchor = document.getElementById("anchor");
  var anchorLabel = document.getElementById("anchor-label");
  var saleWrap = document.getElementById("sale-wrap");
  var sale = document.getElementById("sale");
  var photo = document.getElementById("photo");
  var readPhoto = document.getElementById("read-photo");
  var photoNote = document.getElementById("photo-note");
  var candidates = document.getElementById("candidates");
  var result = document.getElementById("result");
  var resultDate = document.getElementById("result-date");
  var resultStatus = document.getElementById("result-status");
  var till = document.getElementById("till");
  var tillCopy = document.getElementById("till-copy");
  var downloads = document.getElementById("downloads");

  function selected() {
    return R.storeById(storeSelect.value);
  }

  function purchaseOf(calc) {
    return {
      storeId: storeSelect.value,
      anchor: anchor.value,
      lastDay: calc ? calc.lastDay : "",
      sale: !!(sale && sale.checked),
    };
  }

  function addText(parent, tag, text) {
    var el = document.createElement(tag);
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  function paintRule(store) {
    var box = document.getElementById("rule");
    box.replaceChildren();
    addText(box, "h2", "The rule this page counts");
    addText(box, "p", store.rule);
    addText(box, "p", "Country: " + store.market + ". Checked " + R.formatRu(store.checked) + ".");
    var source = document.createElement("p");
    var link = document.createElement("a");
    link.href = store.source;
    link.rel = "noopener noreferrer";
    link.textContent = "Store page";
    source.appendChild(link);
    box.appendChild(source);
    addText(box, "p", "Not legal advice. The store can refuse the return. If the order states a different date, that date wins. The date you entered is day 0. The last day is that date plus the days in the rule.");
  }

  function fillStores() {
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get("store") || pageStore;
    R.stores.forEach(function (store) {
      var option = document.createElement("option");
      option.value = store.id;
      option.textContent = store.name + " — " + store.market;
      storeSelect.appendChild(option);
    });
    if (wanted && R.storeById(wanted)) storeSelect.value = wanted;
    else storeSelect.value = pageStore ? R.stores[0].id : "";
    if (params.get("date") && /^\d{4}-\d{2}-\d{2}$/.test(params.get("date"))) anchor.value = params.get("date");
    if (sale) sale.checked = params.get("sale") === "1";
  }

  function syncStoreUi() {
    var store = selected();
    if (!store) {
      anchorLabel.textContent = "Date";
      if (saleWrap) saleWrap.hidden = true;
      return;
    }
    anchorLabel.textContent = store.anchorLabel;
    if (saleWrap) {
      saleWrap.hidden = !store.saleDays;
      if (!store.saleDays && sale) sale.checked = false;
    }
    paintRule(store);
  }

  function hideFiles() {
    downloads.hidden = true;
  }

  function showDeadline() {
    var store = selected();
    current = null;
    if (!store || !anchor.value) {
      result.hidden = true;
      till.hidden = true;
      unlock = null;
      hideFiles();
      return;
    }
    var calc = R.lastReturnDay(store, anchor.value, R.todayIso(), { sale: !!(sale && sale.checked) });
    result.hidden = false;
    if (!calc.ok) {
      resultDate.textContent = calc.reason === "future" ? "That date is still ahead" : "That date cannot be read";
      resultDate.className = "stamp bad";
      resultStatus.textContent = calc.reason === "future"
        ? "A purchase cannot be in the future. Enter the date on the receipt."
        : "This date cannot be counted.";
      resultStatus.className = "status bad";
      till.hidden = true;
      unlock = null;
      hideFiles();
      return;
    }
    current = calc;
    resultDate.textContent = R.formatRu(calc.lastDay);
    resultDate.className = calc.expired ? "stamp bad" : "stamp";
    if (calc.expired) {
      resultStatus.textContent = "The window has closed. The files stay shut.";
      resultStatus.className = "status bad";
      till.hidden = true;
      unlock = null;
      hideFiles();
      return;
    }
    var today = R.todayIso();
    var line = calc.lastDay === today
      ? "Today is the last day. The date is free."
      : "The date is free. The reminder and the stamped receipt are separate, for this purchase only.";
    line += " Counting " + calc.daysUsed + " days from the date you entered.";
    if (calc.holidayApplied) line += " A holiday window published by the store applies.";
    resultStatus.textContent = line;
    resultStatus.className = "status";
    till.hidden = false;
    tillCopy.textContent = R.PRICE_EUR + " € — a calendar reminder and a receipt with this date in the margin. This copy does not charge a card. The button opens the files only for this date and this store. Refresh the page and they close again. The photo is not saved.";
    downloads.hidden = !R.unlockMatches(unlock, purchaseOf(calc));
  }

  function goToStore() {
    var store = selected();
    unlock = null;
    hideFiles();
    if (store && store.page && pageStore !== store.id) {
      var q = new URLSearchParams();
      if (anchor.value) q.set("date", anchor.value);
      if (sale && sale.checked) q.set("sale", "1");
      window.location.href = root + store.page + (q.toString() ? "?" + q.toString() : "");
      return;
    }
    syncStoreUi();
    showDeadline();
  }

  function downloadBlob(filename, blob) {
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function drawReceipt(store, calc) {
    var margin = 88;
    var maxW = 720;
    var sourceW = photoImage ? photoImage.width : 480;
    var sourceH = photoImage ? photoImage.height : 280;
    var scale = Math.min(1, maxW / sourceW);
    var dw = Math.round(sourceW * scale);
    var dh = Math.round(sourceH * scale);
    var canvas = document.createElement("canvas");
    canvas.width = dw + margin * 2;
    canvas.height = dh + margin * 2;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (photoImage) {
      ctx.drawImage(photoImage, margin, margin, dw, dh);
    } else {
      ctx.strokeStyle = "#1c1915";
      ctx.strokeRect(margin + 0.5, margin + 0.5, dw - 1, dh - 1);
      ctx.fillStyle = "#1c1915";
      ctx.font = "18px Georgia, serif";
      ctx.fillText("No receipt photo", margin + 16, margin + 42);
    }
    var layout = R.stampLayout(canvas.width, canvas.height, margin);
    ctx.fillStyle = "#9d1c1c";
    ctx.font = "bold 22px Georgia, serif";
    ctx.fillText("RETURN BY  " + R.formatRu(calc.lastDay), layout.deadline.x, layout.deadline.y);
    ctx.fillStyle = "#1c1915";
    ctx.font = "13px Georgia, serif";
    var footer = store.name + " · " + anchor.value + " · Returnline mark, not the store receipt";
    ctx.fillText(footer, layout.footer.x, layout.footer.y);
    return canvas;
  }

  function showCandidates(parsed) {
    candidates.replaceChildren();
    function addChoice(iso, raw) {
      var item = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "ghost";
      button.textContent = R.formatRu(iso) + (raw ? " · " + raw : "");
      button.addEventListener("click", function () {
        anchor.value = iso;
        showDeadline();
      });
      item.appendChild(button);
      candidates.appendChild(item);
    }
    parsed.candidates.forEach(function (row) { addChoice(row.iso, row.raw); });
    parsed.ambiguous.forEach(function (row) {
      row.options.forEach(function (iso) { addChoice(iso, row.raw); });
    });
    candidates.hidden = candidates.children.length === 0;
    if (parsed.auto) {
      anchor.value = parsed.auto;
      photoNote.textContent = "One date found. Check it: is this the one?";
      showDeadline();
    } else if (candidates.children.length) {
      photoNote.textContent = "More than one date. Choose yours — this page will not pick.";
    } else {
      photoNote.textContent = "The date on the photo could not be read. Enter it yourself.";
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error("script")); };
      document.head.appendChild(script);
    });
  }

  readPhoto.addEventListener("click", function () {
    var file = photo.files && photo.files[0];
    if (!file) {
      photoNote.textContent = "Choose a receipt photo first.";
      return;
    }
    readPhoto.disabled = true;
    photoNote.textContent = "Reading the date in the browser. The photo is not sent anywhere.";
    var src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    var ready = window.Tesseract ? Promise.resolve() : loadScript(src);
    ready.then(function () {
      return window.Tesseract.recognize(file, "rus+eng");
    }).catch(function () {
      if (!window.Tesseract) throw new Error("no-ocr");
      return window.Tesseract.recognize(file, "eng");
    }).then(function (recognized) {
      showCandidates(R.parseReceiptDates(recognized.data.text, R.todayIso()));
    }).catch(function () {
      photoNote.textContent = "The date on the photo could not be read. Enter it yourself.";
    }).then(function () {
      readPhoto.disabled = false;
    });
  });

  photo.addEventListener("change", function () {
    photoImage = null;
    var file = photo.files && photo.files[0];
    if (!file) return;
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      photoImage = img;
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

  document.getElementById("calc").addEventListener("submit", function (event) {
    event.preventDefault();
    showDeadline();
  });
  anchor.addEventListener("change", showDeadline);
  if (sale) sale.addEventListener("change", function () {
    unlock = null;
    showDeadline();
  });
  storeSelect.addEventListener("change", goToStore);

  document.getElementById("open-files").addEventListener("click", function () {
    if (!current || !current.sellable) return;
    unlock = purchaseOf(current);
    downloads.hidden = false;
  });

  document.getElementById("get-ics").addEventListener("click", function () {
    var store = selected();
    if (!store || !current || !R.unlockMatches(unlock, purchaseOf(current))) return;
    var ics = R.buildIcs({
      storeId: store.id,
      storeName: store.name,
      market: store.market,
      anchor: anchor.value,
      lastDay: current.lastDay,
      source: store.source,
    });
    downloadBlob("returnline-" + store.id + "-" + current.lastDay + ".ics", new Blob([ics], { type: "text/calendar" }));
  });

  document.getElementById("get-receipt").addEventListener("click", function () {
    var store = selected();
    if (!store || !current || !R.unlockMatches(unlock, purchaseOf(current))) return;
    drawReceipt(store, current).toBlob(function (blob) {
      if (!blob) return;
      downloadBlob("returnline-" + store.id + "-" + current.lastDay + ".png", blob);
    }, "image/png");
  });

  var empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Choose a store";
  if (!pageStore) storeSelect.appendChild(empty);
  fillStores();
  if (selected()) {
    syncStoreUi();
    if (anchor.value) showDeadline();
  }
})();
