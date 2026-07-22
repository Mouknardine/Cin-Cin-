/* ============================================================
   Zinéma — agenda en tableau « Mondrian », comme la fiche film :
   uniquement des cases utiles séparées par des traits noirs.
   Deux vues restent disponibles : Jour (un jour à la fois) et
   Semaine (tous les jours en colonnes). Chaque séance est une
   rangée de cases — heure / film & salle / statut — entièrement
   cliquable vers la fiche du film (bleu = navigation au survol).
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("agenda-app");
  var R = window.ZinemaRender;

  var statusText = { disponible: "", complet: "Complet", annule: "Annulé" };

  function groupByDate(screenings) {
    var map = {};
    var order = [];
    screenings.forEach(function (s) {
      if (!(s.date in map)) {
        map[s.date] = [];
        order.push(s.date);
      }
      map[s.date].push(s);
    });
    order.sort();
    return order.map(function (date) {
      var list = map[date].slice().sort(function (a, b) { return a.time.localeCompare(b.time); });
      return { date: date, screenings: list };
    });
  }

  var days = [];
  var activeDate = null;
  var mode = "jour";

  /* La bascule Jour/Semaine : des cases-boutons comme les filtres
     de la page Films (noir = actif, bleu au survol). */
  function modesHTML() {
    function bouton(m, label) {
      return (
        '<button type="button" class="m-filtre' + (mode === m ? " is-active" : "") + '" data-mode="' + m + '">' +
        label + "</button>"
      );
    }
    return (
      '<nav class="m-filtres" aria-label="Choisir la vue">' +
      bouton("jour", "Jour") + bouton("semaine", "Semaine") +
      "</nav>"
    );
  }

  /* Les jours : mêmes cases-boutons, sur deux lignes (jour + date). */
  function dayTabsHTML() {
    var boutons = days
      .map(function (d) {
        var date = R.parseISODate(d.date);
        var label = R.isToday(date) ? "Auj." : R.formatDowShort(d.date);
        return (
          '<button type="button" class="m-filtre m-filtre--jour' + (d.date === activeDate ? " is-active" : "") + '" data-date="' + d.date + '">' +
          '<span class="m-jour__dow">' + label + "</span>" +
          '<span class="m-jour__num">' + String(date.getDate()).padStart(2, "0") + "</span></button>"
        );
      })
      .join("");
    return '<nav class="m-filtres" aria-label="Choisir le jour">' + boutons + "</nav>";
  }

  /* Une séance = une rangée de cases, toute la rangée est cliquable.
     La case statut n'existe que si la séance est complète ou annulée
     (jamais de case vide dans le tableau). */
  function seanceHTML(s) {
    var filmHref = s.film ? root + "film/?s=" + encodeURIComponent(s.film.slug) : root + "films/";
    var sub = [R.escapeHtml(s.room || ""), s.versionNote ? "— " + R.escapeHtml(s.versionNote) : ""]
      .filter(Boolean)
      .join(" ");
    var statut = statusText[s.status]
      ? '<span class="m-cell m-seance__statut' + (s.status === "annule" ? " m-seance__statut--annule" : "") + '">' +
        statusText[s.status] + "</span>"
      : "";
    return (
      '<a class="m-seance" href="' + filmHref + '">' +
      '<span class="m-cell m-seance__heure">' + s.time + "</span>" +
      '<span class="m-cell m-seance__infos">' +
      '<span class="m-seance__titre">' + R.escapeHtml(s.film ? s.film.title : "Séance") + "</span>" +
      (sub ? '<span class="m-seance__salle">' + sub + "</span>" : "") +
      "</span>" + statut + "</a>"
    );
  }

  /* Vue Jour : la date en toutes lettres, puis les séances du jour. */
  function dayViewHTML() {
    var activeDay = days.filter(function (d) { return d.date === activeDate; })[0] || days[0];
    if (!activeDay) return "";
    return (
      dayTabsHTML() +
      '<p class="m-cell m-jour-actif">' + R.formatDayHeading(activeDay.date) + "</p>" +
      '<div class="m-seances-liste">' + activeDay.screenings.map(seanceHTML).join("") + "</div>"
    );
  }

  /* Vue Semaine : une colonne par jour, mêmes rangées de séances. */
  function weekViewHTML() {
    var colonnes = days
      .map(function (d) {
        return (
          '<div class="m-semaine__col">' +
          '<p class="m-cell m-semaine__date">' + R.formatDayHeading(d.date) + "</p>" +
          '<div class="m-semaine__liste">' + d.screenings.map(seanceHTML).join("") + "</div></div>"
        );
      })
      .join("");
    return '<div class="m-semaine">' + colonnes + "</div>";
  }

  function render() {
    if (days.length === 0) {
      app.innerHTML =
        '<article class="mondrian mondrian--agenda">' +
        '<header class="m-cell m-entete"><p class="m-cell__label">Agenda</p><h1>Les séances</h1></header>' +
        '<div class="m-cell m-vide"><p class="m-cell__label">Aucune séance</p>' +
        '<p class="m-cell__value">Aucune séance programmée pour le moment.</p></div>' +
        "</article>";
      return;
    }

    app.innerHTML =
      '<article class="mondrian mondrian--agenda">' +
      '<header class="m-cell m-entete"><p class="m-cell__label">Agenda</p><h1>Les séances</h1></header>' +
      modesHTML() +
      (mode === "jour" ? dayViewHTML() : weekViewHTML()) +
      "</article>";

    app.querySelectorAll("[data-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        mode = btn.dataset.mode;
        render();
      });
    });
    app.querySelectorAll("[data-date]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeDate = btn.dataset.date;
        render();
      });
    });
  }

  window.ZinemaData.getScreenings().then(function (screenings) {
    days = groupByDate(screenings);
    activeDate = days[0] ? days[0].date : null;
    render();
  });
})();
