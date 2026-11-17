/* ============================================================
   Minimum — noyau du site : en-tête, pied de page, affiches,
   séances. Chaque page appelle ensuite sa propre fonction
   (Minimum.pages.xxx) pour remplir <main>.
   ============================================================ */
(function () {
  "use strict";
  var D = window.MIN;
  var C = D.config;
  var root = document.body.dataset.root || "";
  var page = document.body.dataset.page || "";

  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function nbsp(s) { return esc(s).replace(/ ([:;!?»])/g, " $1").replace(/« /g, "« "); }

  /* ---------- Dates & séances ---------- */
  function iso(d) {
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  /* Les 7 prochains jours, à partir d'aujourd'hui. */
  function semaine() {
    var out = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }
  function numJour(d) { return d.getDay() === 0 ? 7 : d.getDay(); }
  function labelJour(d, i) {
    if (i === 0) return "Aujourd'hui";
    if (i === 1) return "Demain";
    return JOURS[d.getDay()].charAt(0).toUpperCase() + JOURS[d.getDay()].slice(1);
  }
  function dateLongue(d) { return d.getDate() + " " + MOIS[d.getMonth()]; }
  /* Séances d'un jour : [{film, heure}] triées par heure. */
  function seancesDuJour(d) {
    var out = [];
    D.films.forEach(function (f) {
      (f.seances[numJour(d)] || []).forEach(function (h) { out.push({ film: f, heure: h }); });
    });
    out.sort(function (a, b) { return a.heure < b.heure ? -1 : a.heure > b.heure ? 1 : 0; });
    return out;
  }
  function filmParId(id) {
    return D.films.filter(function (f) { return f.id === id; })[0];
  }
  function heureAffichee(h) { return h.replace(":", " h ").replace(/ $/, ""); }

  /* ---------- Réservation ---------- */
  function lienReserver(film, d, heure) {
    if (C.billetterie) return C.billetterie;
    var sujet = "Réservation — " + (film ? film.titre : "") + (d ? " — " + dateLongue(d) + (heure ? " à " + heure : "") : "");
    return "mailto:" + C.courriel + "?subject=" + encodeURIComponent(sujet);
  }

  /* ---------- Affiches typographiques ----------
     Pas d'images : chaque film reçoit une affiche dessinée en
     CSS — un titre, une forme, un fond. Quand le cinéma aura les
     vraies affiches, on les mettra dans <img> à la place. */
  function affiche(f) {
    if (f.img) {
      return '<div class="aff aff--photo"><img src="' + root + "assets/img/affiches/" + esc(f.img) + '" alt="Affiche de ' + esc(f.titre) + '" width="400" height="570" loading="lazy" decoding="async"></div>';
    }
    return (
      '<div class="aff aff--' + f.couleur + " aff--" + f.forme + '" role="img" aria-label="Affiche de ' + esc(f.titre) + '">' +
      '<span class="aff__forme"></span>' +
      '<span class="aff__annee">' + f.annee + "</span>" +
      '<span class="aff__titre">' + esc(f.titre) + "</span>" +
      '<span class="aff__real">' + esc(f.realisateur) + "</span>" +
      "</div>"
    );
  }

  /* ---------- En-tête ---------- */
  var NAV = [
    ["programme/", "Programme", "programme"],
    ["films/", "Films", "films"],
    ["tarifs/", "Tarifs", "tarifs"],
    ["location/", "Location", "location"],
    ["infos/", "Infos", "infos"],
  ];

  function header() {
    var links = NAV.map(function (n) {
      return '<li><a class="nav__lien" href="' + root + n[0] + '"' + (n[2] === page ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
    }).join("");
    var el = document.getElementById("entete");
    el.innerHTML =
      '<div class="entete">' +
      '<a class="entete__nom" href="' + (root || "./") + '">' + esc(C.nom) + "</a>" +
      '<button class="entete__bouton" type="button" aria-expanded="false" aria-controls="menu">Menu</button>' +
      '<nav class="nav" id="menu" aria-label="Navigation principale"><ul>' + links + "</ul></nav>" +
      "</div>" +
      '<div class="regle" aria-hidden="true"></div>';
    var b = el.querySelector(".entete__bouton");
    b.addEventListener("click", function () {
      var o = document.body.classList.toggle("menu-ouvert");
      b.setAttribute("aria-expanded", o ? "true" : "false");
      b.textContent = o ? "Fermer" : "Menu";
    });
  }

  /* ---------- Pied de page ---------- */
  function footer() {
    var el = document.getElementById("pied");
    var social = [];
    if (C.instagram) social.push('<a class="pied__case" href="' + esc(C.instagram) + '" target="_blank" rel="noopener noreferrer">Instagram</a>');
    if (C.facebook) social.push('<a class="pied__case" href="' + esc(C.facebook) + '" target="_blank" rel="noopener noreferrer">Facebook</a>');
    el.innerHTML =
      '<footer class="pied">' +
      '<p class="pied__case pied__case--nom">' + esc(C.nomLong) + "</p>" +
      '<p class="pied__case">' + C.adresse.map(esc).join(", ") + "</p>" +
      (C.telephone ? '<a class="pied__case" href="tel:' + esc(C.telephone.replace(/\s/g, "")) + '">' + esc(C.telephone) + "</a>" : "") +
      '<a class="pied__case" href="mailto:' + esc(C.courriel) + '">' + esc(C.courriel) + "</a>" +
      social.join("") +
      '<a class="pied__case pied__case--soeur" href="https://www.zinema.ch" target="_blank" rel="noopener noreferrer">Zinéma, la salle d\'à côté →</a>' +
      "</footer>";
  }

  /* ---------- Ligne de séance (tableau horaire) ---------- */
  function ligneSeance(s, d) {
    var f = s.film;
    return (
      '<li class="seance">' +
      '<span class="seance__heure">' + heureAffichee(s.heure) + "</span>" +
      '<a class="seance__titre" href="' + root + "film/?id=" + esc(f.id) + '">' + esc(f.titre) +
      '<small>' + esc(f.realisateur) + ", " + f.annee + "</small></a>" +
      '<span class="seance__langue">' + esc(f.langue) + "</span>" +
      '<a class="bouton" href="' + esc(lienReserver(f, d, s.heure)) + '">Réserver</a>' +
      "</li>"
    );
  }

  window.Minimum = {
    D: D, esc: esc, nbsp: nbsp, root: root, JOURS: JOURS,
    semaine: semaine, labelJour: labelJour, dateLongue: dateLongue, iso: iso,
    seancesDuJour: seancesDuJour, filmParId: filmParId, heureAffichee: heureAffichee,
    lienReserver: lienReserver, affiche: affiche, ligneSeance: ligneSeance,
    pages: {},
  };

  document.addEventListener("DOMContentLoaded", function () {
    header();
    footer();
    var f = window.Minimum.pages[page];
    if (f) f(document.getElementById("app"));
    /* Révélation douce des éléments au défilement. */
    var els = document.querySelectorAll(".rev");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("rev--vu"); io.unobserve(e.target); } });
      }, { threshold: 0.08 });
      els.forEach(function (e) { io.observe(e); });
    } else els.forEach(function (e) { e.classList.add("rev--vu"); });
  });
})();
