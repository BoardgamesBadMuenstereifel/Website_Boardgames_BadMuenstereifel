// Menü: auf großen Bildschirmen immer offen, auf Handys per Knopf.
(function () {
  var nav = document.getElementById("nav");
  var mq = window.matchMedia("(min-width: 60rem)");
  function sync() { nav.open = mq.matches; }
  sync();
  mq.addEventListener("change", sync);
  nav.addEventListener("click", function (e) { if (e.target.closest("a") && !mq.matches) nav.open = false; });
})();

// Die Seite wird täglich neu gebaut. Dieses Stück entfernt vergangene Termine
// trotzdem sofort, falls ein Bau einmal ausfällt.
(function () {
  var quelle = document.getElementById("termine-daten");
  if (!quelle) return;
  var termine = JSON.parse(quelle.textContent);
  var heute = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
  var kommend = termine.filter(function (t) { return (t.bis || t.datum) >= heute; });
  if (kommend.length === termine.length) return;

  document.querySelectorAll(".termine time").forEach(function (el) {
    if (el.getAttribute("datetime") < heute && !kommend.some(function (t) { return t.datum === el.getAttribute("datetime"); })) {
      el.closest("li").remove();
    }
  });
  // Monate ohne verbleibende Termine samt Überschrift ausblenden
  document.querySelectorAll(".monat").forEach(function (m) {
    if (!m.querySelector(".termine li")) m.remove();
  });
  var wann = document.getElementById("next-wann");
  if (!wann) return;
  wann.textContent = "";
  var span = document.createElement("span");
  if (kommend.length) {
    var n = kommend[0];
    span.textContent = n.langText;
    wann.appendChild(span);
    wann.appendChild(document.createTextNode(" "));
    var klein = document.createElement("small");
    klein.textContent = n.zeit ? "ab " + n.zeit : "Uhrzeit folgt";
    wann.appendChild(klein);
    document.getElementById("next-wo").textContent = n.ort || "Ort folgt";
    document.getElementById("next-adr").textContent = n.ort ? n.adresse || "Adresse folgt" : "";
    var etikett = document.getElementById("next-etikett");
    etikett.textContent = n.art;
    etikett.className = "etikett" + (n.farbe ? " farbe-" + n.farbe : "");
    document.getElementById("next-kosten").textContent = n.kostenText;
    document.getElementById("next-art").hidden = false;
  } else {
    span.textContent = "Neue Termine folgen";
    wann.appendChild(span);
    document.getElementById("next-wo").textContent = "Den nächsten Termin erfährst du in der WhatsApp-Gruppe.";
    document.getElementById("next-adr").textContent = "";
    document.getElementById("next-art").hidden = true;
  }
})();

// Filter der Sammlung. Ohne JavaScript bleibt alles sichtbar.
(function () {
  var form = document.getElementById("filter");
  if (!form) return;
  form.hidden = false;
  var karten = Array.prototype.slice.call(document.querySelectorAll("#sammlung > li"));
  var treffer = document.getElementById("treffer");
  function passt(k, f) {
    var d = k.dataset;
    if (f.kategorie && d.kategorie !== f.kategorie) return false;
    // Spiele ohne BGG-Daten bleiben bei diesen Filtern sichtbar: Wir wissen es schlicht nicht.
    if (f.spieler && d.min && (+f.spieler < +d.min || +f.spieler > +d.max)) return false;
    if (f.dauer && d.dauer && +d.dauer > +f.dauer) return false;
    if (f.komplexitaet && d.komplexitaet && +d.komplexitaet > +f.komplexitaet) return false;
    return true;
  }
  function anwenden() {
    var f = Object.fromEntries(new FormData(form));
    var n = 0;
    karten.forEach(function (k) { var ok = passt(k, f); k.hidden = !ok; if (ok) n++; });
    treffer.textContent = n + (n === 1 ? " Spiel" : " Spiele");
  }
  form.addEventListener("change", anwenden);
  anwenden();
})();

// Fotos „landen“ beim Herunterscrollen auf dem Tisch. Ohne JavaScript oder bei
// eingestelltem Wunsch nach weniger Bewegung sind sie einfach sofort da.
(function () {
  var bilder = document.querySelectorAll(".sofortbild");
  if (!bilder.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var beobachter = new IntersectionObserver(function (eintraege) {
    var n = 0; // Bilder, die gemeinsam auftauchen, landen kurz nacheinander
    eintraege.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.setProperty("--i", n++);
      e.target.classList.add("ist-da");
      beobachter.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });
  document.documentElement.classList.add("bewegt");
  bilder.forEach(function (b) { beobachter.observe(b); });
})();

// Bildstreifen „Vom Spieltisch“: Knöpfe zum Blättern, solange es links oder rechts weitergeht
(function () {
  document.querySelectorAll(".streifen-rahmen").forEach(function (rahmen) {
    var streifen = rahmen.querySelector(".streifen");
    var knoepfe = rahmen.querySelectorAll(".streifen-knopf");
    if (!streifen || !knoepfe.length) return;
    function pruefen() {
      var max = streifen.scrollWidth - streifen.clientWidth - 2;
      knoepfe.forEach(function (k) {
        k.hidden = max <= 0;
        k.disabled = k.dataset.richtung === "-1" ? streifen.scrollLeft <= 2 : streifen.scrollLeft >= max;
      });
    }
    knoepfe.forEach(function (k) {
      k.addEventListener("click", function () {
        streifen.scrollBy({ left: Number(k.dataset.richtung) * streifen.clientWidth * 0.9 });
      });
    });
    streifen.addEventListener("scroll", pruefen, { passive: true });
    window.addEventListener("resize", pruefen);
    pruefen();
  });
})();
