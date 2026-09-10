/* ==========================================================================
   Panorama Skylight — Admin editor
   Edits a full copy of the site content and stores it in the browser.
   Export produces a JSON file you can commit to publish for everyone.
   ========================================================================== */
(function () {
  var PASS_KEY = "panorama_admin_pass";
  var DEFAULT_PASS = "panorama";
  var MAX_IMG_WIDTH = 1400;

  var state = null;      // working content
  var dirty = false;

  /* ---------- helpers ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function label(text) { var l = el("label"); l.textContent = text; return l; }

  function setDirty(v) {
    dirty = v;
    var f = $("saveFlag");
    if (!f) return;
    f.textContent = v ? "Unsaved changes" : "All changes saved";
    f.classList.toggle("dirty", v);
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function fileToDataURL(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > MAX_IMG_WIDTH) { h = Math.round(h * MAX_IMG_WIDTH / w); w = MAX_IMG_WIDTH; }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        try { cb(canvas.toDataURL("image/jpeg", 0.82)); }
        catch (e) { cb(reader.result); }
      };
      img.onerror = function () { cb(reader.result); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- schema ---------- */
  var SCHEMA = [
    { title: "Brand", fields: [
      { k: "brandName", label: "Company name", type: "text" },
      { k: "brandTag", label: "Tagline", type: "text" }
    ]},
    { title: "Hero — top banner", fields: [
      { k: "heroImg", label: "Background photo", type: "image" },
      { k: "heroEyebrow", label: "Small label above the headline", type: "text" },
      { k: "heroTitle", label: "Headline (press Enter for a line break)", type: "textarea" },
      { k: "heroSub", label: "Sub-paragraph", type: "textarea" },
      { k: "heroBtnPrimary", label: "Main button text", type: "text" },
      { k: "heroBtnGhost", label: "Second button text", type: "text" },
      { k: "stat1n", label: "Stat 1 — number", type: "text" },
      { k: "stat1l", label: "Stat 1 — label", type: "text" },
      { k: "stat2n", label: "Stat 2 — number", type: "text" },
      { k: "stat2l", label: "Stat 2 — label", type: "text" },
      { k: "stat3n", label: "Stat 3 — number", type: "text" },
      { k: "stat3l", label: "Stat 3 — label", type: "text" }
    ]},
    { title: "Trust bar — badges under the hero", fields: [
      { k: "trust", type: "stringlist", label: "Badges", addLabel: "Add badge" }
    ]},
    { title: "Products", fields: [
      { k: "productsEyebrow", label: "Small label", type: "text" },
      { k: "productsTitle", label: "Section title", type: "text" },
      { k: "productsLead", label: "Intro text", type: "textarea" },
      { k: "products", type: "objlist", label: "Product cards", addLabel: "Add product", nameFrom: "title",
        item: [ { k: "title", label: "Title", type: "text" }, { k: "text", label: "Description", type: "textarea" } ] }
    ]},
    { title: "Why choose us", fields: [
      { k: "whyEyebrow", label: "Small label", type: "text" },
      { k: "whyTitle", label: "Section title", type: "text" },
      { k: "whyLead", label: "Intro text", type: "textarea" },
      { k: "whyBtn", label: "Button text", type: "text" },
      { k: "features", type: "objlist", label: "Selling points", addLabel: "Add point", nameFrom: "title",
        item: [ { k: "title", label: "Title", type: "text" }, { k: "text", label: "Description", type: "textarea" } ] }
    ]},
    { title: "How it works", fields: [
      { k: "processEyebrow", label: "Small label", type: "text" },
      { k: "processTitle", label: "Section title", type: "text" },
      { k: "steps", type: "objlist", label: "Steps", addLabel: "Add step", nameFrom: "title",
        item: [ { k: "title", label: "Title", type: "text" }, { k: "text", label: "Description", type: "textarea" } ] }
    ]},
    { title: "Gallery — photos", fields: [
      { k: "galleryEyebrow", label: "Small label", type: "text" },
      { k: "galleryTitle", label: "Section title", type: "text" },
      { k: "galleryLead", label: "Intro text", type: "textarea" },
      { k: "gallery", type: "objlist", label: "Photos", addLabel: "Add photo", nameFrom: "caption",
        item: [ { k: "img", label: "Photo", type: "image" }, { k: "caption", label: "Caption", type: "text" } ] }
    ]},
    { title: "Reviews", fields: [
      { k: "reviewsEyebrow", label: "Small label", type: "text" },
      { k: "reviewsTitle", label: "Section title", type: "text" },
      { k: "reviews", type: "objlist", label: "Reviews", addLabel: "Add review", nameFrom: "author",
        item: [ { k: "text", label: "Quote", type: "textarea" }, { k: "author", label: "Name / role", type: "text" } ] }
    ]},
    { title: "Contact", fields: [
      { k: "contactEyebrow", label: "Small label", type: "text" },
      { k: "contactTitle", label: "Section title", type: "text" },
      { k: "contactLead", label: "Intro text", type: "textarea" },
      { k: "phoneDisplay", label: "Phone — shown on page", type: "text" },
      { k: "phoneHref", label: "Phone — dial code (e.g. +18456004042)", type: "text" },
      { k: "email", label: "Email", type: "text" },
      { k: "hours", label: "Hours", type: "text" }
    ]},
    { title: "Footer", fields: [
      { k: "footerBlurb", label: "Footer description", type: "textarea" }
    ]}
  ];

  /* ---------- field renderers ---------- */
  // obj[key] bound simple text/textarea/image
  function renderSimple(obj, f) {
    var wrap = el("div", "a-field");
    wrap.appendChild(label(f.label || f.k));

    if (f.type === "image") {
      wrap.appendChild(imageControl(obj, f.k));
      return wrap;
    }
    var input = f.type === "textarea" ? el("textarea") : el("input");
    if (f.type !== "textarea") input.type = "text";
    input.value = obj[f.k] != null ? obj[f.k] : "";
    input.addEventListener("input", function () { obj[f.k] = input.value; setDirty(true); });
    wrap.appendChild(input);
    return wrap;
  }

  function imageControl(obj, key) {
    var row = el("div", "a-image");
    var thumb = el("div", "thumb");
    function paint() {
      var v = obj[key];
      thumb.style.backgroundImage = v ? "url('" + String(v).replace(/'/g, "%27") + "')" : "none";
    }
    paint();

    var ctl = el("div", "a-image-ctl");
    var fileLabel = el("label", "file-btn", "Upload photo");
    var file = el("input"); file.type = "file"; file.accept = "image/*";
    fileLabel.appendChild(file);
    file.addEventListener("change", function () {
      if (!file.files || !file.files[0]) return;
      fileToDataURL(file.files[0], function (dataUrl) {
        obj[key] = dataUrl; paint(); setDirty(true);
        toast("Photo added — remember to Save");
      });
    });
    var current = el("div");
    current.style.fontSize = ".78rem"; current.style.color = "#5b6b79";
    current.textContent = obj[key] && String(obj[key]).indexOf("data:") === 0 ? "uploaded image" : (obj[key] || "");
    ctl.appendChild(fileLabel);
    ctl.appendChild(current);

    row.appendChild(thumb);
    row.appendChild(ctl);
    return row;
  }

  // string list (array of strings)
  function renderStringList(obj, f) {
    var wrap = el("div", "a-field");
    wrap.appendChild(label(f.label || f.k));
    var host = el("div");
    var arr = obj[f.k] = obj[f.k] || [];

    function draw() {
      host.innerHTML = "";
      arr.forEach(function (val, i) {
        var item = el("div", "a-list-item");
        var head = el("div", "a-item-head");
        head.appendChild(el("span", null, "#" + (i + 1)));
        var tools = el("div", "a-item-tools");
        tools.appendChild(toolBtn("↑", "Move up", function () { move(arr, i, -1); draw(); setDirty(true); }));
        tools.appendChild(toolBtn("↓", "Move down", function () { move(arr, i, 1); draw(); setDirty(true); }));
        tools.appendChild(toolBtn("✕", "Remove", function () { arr.splice(i, 1); draw(); setDirty(true); }, "del"));
        head.appendChild(tools);
        item.appendChild(head);
        var input = el("input"); input.type = "text"; input.value = val;
        input.addEventListener("input", function () { arr[i] = input.value; setDirty(true); });
        item.appendChild(input);
        host.appendChild(item);
      });
    }
    draw();
    wrap.appendChild(host);
    var add = el("button", "add-btn", "+ " + (f.addLabel || "Add item"));
    add.type = "button";
    add.addEventListener("click", function () { arr.push(""); draw(); setDirty(true); });
    wrap.appendChild(add);
    return wrap;
  }

  // object list (array of objects)
  function renderObjList(obj, f) {
    var wrap = el("div", "a-field");
    wrap.appendChild(label(f.label || f.k));
    var host = el("div");
    var arr = obj[f.k] = obj[f.k] || [];

    function draw() {
      host.innerHTML = "";
      arr.forEach(function (row, i) {
        var item = el("div", "a-list-item");
        var head = el("div", "a-item-head");
        var name = (f.nameFrom && row[f.nameFrom]) ? String(row[f.nameFrom]).slice(0, 42) : ("#" + (i + 1));
        head.appendChild(el("span", null, name || ("#" + (i + 1))));
        var tools = el("div", "a-item-tools");
        tools.appendChild(toolBtn("↑", "Move up", function () { move(arr, i, -1); draw(); setDirty(true); }));
        tools.appendChild(toolBtn("↓", "Move down", function () { move(arr, i, 1); draw(); setDirty(true); }));
        tools.appendChild(toolBtn("✕", "Remove", function () {
          if (confirm("Remove this item?")) { arr.splice(i, 1); draw(); setDirty(true); }
        }, "del"));
        head.appendChild(tools);
        item.appendChild(head);
        f.item.forEach(function (sub) { item.appendChild(renderSimple(row, sub)); });
        host.appendChild(item);
      });
    }
    draw();
    wrap.appendChild(host);
    var add = el("button", "add-btn", "+ " + (f.addLabel || "Add item"));
    add.type = "button";
    add.addEventListener("click", function () {
      var blank = {}; f.item.forEach(function (sub) { blank[sub.k] = ""; });
      arr.push(blank); draw(); setDirty(true);
    });
    wrap.appendChild(add);
    return wrap;
  }

  function toolBtn(txt, title, fn, extra) {
    var b = el("button", "a-tool" + (extra ? " " + extra : ""), txt);
    b.type = "button"; b.title = title;
    b.addEventListener("click", fn);
    return b;
  }
  function move(arr, i, dir) {
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }

  /* ---------- build the whole form ---------- */
  function buildForm() {
    var form = $("editForm");
    form.innerHTML = "";
    SCHEMA.forEach(function (section, idx) {
      var det = el("details", "admin-section");
      if (idx === 0) det.open = true;
      var sum = el("summary"); sum.textContent = section.title;
      det.appendChild(sum);
      var body = el("div", "admin-section-body");
      section.fields.forEach(function (f) {
        if (f.type === "stringlist") body.appendChild(renderStringList(state, f));
        else if (f.type === "objlist") body.appendChild(renderObjList(state, f));
        else body.appendChild(renderSimple(state, f));
      });
      det.appendChild(body);
      form.appendChild(det);
    });
    form.appendChild(buildSettings());
  }

  function buildSettings() {
    var det = el("details", "admin-section");
    det.appendChild(Object.assign(el("summary"), { textContent: "Settings" }));
    var body = el("div", "admin-section-body");

    var pw = el("div", "a-field");
    pw.appendChild(label("Change editor passcode"));
    var input = el("input"); input.type = "text";
    input.placeholder = "New passcode";
    pw.appendChild(input);
    var save = el("button", "add-btn", "Update passcode"); save.type = "button";
    save.addEventListener("click", function () {
      var v = input.value.trim();
      if (!v) { toast("Enter a passcode first"); return; }
      try { localStorage.setItem(PASS_KEY, v); } catch (e) {}
      input.value = "";
      toast("Passcode updated");
    });
    pw.appendChild(save);
    body.appendChild(pw);

    var note = el("p");
    note.style.cssText = "font-size:.85rem;color:#5b6b79;margin-top:14px";
    note.innerHTML = "This passcode is a light lock stored in this browser — it keeps casual visitors out of the editor, but it isn't bank-grade security. Your live website is never changed until you <strong>Export</strong> and publish the file.";
    body.appendChild(note);

    det.appendChild(body);
    return det;
  }

  /* ---------- actions ---------- */
  function doSave() {
    var ok = Panorama.saveOverrides(state);
    if (ok) { setDirty(false); toast("Saved"); }
    else toast("Could not save — storage may be full (try fewer/smaller photos)");
    return ok;
  }

  function doExport() {
    doSave();
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "content-overrides.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Exported content-overrides.json");
  }

  function doImport(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        state = Panorama.getContent(); // start from merged
        Object.keys(data).forEach(function (k) { state[k] = data[k]; });
        Panorama.saveOverrides(state);
        buildForm(); setDirty(false);
        toast("Imported");
      } catch (e) { toast("That file could not be read as content"); }
    };
    reader.readAsText(file);
  }

  function doReset() {
    if (!confirm("Reset ALL content back to the original? Your edits in this browser will be removed.")) return;
    Panorama.clearOverrides();
    state = clone(Panorama.getDefault());
    buildForm(); setDirty(false);
    toast("Reset to original content");
  }

  /* ---------- gate ---------- */
  function currentPass() {
    try { return localStorage.getItem(PASS_KEY) || DEFAULT_PASS; }
    catch (e) { return DEFAULT_PASS; }
  }
  function unlocked() {
    try { return sessionStorage.getItem("panorama_admin_ok") === "1"; }
    catch (e) { return false; }
  }
  function unlock() {
    try { sessionStorage.setItem("panorama_admin_ok", "1"); } catch (e) {}
    showApp();
  }

  function showGate() {
    $("gate").hidden = false; $("app").hidden = true;
    var pass = $("gatePass"), msg = $("gateMsg"), btn = $("gateBtn");
    function attempt() {
      if (pass.value === currentPass()) { msg.textContent = ""; unlock(); }
      else { msg.textContent = "Incorrect passcode."; pass.select(); }
    }
    btn.addEventListener("click", attempt);
    pass.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
    pass.focus();
  }

  function showApp() {
    $("gate").hidden = true; $("app").hidden = false;
    state = Panorama.getContent();
    buildForm();
    setDirty(false);

    $("saveBtn").addEventListener("click", doSave);
    $("exportBtn").addEventListener("click", doExport);
    $("resetBtn").addEventListener("click", doReset);
    $("previewBtn").addEventListener("click", function () { doSave(); window.open("index.html", "_blank"); });
    $("importFile").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) doImport(e.target.files[0]);
      e.target.value = "";
    });
    window.addEventListener("beforeunload", function (e) {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (unlocked()) showApp(); else showGate();
  });
})();
