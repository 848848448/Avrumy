/* ==========================================================================
   Panorama Skylight — site engine (shared by index.html & admin.html)
   Merges DEFAULT content with saved overrides and renders the page.
   ========================================================================== */
(function (global) {
  var STORAGE_KEY = "panorama_content_v1";

  function safeParse(str) {
    try { return JSON.parse(str) || {}; } catch (e) { return {}; }
  }

  // Deep-ish merge: overrides win. Arrays are replaced wholesale when present.
  function merge(base, over) {
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!over) return out;
    Object.keys(over).forEach(function (k) {
      var b = base ? base[k] : undefined, o = over[k];
      if (o && typeof o === "object" && !Array.isArray(o) && b && typeof b === "object" && !Array.isArray(b)) {
        out[k] = merge(b, o);
      } else {
        out[k] = o;
      }
    });
    return out;
  }

  function loadOverrides() {
    try { return safeParse(global.localStorage.getItem(STORAGE_KEY)); }
    catch (e) { return {}; }
  }

  function saveOverrides(obj) {
    try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }

  function clearOverrides() {
    try { global.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function getContent() {
    var def = global.PANORAMA_DEFAULT || {};
    return merge(def, loadOverrides());
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function multiline(s) { return esc(s).replace(/\n/g, "<br>"); }

  var Panorama = {
    STORAGE_KEY: STORAGE_KEY,
    getContent: getContent,
    getDefault: function () { return global.PANORAMA_DEFAULT || {}; },
    loadOverrides: loadOverrides,
    saveOverrides: saveOverrides,
    clearOverrides: clearOverrides,
    esc: esc
  };

  // -------- Render the marketing page (index.html) --------
  Panorama.renderSite = function () {
    var c = getContent();

    // Simple keyed text
    document.querySelectorAll("[data-c]").forEach(function (el) {
      var key = el.getAttribute("data-c");
      if (c[key] == null) return;
      el.innerHTML = multiline(c[key]);
    });

    // Links that depend on content
    var phone = document.getElementById("phoneLink");
    if (phone) phone.setAttribute("href", "tel:" + (c.phoneHref || ""));
    var mail = document.getElementById("emailLink");
    if (mail) mail.setAttribute("href", "mailto:" + (c.email || ""));

    // Hero image
    var hero = document.getElementById("heroPhoto");
    if (hero && c.heroImg) hero.style.backgroundImage = "url('" + c.heroImg + "')";

    // Trust strip
    var trust = document.getElementById("trustStrip");
    if (trust) trust.innerHTML = (c.trust || []).map(function (t) {
      return "<span>" + esc(t) + "</span>";
    }).join("");

    // Product cards
    var pc = document.getElementById("productCards");
    if (pc) pc.innerHTML = (c.products || []).map(function (p, i) {
      return '<article class="card">' +
        '<div class="card-art art-' + ((i % 4) + 1) + '" aria-hidden="true"></div>' +
        "<h3>" + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></article>";
    }).join("");

    // Feature list
    var fl = document.getElementById("featureList");
    if (fl) fl.innerHTML = (c.features || []).map(function (f) {
      return '<li><span class="feat-ic" aria-hidden="true">◆</span><div><h4>' +
        esc(f.title) + "</h4><p>" + esc(f.text) + "</p></div></li>";
    }).join("");

    // Steps
    var st = document.getElementById("stepsList");
    if (st) st.innerHTML = (c.steps || []).map(function (s, i) {
      var n = String(i + 1);
      if (n.length < 2) n = "0" + n;
      return '<li><span class="step-num">' + n + "</span><h3>" +
        esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>";
    }).join("");

    // Gallery
    var g = document.getElementById("galleryGrid");
    if (g) g.innerHTML = (c.gallery || []).map(function (item) {
      return '<figure class="shot">' +
        '<div class="shot-img" style="background-image:url(\'' + String(item.img).replace(/'/g, "%27") + '\')"></div>' +
        (item.caption ? '<figcaption>' + esc(item.caption) + "</figcaption>" : "") +
        "</figure>";
    }).join("");

    // Reviews
    var rv = document.getElementById("reviewsGrid");
    if (rv) rv.innerHTML = (c.reviews || []).map(function (r) {
      return '<blockquote class="review"><p>' + esc(r.text) +
        "</p><footer>" + esc(r.author) + "</footer></blockquote>";
    }).join("");

    // Footer year
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());

    // Document title / meta based on brand
    if (c.brandName) {
      document.title = c.brandName + " — " + (c.brandTag || "") + " | Custom Skylights & Roof Hatches";
    }
  };

  // -------- Page interactions (nav, form) --------
  Panorama.initInteractions = function () {
    var navToggle = document.getElementById("navToggle");
    var nav = document.getElementById("nav");
    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", String(open));
      });
      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    var form = document.getElementById("quoteForm");
    var note = document.getElementById("formNote");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = form.querySelector("#name");
        var email = form.querySelector("#email");
        if (!name.value.trim() || !email.value.trim()) {
          note.textContent = "Please add your name and email so we can reach you.";
          note.style.color = "#c0392b";
          return;
        }
        note.style.color = "";
        note.textContent = "Thanks, " + name.value.trim().split(" ")[0] +
          "! We'll be in touch within one business day.";
        form.reset();
      });
    }
  };

  global.Panorama = Panorama;

  // Auto-run on the marketing page
  if (document.getElementById("galleryGrid")) {
    document.addEventListener("DOMContentLoaded", function () {
      Panorama.renderSite();
      Panorama.initInteractions();
    });
  }
})(window);
