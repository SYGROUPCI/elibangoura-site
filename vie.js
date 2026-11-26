/* elibangoura.com · La vie du hall : la lumière de Logroño, le polaroid suspendu, le carton d'entrée.
   S'ajoute à maison.js sans le modifier. */
(function () {
  "use strict";
  var racine = document.documentElement;
  var hall = document.getElementById("hall");
  var pola = document.querySelector(".pola");
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!hall || !pola) return;

  /* ---------- 1. La lumière de Logroño ---------- */
  // Lever et coucher du soleil à Logroño, heure locale, mois par mois (à la demi-heure près, ça suffit)
  var SOLEIL = [[8.8, 18.1], [8.4, 18.75], [7.9, 19.6], [8.0, 20.85], [7.35, 21.35], [7.0, 21.75],
                [7.25, 21.7], [7.75, 21.15], [8.25, 20.35], [8.5, 19.2], [8.3, 18.0], [8.75, 17.85]];
  var PHRASE = { aube: "le jour se lève", jour: "portes ouvertes", doree: "l'heure dorée", nuit: "la Maison veille" };
  var forcee = null, essai = (location.search.match(/[?&]lumiere=(aube|jour|doree|nuit)/) || [])[1]; // ?lumiere=doree pour essayer
  var ligne = document.getElementById("heure");

  function maintenantLogrono() {
    var p = {};
    new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Madrid", weekday: "long", hour: "2-digit", minute: "2-digit", month: "numeric", hourCycle: "h23" })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { jour: p.weekday, h: +p.hour + (+p.minute) / 60, mois: +p.month - 1 };
  }
  function lumiere() {
    var t = maintenantLogrono(), h = forcee == null ? t.h : forcee, s = SOLEIL[t.mois], moment;
    if (h >= s[0] - 0.5 && h < s[0] + 1.5) moment = "aube";
    else if (h >= s[0] + 1.5 && h < s[1] - 1.5) moment = "jour";
    else if (h >= s[1] - 1.5 && h < s[1] + 0.6) moment = "doree";
    else moment = "nuit";
    hall.setAttribute("data-lumiere", moment);
    var hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    ligne.innerHTML = "Logroño · " + t.jour + " · " + hh + " h " + (mm < 10 ? "0" : "") + mm + " · <em>" + PHRASE[moment] + "</em>";
    ligne.classList.add("vue");
  }
  if (essai) { var s0 = SOLEIL[maintenantLogrono().mois]; forcee = { aube: s0[0] + 0.3, jour: (s0[0] + s0[1]) / 2, doree: s0[1] - 0.6, nuit: 23.4 }[essai]; }
  lumiere();
  setInterval(lumiere, 30000);

  /* ---------- 2. Le polaroid suspendu ---------- */
  var lustre = document.createElement("span");
  lustre.className = "lustre";
  pola.querySelector(".pic").appendChild(lustre);

  var th = 0, w = 0, tenu = false, cibleTenue = 0, boucle = 0, avant = 0;
  var depart = null; // { angle du doigt, angle de la photo } au moment de la prise
  function pose() {
    pola.style.transform = "rotate(" + (-3 + th).toFixed(2) + "deg)";
    lustre.style.setProperty("--lx", (50 + th * 3.2).toFixed(1) + "%");
    lustre.style.setProperty("--irise", Math.min(0.9, Math.abs(w) / 60 + Math.abs(th) / 30).toFixed(2));
  }
  function pas(t) {
    var dt = Math.min(0.033, (t - (avant || t)) / 1000 || 0.016); avant = t;
    if (tenu) { var nv = th + (cibleTenue - th) * 0.35; w = (nv - th) / Math.max(dt, 0.008); th = nv; }
    else { w += (-34 * th - 1.5 * w) * dt; th += w * dt; }
    pose();
    if (tenu || Math.abs(th) > 0.03 || Math.abs(w) > 0.05) boucle = requestAnimationFrame(pas);
    else { th = 0; w = 0; pose(); boucle = 0; avant = 0; }
  }
  function lance() { if (!boucle && !calme.matches) boucle = requestAnimationFrame(pas); }
  function pousse(deg) { if (calme.matches) return; th = deg; w = 0; lance(); }

  function pivot() {
    var r = pola.getBoundingClientRect();
    return [r.left + r.width * 0.24, r.top - r.height * 0.06];
  }
  function angleDoigt(e) { var p = pivot(); return -Math.atan2(e.clientX - p[0], e.clientY - p[1]) * 180 / Math.PI; }
  pola.addEventListener("pointerdown", function (e) {
    if (calme.matches) return;
    tenu = true; depart = [angleDoigt(e), th]; cibleTenue = th;
    pola.classList.add("tenu");
    try { pola.setPointerCapture(e.pointerId); } catch (_) {}
    lance();
  });
  pola.addEventListener("pointermove", function (e) {
    if (!tenu) return;
    cibleTenue = Math.max(-38, Math.min(38, depart[1] + (angleDoigt(e) - depart[0])));
  });
  function lache() { if (!tenu) return; tenu = false; pola.classList.remove("tenu"); w = Math.max(-260, Math.min(260, w)); lance(); }
  pola.addEventListener("pointerup", lache);
  pola.addEventListener("pointercancel", lache);

  // Au défilement sur téléphone, la photo vacille un peu, comme un cadre accroché
  var dernierY = window.scrollY;
  window.addEventListener("scroll", function () {
    var d = window.scrollY - dernierY; dernierY = window.scrollY;
    if (calme.matches || tenu || racine.getAttribute("data-mode") !== "tel") return;
    w += Math.max(-40, Math.min(40, d * 0.5)); lance();
  }, { passive: true });

  /* ---------- 3. Le carton d'entrée ---------- */
  var carton = document.getElementById("carton"), sceau = document.getElementById("sceau");
  var minuteur = 0, ouvert = false;
  function montreCarton() {
    ouvert = false;
    carton.hidden = false; carton.classList.remove("parti");
    sceau.classList.remove("appui", "brise");
    racine.classList.add("avec-carton");
    var c = carton.querySelector(".carton"); c.style.animation = "none"; void c.offsetWidth; c.style.animation = "";
  }
  function entre(vite) {
    if (ouvert) return; ouvert = true;
    clearTimeout(minuteur);
    try { localStorage.setItem("eb-carton", "1"); } catch (_) {}
    sceau.classList.add("brise");
    setTimeout(function () {
      carton.classList.add("parti");
      setTimeout(function () { racine.classList.remove("avec-carton"); pousse(13); }, vite ? 300 : 900);
      setTimeout(function () { carton.hidden = true; }, 1700);
    }, vite ? 0 : 450);
  }
  function appuie(e) {
    if (e) e.preventDefault();
    if (ouvert) return;
    sceau.classList.add("appui");
    minuteur = setTimeout(function () { entre(false); }, calme.matches ? 0 : 850);
  }
  function relache() { if (ouvert) return; clearTimeout(minuteur); sceau.classList.remove("appui"); }
  sceau.addEventListener("pointerdown", appuie);
  sceau.addEventListener("pointerup", relache);
  sceau.addEventListener("pointerleave", relache);
  sceau.addEventListener("pointercancel", relache);
  sceau.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  sceau.addEventListener("click", function (e) { if (e.detail === 0) entre(false); }); // clavier : Entrée ou Espace
  document.getElementById("sans-ceremonie").addEventListener("click", function () { entre(true); });

  // Le carton ne s'ouvre qu'à la première visite (le script en tête de page l'a déjà affiché)
  if (racine.classList.contains("avec-carton")) montreCarton(); else pousse(13);
})();