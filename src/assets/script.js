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
  // Oben steht der nächste Abend, zu dem man ohne Anmeldung kommen kann
  var offen = kommend.filter(function (t) { return !t.anmeldung; });
  if (kommend.length) {
    var n = offen[0] || kommend[0];
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

// Filter der Sammlung (Regal). Fächer ohne passendes Spiel verschwinden, die Zahl auf dem Schild zählt mit.
// Ohne JavaScript bleibt alles sichtbar.
(function () {
  var form = document.getElementById("filter");
  if (!form) return;
  form.hidden = false;
  var regal = document.getElementById("sammlung");
  var karten = Array.prototype.slice.call(regal.querySelectorAll("[data-name]"));
  var faecher = Array.prototype.slice.call(regal.querySelectorAll("[data-fach]"));
  var treffer = document.getElementById("treffer");
  function passt(k, f) {
    var d = k.dataset;
    var suche = (f.name || "").trim().toLowerCase();
    if (suche && d.name.indexOf(suche) === -1) return false;
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
    faecher.forEach(function (fach) {
      var sichtbar = fach.querySelectorAll("[data-name]:not([hidden])").length;
      fach.hidden = !sichtbar;
      fach.querySelector("[data-anzahl]").textContent = sichtbar;
      fach.querySelector("[data-anzahl] + .nur-sr").textContent = sichtbar === 1 ? " Spiel" : " Spiele";
    });
    regal.hidden = !n;
    treffer.textContent = n ? n + (n === 1 ? " Spiel" : " Spiele") : "Kein Spiel passt zu deiner Auswahl.";
  }
  form.addEventListener("change", anwenden);
  form.addEventListener("input", anwenden);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  anwenden();
})();

// Das Namensschild über einer Schachtel bleibt im Regal, auch bei Schachteln ganz links oder rechts
// (Sammlung und „Neu im Hobby?“)
(function () {
  Array.prototype.forEach.call(document.querySelectorAll(".regal"), function (regal) {
    function schildRuecken(e) {
      var a = e.target.closest && e.target.closest(".schachtel a");
      if (!a) return;
      var info = a.querySelector(".schachtel-info");
      info.style.removeProperty("--verschub");
      var r = info.getBoundingClientRect(), g = regal.getBoundingClientRect();
      if (r.width < 2) return;
      var v = Math.max(0, g.left + 6 - r.left) - Math.max(0, r.right - g.right + 6);
      if (v) info.style.setProperty("--verschub", Math.round(v) + "px");
    }
    regal.addEventListener("mouseover", schildRuecken);
    regal.addEventListener("focusin", schildRuecken);
  });
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

// Spiele: die drei Top-10-Listen als Reiter. Ohne JavaScript stehen sie untereinander.
(function () {
  var block = document.querySelector("[data-reiter]");
  if (!block) return;
  var leiste = block.querySelector('[role="tablist"]');
  var reiter = Array.prototype.slice.call(leiste.querySelectorAll('[role="tab"]'));
  if (reiter.length < 2) return;
  var listen = reiter.map(function (r) { return document.getElementById(r.getAttribute("aria-controls")); });
  listen.forEach(function (l, i) {
    l.setAttribute("role", "tabpanel");
    l.setAttribute("aria-labelledby", reiter[i].id);
    l.tabIndex = -1;
  });
  function zeige(n, fokus) {
    reiter.forEach(function (r, i) {
      var an = i === n;
      r.setAttribute("aria-selected", an ? "true" : "false");
      r.tabIndex = an ? 0 : -1;
      listen[i].hidden = !an;
    });
    if (fokus) reiter[n].focus();
  }
  reiter.forEach(function (r, i) {
    r.addEventListener("click", function () { zeige(i); });
    r.addEventListener("keydown", function (e) {
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: reiter.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      zeige((n + reiter.length) % reiter.length, true);
    });
  });
  block.classList.add("mit-reitern");
  leiste.hidden = false;
  zeige(0);
})();
