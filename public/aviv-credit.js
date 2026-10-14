/*
 * Developer credit for Aviv Adgah's demo sites.
 * Adds (1) a small floating "Built by Aviv" badge that opens a contact card and
 * (2) a credit line at the very bottom of the page. Everything lives in shadow DOM,
 * so the site's own CSS can't affect it and it can't affect the site.
 * Include once: <script src="/aviv-credit.js" defer></script>
 */
(function () {
  if (window.__avivCredit) return;
  window.__avivCredit = true;

  var PHONE = "+972526428809";
  var PHONE_DISPLAY = "+972 52-642-8809";
  var WHATSAPP = "https://wa.me/972526428809?text=" + encodeURIComponent("Hi Aviv, I saw one of your demo sites and would like to talk about a website.");
  var EMAIL = "avivadgha@gmail.com";
  var PORTFOLIO = "https://aviv-portfolio.com/";
  var ACCENT = "#f27837";

  var icons = {
    wa: '<svg viewBox="0 0 32 32" width="16" height="16"><path fill="currentColor" d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.96 12.96 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3zm5.93 15.71c-.33-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.74.16-.21.33-.85 1.06-1.04 1.28-.19.22-.38.25-.71.08-.33-.16-1.38-.51-2.63-1.62-.97-.87-1.63-1.94-1.82-2.27-.19-.33-.02-.5.14-.67.15-.15.33-.38.49-.57.17-.19.22-.33.33-.55.11-.22.06-.41-.03-.57-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.41-.3.33-1.14 1.11-1.14 2.71 0 1.6 1.17 3.15 1.33 3.37.16.22 2.3 3.51 5.57 4.92.78.34 1.39.54 1.86.69.78.25 1.49.21 2.05.13.63-.09 1.93-.79 2.2-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  };

  var base =
    ":host{all:initial}*{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}" +
    "a{color:inherit;text-decoration:none}";

  function badge() {
    var host = document.createElement("aviv-credit-badge");
    var root = host.attachShadow({ mode: "open" });
    root.innerHTML =
      "<style>" + base +
      ".wrap{position:fixed;left:16px;bottom:16px;z-index:2147483000;display:flex;flex-direction:column;align-items:flex-start;gap:8px;transition:opacity .2s,transform .2s}" +
      ".wrap.away{opacity:0;transform:translateY(10px);pointer-events:none}" +
      ".pill{display:inline-flex;align-items:center;gap:7px;padding:7px 12px 7px 9px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(17,17,17,.82);color:#fff;font-size:12px;font-weight:600;letter-spacing:.2px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25);backdrop-filter:blur(6px);transition:transform .15s,background .15s}" +
      ".pill:hover{transform:translateY(-2px);background:#111}" +
      ".dot{width:8px;height:8px;border-radius:50%;background:" + ACCENT + ";box-shadow:0 0 0 3px rgba(242,120,55,.3)}" +
      ".card{width:250px;padding:14px;border-radius:14px;background:#fff;color:#111;box-shadow:0 18px 40px rgba(0,0,0,.25);border:1px solid #eee;transform-origin:bottom left;animation:in .18s ease-out}" +
      "@keyframes in{from{opacity:0;transform:translateY(6px) scale(.98)}}" +
      ".card[hidden]{display:none}" +
      ".top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px}" +
      ".name{font-size:15px;font-weight:800}.role{font-size:12px;color:#666;margin-top:2px}" +
      ".x{border:0;background:none;color:#888;font-size:16px;cursor:pointer;line-height:1;padding:2px}" +
      ".row{display:flex;align-items:center;gap:10px;padding:8px;border-radius:9px;font-size:13px;font-weight:600}" +
      ".row:hover{background:#f5f4f0}" +
      ".ic{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:" + ACCENT + ";color:#fff;flex:none}" +
      ".ic.wa{background:#25d366}" +
      ".pill:focus-visible,.row:focus-visible,.x:focus-visible{outline:2px solid " + ACCENT + ";outline-offset:2px}" +
      "@media print{.wrap{display:none}}" +
      "</style>" +
      '<div class="wrap">' +
      '<div class="card" hidden role="dialog" aria-label="Contact the developer">' +
      '<div class="top"><div><div class="name">Aviv Adgah</div><div class="role">Web designer & developer · built this site</div></div>' +
      '<button class="x" aria-label="Close">✕</button></div>' +
      '<a class="row" href="' + WHATSAPP + '" target="_blank" rel="noopener"><span class="ic wa">' + icons.wa + "</span>WhatsApp</a>" +
      '<a class="row" href="tel:' + PHONE + '"><span class="ic">' + icons.phone + "</span>" + PHONE_DISPLAY + "</a>" +
      '<a class="row" href="mailto:' + EMAIL + '"><span class="ic">' + icons.mail + "</span>" + EMAIL + "</a>" +
      '<a class="row" href="' + PORTFOLIO + '" target="_blank" rel="noopener"><span class="ic">' + icons.link + "</span>See more of my work</a>" +
      "</div>" +
      '<button class="pill" aria-expanded="false"><span class="dot"></span>Built by Aviv</button>' +
      "</div>";
    var card = root.querySelector(".card");
    var pill = root.querySelector(".pill");
    function toggle(open) {
      card.hidden = !open;
      pill.setAttribute("aria-expanded", String(open));
    }
    pill.addEventListener("click", function () {
      toggle(card.hidden);
    });
    root.querySelector(".x").addEventListener("click", function () {
      toggle(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") toggle(false);
    });
    document.addEventListener("click", function (e) {
      if (!card.hidden && !e.composedPath().includes(host)) toggle(false);
    });
    return host;
  }

  function footerLine() {
    var host = document.createElement("aviv-credit-footer");
    var root = host.attachShadow({ mode: "open" });
    root.innerHTML =
      "<style>" + base +
      ":host{display:block;width:100%}" +
      ".bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 16px;padding:14px 16px 18px;background:#111;color:#bbb;font-size:13px;text-align:center}" +
      ".bar strong{color:#fff}" +
      ".bar a{color:#fff;font-weight:600;border-bottom:1px solid rgba(255,255,255,.25)}" +
      ".bar a:hover{color:" + ACCENT + ";border-color:" + ACCENT + "}" +
      ".sep{opacity:.4}" +
      "</style>" +
      '<div class="bar"><span>Designed &amp; built by <strong>Aviv Adgah</strong></span>' +
      '<span class="sep">·</span><a href="' + WHATSAPP + '" target="_blank" rel="noopener">WhatsApp</a>' +
      '<span class="sep">·</span><a href="tel:' + PHONE + '">' + PHONE_DISPLAY + "</a>" +
      '<span class="sep">·</span><a href="mailto:' + EMAIL + '">' + EMAIL + "</a>" +
      '<span class="sep">·</span><a href="' + PORTFOLIO + '" target="_blank" rel="noopener">Portfolio</a></div>';
    return host;
  }

  /** Keeps the badge above any fixed bar the site pins to the bottom-left (call buttons, cookie bars...). */
  function avoidFixedBars(host) {
    var wrap = host.shadowRoot.querySelector(".wrap");
    function check() {
      var lift = 16;
      var probes = [];
      [24, 70, 120].forEach(function (x) {
        [18, 42, 66].forEach(function (dy) {
          probes.push([x, window.innerHeight - dy]);
        });
      });
      probes.forEach(function (p) {
        document.elementsFromPoint(p[0], p[1]).forEach(function (el) {
          if (el === host || el === document.body || el === document.documentElement) return;
          // Only pinned things count (fixed/sticky, or inside a fixed layer), and only their own box,
          // so a full-screen overlay or canvas doesn't push the badge to the top.
          for (var n = el; n && n !== document.body; n = n.parentElement) {
            var pos = getComputedStyle(n).position;
            if (pos === "fixed" || pos === "sticky") {
              var r = el.getBoundingClientRect();
              if (r.height < window.innerHeight * 0.4 && r.top > window.innerHeight * 0.5) lift = Math.max(lift, window.innerHeight - r.top + 12);
              break;
            }
          }
        });
      });
      wrap.style.bottom = lift + "px";
    }
    check();
    window.addEventListener("resize", check);
    window.addEventListener("scroll", check, { passive: true });
    setInterval(check, 2000);
  }

  function mount() {
    var b = badge();
    document.body.appendChild(b);
    avoidFixedBars(b);
    // Full-screen apps lock page scrolling; there the badge alone is enough.
    var locked = getComputedStyle(document.body).overflow === "hidden" || getComputedStyle(document.documentElement).overflow === "hidden";
    if (locked) return;
    var f = footerLine();
    document.body.appendChild(f);
    // Once the credit line is on screen the badge would repeat it, so tuck the badge away.
    if ("IntersectionObserver" in window) {
      var wrap = b.shadowRoot.querySelector(".wrap");
      new IntersectionObserver(function (entries) {
        var shown = entries[0].isIntersecting;
        wrap.classList.toggle("away", shown);
        if (shown) b.shadowRoot.querySelector(".card").hidden = true;
      }).observe(f);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
