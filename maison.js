/* elibangoura.com · La Maison
   Place les mondes autour du polaroid et tend un fil de laine vers chacun.
   Les fils pendent un peu (comme de la vraie laine), respirent doucement, et se tendent quand on touche un monde.
   Sans ce script, le hall reste une simple liste de liens. */
(function () {
  "use strict";
  var hall = document.getElementById("hall");
  var svg = document.getElementById("fils");
  var coeur = document.getElementById("coeur");
  var portail = document.getElementById("portail");
  if (!hall || !svg || !coeur || !portail) return;

  var NS = "http://www.w3.org/2000/svg";
  var BRINS = ["yp-ombre", "yp-duvet", "yp-ame", "yp-torsade", "yp-reflet"];
  var mondes = Array.prototype.slice.call(document.querySelectorAll(".monde"));
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fils = [];   // pour chaque monde : { brins, o:[x,y], e:[x,y], mou, tension, cible }
  var anime = 0;

  // 1. Les fils, une fois pour toutes
  mondes.forEach(function (m) {
    var g = document.createElementNS(NS, "g");
    if (m.classList.contains("futur")) g.setAttribute("class", "futur-fil");
    var brins = BRINS.map(function (c) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("class", "yp " + c);
      g.appendChild(p);
      return p;
    });
    svg.appendChild(g);
    fils.push({ brins: brins, o: [0, 0], e: [0, 0], mou: 0, tension: 0, cible: 0 });
  });

  function rel(el) {
    var r = el.getBoundingClientRect(), h = hall.getBoundingClientRect();
    return [r.left - h.left + r.width / 2, r.top - h.top + r.height / 2];
  }

  // 2. La disposition : téléphone (en quinconce), écran bas (deux colonnes), grand écran (couronne)
  function dispose() {
    var W = hall.clientWidth, H = hall.clientHeight, n = mondes.length;
    var mode = W < 600 ? "tel" : (H < 560 ? "colonnes" : "couronne");
    hall.setAttribute("data-mode", mode);
    var cx = W / 2, cy = mode === "tel" ? H * 0.255 : (mode === "colonnes" ? H * 0.54 : H * 0.5);
    var hC = coeur.offsetHeight, basMarque = document.querySelector(".marque").getBoundingClientRect().bottom - hall.getBoundingClientRect().top;
    if (mode === "tel") cy = Math.max(cy, basMarque + 22 + hC * 0.68); // la pince ne doit pas mordre sur l'en-tête
    var debut = Math.max(H * 0.47, cy + hC / 2 + 38), fin = H * 0.86;
    coeur.style.left = cx + "px";
    coeur.style.top = cy + "px";
    hall.style.setProperty("--spot-y", Math.round(cy / H * 100) + "%");

    var rx = Math.min(W * 0.36, 470), ry = Math.min(H * 0.30, 270);
    mondes.forEach(function (m, i) {
      var x, y;
      var cote = "";
      if (mode === "tel") {
        // Les nœuds descendent en quinconce près du centre, les noms partent vers l'extérieur :
        // aucun fil ne traverse un nom.
        cote = i % 2 ? "cote-d" : "cote-g";
        x = W * (i % 2 ? 0.565 : 0.435);
        y = debut + i * (fin - debut) / (n - 1);
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

    // Points exacts : les fils partent de derrière le polaroid et finissent sur chaque nœud
    var c = rel(coeur);
    mondes.forEach(function (m, i) {
      var f = fils[i];
      f.o = [c[0] + (i - (n - 1) / 2) * 4, c[1] + 10];
      f.e = rel(m.querySelector(".noeud"));
      var dx = f.e[0] - f.o[0], dy = f.e[1] - f.o[1];
      f.mou = Math.min(70, Math.sqrt(dx * dx + dy * dy) * 0.14);
    });
    trace(performance.now());
  }

  // 3. Le tracé : une courbe qui pend sous son propre poids
  function trace(t) {
    var vivant = !calme.matches;
    fils.forEach(function (f, i) {
      f.tension += (f.cible - f.tension) * 0.14;
      var souffle = vivant ? Math.sin(t / 1700 + i * 1.3) * 3 : 0;
      var pend = (f.mou + souffle) * (1 - 0.85 * f.tension);
      var mx = (f.o[0] + f.e[0]) / 2, my = (f.o[1] + f.e[1]) / 2 + pend;
      var d = "M" + f.o[0].toFixed(1) + "," + f.o[1].toFixed(1) + " Q" + mx.toFixed(1) + "," + my.toFixed(1) + " " + f.e[0].toFixed(1) + "," + f.e[1].toFixed(1);
      for (var k = 0; k < f.brins.length; k++) f.brins[k].setAttribute("d", d);
    });
  }

  function boucle(t) {
    trace(t);
    anime = requestAnimationFrame(boucle);
  }
  function demarre() {
    cancelAnimationFrame(anime);
    if (!calme.matches && !document.hidden) anime = requestAnimationFrame(boucle);
  }

  // 4. Toucher un monde : le fil se tend, un cercle s'ouvre sur son atmosphère
  function ouvre(m, i) {
    var p = rel(m.querySelector(".noeud"));
    var futur = m.classList.contains("futur");
    portail.style.setProperty("--x", p[0] + "px");
    portail.style.setProperty("--y", p[1] + "px");
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

    if (futur) {
      setTimeout(function () { document.getElementById("portail-retour").focus(); }, 900);
    } else {
      setTimeout(function () { window.location.href = m.href; }, calme.matches ? 0 : 950);
    }
  }

  function ferme() {
    portail.classList.remove("ouvert", "depart");
    portail.setAttribute("aria-hidden", "true");
    fils.forEach(function (f) { f.cible = 0; });
  }

  mondes.forEach(function (m, i) {
    m.addEventListener("pointerenter", function () { fils[i].cible = 1; });
    m.addEventListener("pointerleave", function () { if (!portail.classList.contains("ouvert")) fils[i].cible = 0; });
    m.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // ouverture dans un nouvel onglet : on laisse faire
      e.preventDefault();
      ouvre(m, i);
    });
  });
  document.getElementById("portail-retour").addEventListener("click", ferme);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && portail.classList.contains("ouvert")) ferme(); });

  // Retour arrière depuis un monde : le hall revient fermé
  window.addEventListener("pageshow", function (e) { if (e.persisted) { ferme(); demarre(); } });
  document.addEventListener("visibilitychange", demarre);
  if (calme.addEventListener) calme.addEventListener("change", demarre);

  var attente;
  window.addEventListener("resize", function () {
    cancelAnimationFrame(attente);
    attente = requestAnimationFrame(dispose);
  });

  mondes.forEach(function (m, i) { m.style.setProperty("--i", i); });
  dispose();
  demarre();
  requestAnimationFrame(function () { requestAnimationFrame(function () { hall.classList.add("pret"); }); });
  var img = coeur.querySelector("img");
  if (img && !img.complete) img.addEventListener("load", dispose);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dispose);
})();
