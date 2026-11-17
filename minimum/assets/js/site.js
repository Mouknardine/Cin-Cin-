/* ============================================================
   Minimum — noyau du site : en-tête, menu, pied de page,
   affiches, programme (cinéma + radio + club). Chaque page
   appelle ensuite sa fonction (Minimum.pages.xxx).
   Même construction que le Zinéma : couleurs tirées au hasard
   (couleurs.js), trait unique de 4 px, cases sur fond papier.
   ============================================================ */
(function () {
  "use strict";
  var D = window.MIN;
  var C = D.config;
  var K = window.MinCouleurs;
  var root = document.body.dataset.root || "";
  var page = document.body.dataset.page || "";

  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function maj(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function heureAffichee(h) { return h.replace(":", "h"); }

  /* ---------- Dates ---------- */
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
  function dateLongue(d) { return maj(JOURS[d.getDay()]) + " " + d.getDate() + " " + MOIS[d.getMonth()]; }
  function dateCourte(d) { return d.getDate() + "." + ("0" + (d.getMonth() + 1)).slice(-2); }
  function labelJour(d, i) { return i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : maj(JOURS[d.getDay()]); }

  /* ---------- Cinéma ---------- */
  function filmParId(id) { return D.films.filter(function (f) { return f.id === id; })[0]; }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  /* Séances d'un film un jour donné (dates réelles). */
  function seancesFilm(f, d) {
    var k = iso(d);
    return f.seances.filter(function (x) { return x[0] === k; }).map(function (x) { return x[1]; });
  }

  /* ---------- Programme du jour : cinéma + radio + club mêlés ---------- */
  function programmeDuJour(d, filtre) {
    var n = numJour(d);
    var out = [];
    if (!filtre || filtre === "tout" || filtre === "cinema") {
      D.films.forEach(function (f) {
        seancesFilm(f, d).forEach(function (h) {
          out.push({ type: "cinema", heure: h, titre: f.titre, sous: f.realisateur + " · " + f.langue + (f.mention ? " — " + f.mention : ""),
            href: root + "film/?id=" + f.id, action: "Fiche", actionHref: root + "film/?id=" + f.id });
        });
      });
    }
    if (!filtre || filtre === "tout" || filtre === "radio") {
      D.emissions.forEach(function (e) {
        if (e.jour === n) out.push({ type: "radio", heure: e.heure, titre: e.titre, sous: e.texte,
          href: root + "radio/", action: "Écouter", actionHref: root + "radio/" });
      });
    }
    if (!filtre || filtre === "tout" || filtre === "club") {
      D.soirees.forEach(function (s) {
        if (s.jour === n) out.push({ type: "club", heure: s.heure, titre: s.nom, sous: s.artistes,
          href: root + "club/", action: "Infos", actionHref: root + "club/" });
      });
    }
    out.sort(function (a, b) { return a.heure < b.heure ? -1 : a.heure > b.heure ? 1 : 0; });
    return out;
  }
  var NOMS_TYPE = { cinema: "Cinéma", radio: "Radio", club: "Club" };

  /* Une rangée = trois cases : l'heure, le programme, l'action. Chaque case
     tire sa propre couleur, comme l'agenda du Zinéma. */
  function ligne(p) {
    return (
      '<div class="m-seance">' +
      '<a class="m-seance__heure ' + K.classe() + '" href="' + esc(p.href) + '">' + heureAffichee(p.heure) + "</a>" +
      '<a class="m-seance__infos ' + K.classe() + '" href="' + esc(p.href) + '">' +
      '<span class="m-seance__type"><i class="m-forme m-forme--' + p.type + '"></i>' + NOMS_TYPE[p.type] + "</span>" +
      '<span class="m-seance__titre">' + esc(p.titre) + "</span>" +
      '<span class="m-seance__sous">' + esc(p.sous) + "</span></a>" +
      '<a class="m-seance__action' + " " + K.classe() + '" href="' + esc(p.actionHref) + '">' + esc(p.action) + "</a>" +
      "</div>"
    );
  }
  function liste(items) {
    return '<div class="m-seances-liste">' + items.map(ligne).join("") + "</div>";
  }

  /* ---------- Radio : qui est à l'antenne ? ---------- */
  function minutes(h) { var p = h.split(":"); return +p[0] * 60 + +p[1]; }
  function antenne() {
    var now = new Date();
    var n = numJour(now);
    var m = now.getHours() * 60 + now.getMinutes();
    var auj = D.emissions.filter(function (e) { return e.jour === n; });
    var cur = auj.filter(function (e) { return m >= minutes(e.heure) && m < minutes(e.heure) + e.duree; })[0];
    if (cur) return { direct: true, emission: cur };
    for (var i = 0; i < 7; i++) {
      var j = ((n - 1 + i) % 7) + 1;
      var next = D.emissions.filter(function (e) {
        return e.jour === j && (i > 0 || minutes(e.heure) > m);
      }).sort(function (a, b) { return minutes(a.heure) - minutes(b.heure); })[0];
      if (next) return { direct: false, emission: next, quand: i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : maj(JOURS[j % 7]) };
    }
    return { direct: false, emission: null };
  }
  function voyant(a) {
    return '<span class="m-direct ' + (a.direct ? "m-direct--on" : "m-direct--off") + '"><i class="m-direct__point"></i>' +
      (a.direct ? "En direct" : "Hors antenne") + "</span>";
  }

  /* ---------- Affiches : la vraie image, ou une affiche générée comme au Zinéma ---------- */
  function affiche(f) {
    if (f.img) {
      return '<div class="poster"><img src="' + root + "assets/img/affiches/" + esc(f.img) + '" alt="Affiche de ' + esc(f.titre) +
        '" width="400" height="570" decoding="async"></div>';
    }
    var t = esc(f.titre), d = esc(f.realisateur), y = f.annee;
    var v = (f.titre.length + f.annee) % 5;
    var h = [
      '<div class="generated-poster generated-poster--0"><div class="gp-row"><span class="gp-year">' + y + '</span><span class="gp-title">' + t + '</span><span></span></div><div class="gp-director">' + d + "</div></div>",
      '<div class="generated-poster generated-poster--1"><div class="gp-top"><span>' + d + "</span><span>" + y + '</span></div><div class="gp-mid"><span class="stroke-text">' + t + '</span></div><div class="gp-bar"></div></div>',
      '<div class="generated-poster generated-poster--2"><div class="gp-clip"></div><div class="gp-top">' + y + " — " + d + '</div><div class="gp-title">' + t + "</div></div>",
      '<div class="generated-poster generated-poster--3"><div class="gp-title">' + t + '</div><div class="gp-bottom"><span class="gp-director">' + d + '</span><span class="gp-year">' + y + "</span></div></div>",
      '<div class="generated-poster generated-poster--4"><div class="gp-frame"><div class="gp-spacer"></div><div class="gp-title">' + t + '</div><div class="gp-bottom"><span>' + d + "</span><span>" + y + "</span></div></div></div>",
    ];
    return '<div class="poster">' + h[v] + "</div>";
  }

  /* ---------- En-tête & menu : la construction du Zinéma ---------- */
  var NAV = [
    ["cinema/", "Cinéma", "01", "cinema"],
    ["radio/", "Radio", "02", "radio"],
    ["club/", "Club", "03", "club"],
    ["agenda/", "Agenda", "04", "agenda"],
    ["location/", "Location", "05", "location"],
    ["infos/", "Infos", "06", "infos"],
  ];

  function header() {
    var h = document.createElement("header");
    h.className = "site-header";
    var barre = NAV.map(function (n) {
      return '<li class="nav-bar__item"><a href="' + root + n[0] + '" class="nav-bar__link ' + K.classe() + '"' +
        (n[3] === page || (n[3] === "cinema" && page === "film") ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
    }).join("");
    h.innerHTML =
      '<a href="' + (root || "./") + '" class="site-header__nom" aria-label="Minimum — accueil">Minimum</a>' +
      '<nav class="nav-bar" aria-label="Navigation principale"><ul class="nav-bar__list">' + barre + "</ul></nav>" +
      '<button type="button" class="menu-toggle" aria-expanded="false" aria-label="Ouvrir le menu"><span class="menu-toggle__box">' +
      '<span class="menu-toggle__bar menu-toggle__bar--1"></span><span class="menu-toggle__bar menu-toggle__bar--2"></span></span></button>';

    var nav = document.createElement("nav");
    nav.className = "main-nav";
    nav.innerHTML =
      '<ul class="main-nav__list">' + NAV.map(function (n, i) {
        return '<li class="main-nav__item" style="transition-delay:' + (0.08 + i * 0.05) + 's"><a href="' + root + n[0] +
          '" class="main-nav__link font-display"><span class="main-nav__link-label">' + n[1] + '</span><span class="main-nav__link-num">' + n[2] + "</span></a></li>";
      }).join("") + "</ul>" +
      '<div class="main-nav__footer font-display"><span>Cinéma Minimum — Neuchâtel</span><a href="' + root + 'agenda/" class="underline-hover">Voir la semaine</a></div>';
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.insertBefore(h, document.body.firstChild);

    var toggle = h.querySelector(".menu-toggle");
    var open = false;
    function set(v) {
      open = v;
      toggle.setAttribute("aria-expanded", String(v));
      toggle.setAttribute("aria-label", v ? "Fermer le menu" : "Ouvrir le menu");
      nav.classList.toggle("is-open", v);
      document.body.classList.toggle("menu-ouvert", v);
      document.documentElement.style.overflow = v ? "hidden" : "";
    }
    toggle.addEventListener("click", function () { set(!open); });
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
  }

  /* ---------- Pied de page : un tableau de cases ---------- */
  function footer() {
    var el = document.getElementById("footer-root");
    if (!el) return;
    var cases = [];
    if (C.instagram) cases.push('<a href="' + esc(C.instagram) + '" class="site-footer__lien ' + K.classe() + '" target="_blank" rel="noopener noreferrer">Instagram</a>');
    if (C.facebook) cases.push('<a href="' + esc(C.facebook) + '" class="site-footer__lien ' + K.classe() + '" target="_blank" rel="noopener noreferrer">Facebook</a>');
    cases.push('<p class="site-footer__case ' + K.classe() + '">' + C.adresse.map(esc).join(", ") + "</p>");
    if (C.telephone) cases.push('<a class="site-footer__case ' + K.classe() + '" href="tel:' + esc(C.telephone.replace(/\s/g, "")) + '">' + esc(C.telephone) + "</a>");
    cases.push('<a class="site-footer__case ' + K.classe() + '" href="mailto:' + esc(C.courriel) + '">' + esc(C.courriel) + "</a>");
    cases.push('<a class="site-footer__case ' + K.classe() + '" href="https://www.zinema.ch" target="_blank" rel="noopener noreferrer">Zinéma ↗</a>');
    cases.push('<a class="site-footer__case site-footer__signature" href="https://wearebrothers.ch" target="_blank" rel="noopener noreferrer">Site par We Are Brothers</a>');
    el.innerHTML = '<footer class="site-footer">' + cases.join("") + "</footer>";
  }

  window.Minimum = {
    D: D, esc: esc, maj: maj, root: root, K: K, heureAffichee: heureAffichee,
    semaine: semaine, labelJour: labelJour, dateLongue: dateLongue, dateCourte: dateCourte,
    filmParId: filmParId, seancesFilm: seancesFilm, programmeDuJour: programmeDuJour,
    ligne: ligne, liste: liste, antenne: antenne, voyant: voyant, affiche: affiche, pages: {},
  };

  document.addEventListener("DOMContentLoaded", function () {
    header();
    footer();
    var f = window.Minimum.pages[page];
    if (f) f(document.getElementById("app"));
  });
})();
