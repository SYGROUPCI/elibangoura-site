/* elibangoura.com · La Maison
   Grand écran : les mondes en couronne autour du polaroid, un fil de laine vers chacun.
   Téléphone : en deux temps. Le premier écran est tout à elle (grande photo) ; un geste vers le bas,
   et le fil descend le long du bord, un monde par étage.
   Les fils pendent un peu, respirent doucement, et se tendent quand on touche un monde.
   Sans ce script, le hall reste une simple liste de liens. */
(function () {
  "use strict";
  var racine = document.documentElement;
  var hall = document.getElementById("hall");
  var svg = document.getElementById("fils");
  var coeur = document.getElementById("coeur");
  var portail = document.getElementById("portail");
  if (!hall || !svg || !coeur || !portail) return;

  var NS = "http://www.w3.org/2000/svg";
  var BRINS = ["yp-ombre", "yp-duvet", "yp-ame", "yp-torsade", "yp-reflet"];
  var mondes = Array.prototype.slice.call(document.querySelectorAll(".monde"));
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fils = [];   // un par monde : { brins, o, e, c (point de contrôle de base), mou, tension, cible, vertical }
  var extras = []; // téléphone : le fil qui descend du haut jusqu'à la pince, et la queue du fil en bas
  var anime = 0, mode = "", largeurVue = 0;

  function cree(classe) {
    var g = document.createElementNS(NS, "g");
    if (classe) g.setAttribute("class", classe);
    var brins = BRINS.map(function (c) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("class", "yp " + c);
      g.appendChild(p);
      return p;
    });
    svg.appendChild(g);
    return { g: g, brins: brins, o: [0, 0], e: [0, 0], c: null, mou: 0, tension: 0, cible: 0, vertical: false };
  }
  extras.push(cree(""), cree(""));
  mondes.forEach(function (m) { fils.push(cree(m.classList.contains("futur") ? "futur-fil" : "")); });

  function rel(el) {
    var r = el.getBoundingClientRect(), h = hall.getBoundingClientRect();
    return [r.left - h.left + r.width / 2, r.top - h.top + r.height / 2];
  }
  function hauteurVue() { return racine.clientHeight || window.innerHeight; }

  // Disposition
  function dispose() {
    var W = hall.clientWidth, n = mondes.length, H = hauteurVue();
    mode = W < 600 ? "tel" : (H < 560 ? "colonnes" : "couronne");
    racine.setAttribute("data-mode", mode);
    hall.setAttribute("data-mode", mode);
    largeurVue = W;

    if (mode === "tel") hall.style.height = (2 * H) + "px"; else hall.style.height = "";
    var hC = coeur.offsetHeight;
    var cx = W / 2, cy = mode === "tel" ? H * 0.42 : (mode === "colonnes" ? H * 0.54 : H * 0.5);
    if (mode === "tel") {
      var basMarque = document.querySelector(".marque").getBoundingClientRect().bottom - hall.getBoundingClientRect().top;
      cy = Math.max(cy, basMarque + 30 + hC * 0.66); // la pince ne mord jamais sur l'en-tête
    }
    coeur.style.left = cx + "px";
    coeur.style.top = cy + "px";
    hall.style.setProperty("--spot-y", Math.round(cy / (mode === "tel" ? 2 * H : H) * 100) + "%");
    hall.style.setProperty("--bas-photo", (cy + hC / 2) + "px");

    var rx = Math.min(W * 0.36, 470), ry = Math.min(H * 0.30, 270);
    var bordFil = 44; // téléphone : le fil descend à 44 px du bord gauche
    mondes.forEach(function (m, i) {
      var x, y, cote = "";
      if (mode === "tel") {
        cote = "cote-d";
        x = bordFil;
        y = H + H * 0.2 + i * (H * 0.68) / (n - 1);
      } else if (mode === "colonnes") {
        var gauche = i < Math.ceil(n / 2), rang = gauche ? i : i - Math.ceil(n / 2), nb = gauche ? Math.ceil(n / 2) : Math.floor(n / 2);
        cote = gauche ? "cote-g" : "cote-d";
        x = W * (gauche ? 0.31 : 0.69);
        y = H * 0.24 + rang * (H * 0.56) / Math.max(1, nb - 1);
      } else {
        var a = -Math.PI / 2 + i * 2 * Math.PI / n;
        x = cx + Math.cos(a) * rx;
        y = cy + Math.sin(a) * ry;
        // Le nom se met du côté opposé à l'arrivée du fil, pour ne jamais être traversé
        if (Math.abs(Math.cos(a)) * rx > Math.abs(Math.sin(a)) * ry * 1.4) cote = x < cx ? "cote-g" : "cote-d";
        else if (y < cy) cote = "dessus";
      }
      m.classList.remove("cote-g", "cote-d", "dessus");
      if (cote) m.classList.add(cote);
      m.style.left = x + "px";
      m.style.top = y + "px";
    });

    var c = rel(coeur);
    if (mode === "tel") {
      // Un seul fil continu : il tombe du haut jusqu'à la pince, passe derrière la photo,
      // glisse vers le bord gauche et descend en nouant chaque monde.
      var pince = rel(coeur.querySelector(".pince"));
      extras[0].o = [pince[0] - 6, -12]; extras[0].e = [pince[0], pince[1] - 8]; extras[0].c = null; extras[0].vertical = true;
      mondes.forEach(function (m, i) {
        var f = fils[i];
        f.e = rel(m.querySelector(".noeud"));
        if (i === 0) {
          f.o = [c[0], c[1]];
          f.c = [bordFil - 6, cy + hC / 2 + 70];
          f.vertical = false;
        } else {
          f.o = fils[i - 1].e.slice();
          f.c = null;
          f.vertical = true;
        }
        f.mou = 7;
      });
      var der = fils[n - 1].e;
      extras[1].o = der.slice(); extras[1].e = [bordFil + 2, 2 * H + 20]; extras[1].c = null; extras[1].vertical = true;
      extras.forEach(function (x) { x.g.style.display = ""; x.mou = 6; });
    } else {
      extras.forEach(function (x) { x.g.style.display = "none"; });
      mondes.forEach(function (m, i) {
        var f = fils[i];
        f.o = [c[0] + (i - (n - 1) / 2) * 4, c[1] + 10];
        f.e = rel(m.querySelector(".noeud"));
        f.c = null;
        f.vertical = false;
        var dx = f.e[0] - f.o[0], dy = f.e[1] - f.o[1];
        f.mou = Math.min(70, Math.sqrt(dx * dx + dy * dy) * 0.14);
      });
    }
    trace(performance.now());
  }

  // Le tracé : une courbe qui pend sous son propre poids (ou ondule doucement quand le fil descend)
  function chemin(f, t, i, vivant) {
    f.tension += (f.cible - f.tension) * 0.14;
    var souffle = vivant ? Math.sin(t / 1700 + i * 1.3) * 3 : 0;
    var pend = (f.mou + souffle) * (1 - 0.85 * f.tension);
    var mx, my;
    if (f.c) { mx = f.c[0] + souffle * (1 - f.tension); my = f.c[1]; }
    else if (f.vertical) { mx = (f.o[0] + f.e[0]) / 2 + (i % 2 ? pend : -pend); my = (f.o[1] + f.e[1]) / 2; }
    else { mx = (f.o[0] + f.e[0]) / 2; my = (f.o[1] + f.e[1]) / 2 + pend; }
    return "M" + f.o[0].toFixed(1) + "," + f.o[1].toFixed(1) + " Q" + mx.toFixed(1) + "," + my.toFixed(1) + " " + f.e[0].toFixed(1) + "," + f.e[1].toFixed(1);
  }
  function trace(t) {
    var vivant = !calme.matches;
    fils.concat(mode === "tel" ? extras : []).forEach(function (f, i) {
      var d = chemin(f, t, i, vivant);
      for (var k = 0; k < f.brins.length; k++) f.brins[k].setAttribute("d", d);
    });
  }

  function boucle(t) { trace(t); anime = requestAnimationFrame(boucle); }
  function demarre() {
    cancelAnimationFrame(anime);
    if (!calme.matches && !document.hidden) anime = requestAnimationFrame(boucle);
  }

  // Toucher un monde : le fil se tend, un cercle s'ouvre sur son atmosphère
  function ouvre(m, i) {
    var r = m.querySelector(".noeud").getBoundingClientRect(); // repère de l'écran (le portail est fixe)
    var futur = m.classList.contains("futur");
    portail.style.setProperty("--x", (r.left + r.width / 2) + "px");
    portail.style.setProperty("--y", (r.top + r.height / 2) + "px");
    portail.style.setProperty("--fond", m.dataset.fond);
    portail.style.setProperty("--encre", m.dataset.encre);
    document.getElementById("portail-k").textContent = m.querySelector(".k").textContent;
    document.getElementById("portail-titre").textContent = m.querySelector(".t").textContent;
    document.getElementById("portail-p").textContent = m.dataset.p || "";
    document.getElementById("portail-etat").textContent = futur ? "Bientôt" : "Entrée…";
    portail.classList.toggle("depart", !futur);
    fils[i].cible = 1;
    portail.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () { portail.classList.add("ouvert"); });
    if (futur) setTimeout(function () { document.getElementById("portail-retour").focus(); }, 900);
    else setTimeout(function () { window.location.href = m.href; }, calme.matches ? 0 : 950);
  }
  function ferme() {
    portail.classList.remove("ouvert", "depart");
    portail.setAttribute("aria-hidden", "true");
    fils.forEach(function (f) { f.cible = 0; });
  }

  mondes.forEach(function (m, i) {
    m.style.setProperty("--i", i);
    m.addEventListener("pointerenter", function () { fils[i].cible = 1; });
    m.addEventListener("pointerleave", function () { if (!portail.classList.contains("ouvert")) fils[i].cible = 0; });
    m.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // nouvel onglet : on laisse faire
      e.preventDefault();
      ouvre(m, i);
    });
  });
  document.getElementById("portail-retour").addEventListener("click", ferme);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && portail.classList.contains("ouvert")) ferme(); });

  var suivre = document.querySelector(".suivre");
  if (suivre) suivre.addEventListener("click", function () {
    window.scrollTo({ top: hauteurVue(), behavior: calme.matches ? "auto" : "smooth" });
  });

  window.addEventListener("pageshow", function (e) { if (e.persisted) { ferme(); demarre(); } });
  document.addEventListener("visibilitychange", demarre);
  if (calme.addEventListener) calme.addEventListener("change", demarre);

  // Sur iPhone, la barre d'adresse change la hauteur pendant qu'on fait défiler :
  // en mode téléphone on ne recalcule que si la largeur change (rotation).
  var attente;
  window.addEventListener("resize", function () {
    if (mode === "tel" && hall.clientWidth === largeurVue) return;
    cancelAnimationFrame(attente);
    attente = requestAnimationFrame(dispose);
  });

  dispose();
  demarre();
  requestAnimationFrame(function () { requestAnimationFrame(function () { hall.classList.add("pret"); }); });
  var img = coeur.querySelector("img");
  if (img && !img.complete) img.addEventListener("load", dispose);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dispose);
})();
