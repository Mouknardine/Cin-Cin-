/* ============================================================
   Zinéma — agenda en tableau « Mondrian », comme la fiche film :
   uniquement des cases utiles séparées par des traits noirs.
   Deux vues restent disponibles : Jour (un jour à la fois) et
   Semaine (tous les jours en colonnes). Chaque séance est une
   rangée de cases — heure / film & salle / statut — entièrement
   cliquable vers la fiche du film. Les couleurs des cases sont
   tirées au hasard à chaque affichage (couleurs.js).

   Les jours sans film s'y lisent aussi : « Vacances », « Projection
   privée », posées dans la grille du Studio à la place d'un film.
   Leurs rangées ne mènent nulle part — ce ne sont pas des séances.
   Le rangement des jours est dans agenda-jours.js, le dessin des
   rangées d'un jour dans agenda-rangees.js.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("agenda-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;
  var rangeesDuJourHTML = window.ZinemaAgendaRangees.duJour;

  /* --------------------------------------------------------------
     La semaine de cinéma va du MERCREDI au MARDI : c'est le rythme
     des sorties, et celui sur lequel la programmation est pensée
     dans le Studio. La vue Semaine suit la même découpe, sinon les
     deux ne parleraient pas de la même chose.
     -------------------------------------------------------------- */
  var MERCREDI = 3; // getUTCDay() : 0 = dimanche

  function enDateUTC(dateISO) {
    var p = String(dateISO).split("-");
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }

  function enISO(date) {
    return date.toISOString().slice(0, 10);
  }

  /* Le mercredi qui ouvre la semaine contenant cette date. */
  function debutSemaineCinema(dateISO) {
    var date = enDateUTC(dateISO);
    var depuisMercredi = (date.getUTCDay() - MERCREDI + 7) % 7;
    date.setUTCDate(date.getUTCDate() - depuisMercredi);
    return enISO(date);
  }

  /* Le mardi qui la referme. */
  function finSemaineCinema(debutISO) {
    var date = enDateUTC(debutISO);
    date.setUTCDate(date.getUTCDate() + 6);
    return enISO(date);
  }

  var days = [];
  var activeDate = null;
  var mode = "jour";

  /* La bascule Jour/Semaine : des cases-boutons comme les filtres
     de la page Films. La vue en cours se peint de sa couleur
     Mondrian (jamais le noir : elle touche la barre de navigation,
     déjà noire sur la page courante). */
  function modesHTML() {
    function bouton(m, label) {
      return (
        '<button type="button" class="m-filtre ' + C.classeVive() + (mode === m ? " is-active" : "") + '" data-mode="' + m + '">' +
        label + "</button>"
      );
    }
    return (
      '<nav class="m-filtres" aria-label="Choisir la vue">' +
      bouton("jour", "Jour") + bouton("semaine", "Semaine") +
      "</nav>"
    );
  }

  /* Les jours : mêmes cases-boutons, sur deux lignes (jour + date).
     Le jour choisi se peint de sa couleur, comme la bascule
     Jour/Semaine juste au-dessus : deux cases colorées se lisent
     toujours l'une à côté de l'autre, le trait noir les sépare. */
  function dayTabsHTML() {
    var boutons = days
      .map(function (d) {
        var date = R.parseISODate(d.date);
        var label = R.isToday(date) ? "Auj." : R.formatDowShort(d.date);
        return (
          '<button type="button" class="m-filtre m-filtre--jour ' + C.classeVive() + (d.date === activeDate ? " is-active" : "") + '" data-date="' + d.date + '">' +
          '<span class="m-jour__dow">' + label + "</span>" +
          '<span class="m-jour__num">' + String(date.getDate()).padStart(2, "0") + "</span></button>"
        );
      })
      .join("");
    return '<nav class="m-filtres" aria-label="Choisir le jour">' + boutons + "</nav>";
  }

  /* Vue Jour : la date en toutes lettres, puis les séances du jour. */
  function dayViewHTML() {
    var activeDay = days.filter(function (d) { return d.date === activeDate; })[0] || days[0];
    if (!activeDay) return "";
    return (
      dayTabsHTML() +
      '<p class="m-cell m-jour-actif ' + C.classe() + '">' + R.formatDayHeading(activeDay.date) + "</p>" +
      '<div class="m-seances-liste">' + rangeesDuJourHTML(activeDay) + "</div>"
    );
  }

  /* Vue Semaine : les jours d'UNE semaine de cinéma, en colonnes.
     Celle du jour sélectionné — ainsi les onglets du haut et la vue
     Semaine restent d'accord, et la liste ne s'étire pas sur toute
     la programmation à venir. */
  function weekViewHTML() {
    var debut = debutSemaineCinema(activeDate || (days[0] && days[0].date));
    var fin = finSemaineCinema(debut);
    var joursSemaine = days.filter(function (d) {
      return d.date >= debut && d.date <= fin;
    });
    if (joursSemaine.length === 0) return "";

    var colonnes = joursSemaine
      .map(function (d) {
        return (
          '<div class="m-semaine__col">' +
          '<p class="m-cell m-semaine__date ' + C.classe() + '">' + R.formatDayHeading(d.date) + "</p>" +
          '<div class="m-semaine__liste">' + rangeesDuJourHTML(d) + "</div></div>"
        );
      })
      .join("");
    return '<div class="m-semaine">' + colonnes + "</div>";
  }

  function render() {
    /* Aucune séance : rien n'est affiché. Voir evenements.js. */
    if (days.length === 0) {
      app.innerHTML = "";
      return;
    }

    app.innerHTML =
      '<article class="mondrian mondrian--agenda">' +
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

  var D = window.ZinemaData;

  app.innerHTML = R.etatChargement("de l'agenda");

  Promise.all([D.getScreenings(), D.getCasesSansFilm()]).then(function (reponses) {
    var screenings = reponses[0];
    var cases = reponses[1];
    if (D.estUneErreur(screenings)) {
      app.innerHTML = R.etatErreur();
      return;
    }
    /* Les cases sans film sont un complément : si elles n'ont pas pu
       être chargées (data.js le signale dans la console), l'agenda
       garde ses séances plutôt que d'afficher une erreur. */
    if (D.estUneErreur(cases)) cases = [];

    /* Ni séance ni case sans film : la page reste vide, sans phrase
       pour le dire. */
    days = window.ZinemaAgendaJours.composerLesJours(screenings, cases, D.trierSeances);
    if (days.length === 0) {
      app.innerHTML = "";
      return;
    }
    activeDate = days[0].date;
    render();
  });
})();
