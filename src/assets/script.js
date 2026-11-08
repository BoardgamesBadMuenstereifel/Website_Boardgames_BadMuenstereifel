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
