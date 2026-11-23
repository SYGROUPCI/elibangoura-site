/* elibangoura.com · le fil de laine
   Trace un fil qui part de la pince à linge, fait un nœud sur chaque carte et finit en pelote.
   Il se déroule pendant le défilement. Si ce script ne tourne pas, la page reste complète. */
(function () {
  "use strict";
  var page = document.getElementById("page");
  var svg = document.getElementById("yarn");
  var reveal = document.getElementById("reveal-path");
  var pelote = document.getElementById("pelote");
  if (!page || !svg || !reveal || !svg.getBBox) return;

  var brins = Array.prototype.slice.call(svg.querySelectorAll(".yp"));
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)");
  var longueur = 0, attente = false, derniereLargeur = 0;

  function centre(el) {
    var r = el.getBoundingClientRect(), p = page.getBoundingClientRect();
    return [r.left - p.left + r.width / 2, r.top - p.top + r.height / 2];
  }

  function dessinePelote(x, y) {
    var h = '<ellipse cx="' + (x + 3) + '" cy="' + (y + 19) + '" rx="19" ry="5" fill="#2a1236" fill-opacity=".18"/>';
    h += '<circle cx="' + x + '" cy="' + y + '" r="21" fill="url(#pelote-grad)"/>';
    for (var i = 0; i < 16; i++) {
      h += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (19 - (i % 4) * 1.5) + '" ry="' + (7 + (i % 5) * 2.4) +
        '" transform="rotate(' + (i * 22.5) + ' ' + x + ' ' + y + ')" fill="none" stroke="' +
        (i % 3 ? "#7b48a8" : "#3a1559") + '" stroke-width="1.3" stroke-opacity=".75"/>';
    }
    pelote.innerHTML = h;
  }

  function construit() {
    var L = page.clientWidth, H = page.scrollHeight;
    svg.setAttribute("width", L);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + L + " " + H);

    var pince = centre(document.getElementById("pince"));
    var points = [[L + 12, pince[1] - 70], [pince[0], pince[1] - 22]];
    var noeuds = page.querySelectorAll(".knot");
    for (var i = 0; i < noeuds.length; i++) points.push(centre(noeuds[i]));
    var dernier = points[points.length - 1];
    var fin = [44, dernier[1] + 200];
    points.push(fin);

    var d = "M" + points[0][0] + "," + points[0][1];
    for (var j = 1; j < points.length; j++) {
      var a = points[j - 1], b = points[j], my = (a[1] + b[1]) / 2, s = j % 2 ? 1 : -1;
      d += " C" + (a[0] + 60 * s) + "," + my + " " + (b[0] - 80 * s) + "," + my + " " + b[0] + "," + b[1];
    }
    brins.forEach(function (p) { p.setAttribute("d", d); });
    reveal.setAttribute("d", d);
    longueur = reveal.getTotalLength();
    reveal.style.strokeDasharray = longueur + " " + longueur;
    dessinePelote(fin[0], fin[1]);
    derniereLargeur = L;
    avance();
  }

  function avance() {
    attente = false;
    if (calme.matches) {
      reveal.style.strokeDashoffset = 0;
      pelote.classList.add("vue");
      return;
    }
    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var v = window.innerHeight * 0.6;
    var y = window.scrollY || window.pageYOffset || 0;
    var t = max - y < 8 ? 1 : Math.min(1, 0.12 + ((y + v) / (max + v)) * 0.88);
    reveal.style.strokeDashoffset = longueur * (1 - t);
    pelote.classList.toggle("vue", t > 0.97);
  }

  function auDefilement() {
    if (!attente) { attente = true; requestAnimationFrame(avance); }
  }

  var minuterie;
  function auRedimensionnement() {
    clearTimeout(minuterie);
    minuterie = setTimeout(function () {
      if (page.clientWidth !== derniereLargeur || page.scrollHeight !== +svg.getAttribute("height")) construit();
    }, 150);
  }

  var img = page.querySelector(".pic img");
  var imagePrete = new Promise(function (ok) {
    if (!img || img.complete) ok();
    else { img.addEventListener("load", ok); img.addEventListener("error", ok); }
  });
  var policesPretes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  Promise.all([imagePrete, policesPretes]).then(construit);
  window.addEventListener("scroll", auDefilement, { passive: true });
  window.addEventListener("resize", auRedimensionnement);
  window.addEventListener("orientationchange", auRedimensionnement);
  if (calme.addEventListener) calme.addEventListener("change", avance);
})();
