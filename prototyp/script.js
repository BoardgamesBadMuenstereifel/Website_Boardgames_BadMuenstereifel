// Menü: auf großen Bildschirmen immer offen, auf Handys per Knopf.
(function () {
  var nav = document.getElementById("nav");
  var mq = window.matchMedia("(min-width: 60rem)");
  function sync() { nav.open = mq.matches; }
  sync();
  mq.addEventListener("change", sync);
  nav.addEventListener("click", function (e) { if (e.target.closest("a") && !mq.matches) nav.open = false; });
})();

// Prototyp: Dummy-Termine (später kommen sie aus termine.xlsx).
// Zeigt den ersten Termin ab heute oben, die nächsten in der Liste.
(function () {
  var KESSEL = "Eicherscheider Straße 9, 53902 Bad Münstereifel";
  var ABEND = "Erst Essen, Spielbeginn ca. 19 Uhr";
  var SAMSTAG = "Ohne Essen, wir spielen gleich los";
  var termine = [
    { d: "2026-11-04", z: "18 Uhr", o: "Kupferkessel, Schönau", a: KESSEL, art: "Spieleabend", h: ABEND },
    { d: "2026-11-14", z: "16 Uhr", o: "DGH, Lorbach", a: "", art: "Spieleabend", h: SAMSTAG },
    { d: "2026-11-19", z: "18 Uhr", o: "Kupferkessel, Schönau", a: KESSEL, art: "Spieleabend", h: ABEND },
    { d: "2026-12-02", z: "18 Uhr", o: "Kupferkessel, Schönau", a: KESSEL, art: "Spieleabend", h: ABEND },
    { d: "2026-12-17", z: "18 Uhr", o: "Kupferkessel, Schönau", a: KESSEL, art: "Spieleabend", h: ABEND }
  ];

  // ?heute=2027-01-01 simuliert ein Datum (nur Prototyp, zum Testen)
  var simuliert = /[?&]heute=(\d{4}-\d{2}-\d{2})/.exec(location.search);
  var heute = simuliert ? simuliert[1] : new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }); // YYYY-MM-DD
  var kommend = termine.filter(function (t) { return t.d >= heute; });

  function teile(iso) {
    var dt = new Date(iso + "T12:00:00");
    return {
      lang: dt.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\.,/, ","),
      tag: dt.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""),
      zahl: dt.toLocaleDateString("de-DE", { day: "2-digit" }),
      monat: dt.toLocaleDateString("de-DE", { month: "short" }).replace(".", "")
    };
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  var wann = document.getElementById("next-wann");
  var wo = document.getElementById("next-wo");
  var adr = document.getElementById("next-adr");
  var liste = document.getElementById("termin-liste");

  if (wann) {
    wann.textContent = "";
    if (kommend.length) {
      var n = kommend[0];
      wann.appendChild(el("span", "", teile(n.d).lang));
      wann.appendChild(document.createTextNode(" "));
      wann.appendChild(el("small", "", "ab " + n.z));
      wo.textContent = n.o;
      adr.textContent = n.a || "Adresse folgt";
    } else {
      wann.appendChild(el("span", "", "Neue Termine folgen"));
      wo.textContent = "Den nächsten Termin erfährst du in der WhatsApp-Gruppe.";
      adr.textContent = "";
    }
  }

  if (!liste) return;
  liste.textContent = "";
  if (!kommend.length) {
    var leer = el("li", "termin-leer");
    leer.appendChild(el("div", "ort", "Neue Termine folgen"));
    var wa = el("a", "", "Zur WhatsApp-Gruppe");
    wa.href = "https://chat.whatsapp.com/H8X8rRcFLl47gaFFaKHHv2";
    wa.rel = "noopener";
    leer.appendChild(wa);
    liste.appendChild(leer);
    return;
  }

  var grenze = Number(liste.dataset.limit) || kommend.length;
  var mitAdresse = liste.dataset.adresse === "1";
  kommend.slice(0, grenze).forEach(function (t) {
    var q = teile(t.d), li = el("li"), tm = el("time");
    tm.setAttribute("datetime", t.d);
    tm.appendChild(el("span", "tag", q.tag));
    tm.appendChild(el("span", "zahl", q.zahl));
    tm.appendChild(el("span", "monat", q.monat));
    var box = el("div");
    box.appendChild(el("div", "ort", t.o));
    box.appendChild(el("div", "info", "ab " + t.z + " · " + t.art));
    if (t.h) box.appendChild(el("div", "hinweis", t.h));
    if (mitAdresse) box.appendChild(el("div", "info", t.a || "Adresse folgt"));
    if (t.a) {
      var r = el("a", "", "Route");
      r.href = "https://www.openstreetmap.org/search?query=" + encodeURIComponent(t.a);
      r.rel = "noopener";
      r.setAttribute("aria-label", "Route zu " + t.o);
      box.appendChild(r);
    }
    li.appendChild(tm);
    li.appendChild(box);
    liste.appendChild(li);
  });
})();
