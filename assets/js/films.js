/* ============================================================
   Zinéma — page Films : tableau « Mondrian » + filtres par statut
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("films-app");
  var R = window.ZinemaRender;

  var allFilms = [];
  var activeFilter = "tous";

  function filmHTML(film) {
    /* Vraie affiche = image Sanity OU image locale (assets/img/affiches),
       même critère que la fiche film. */
    var vraieAffiche = Boolean(R.sanityImageUrl(film.poster, 1200) || R.localImageUrl(film.poster));
    var realisation = film.director
      ? '<p class="m-film__real">' + R.escapeHtml(film.director) + "</p>"
      : "";
    /* Deux lignes courtes plutôt qu'un seul bloc : les repères
       (année, pays, durée), puis la version et l'âge — l'info
       décisive pour choisir sa séance, en gras. */
    var reperes = [
      film.year ? String(film.year) : null,
      film.country || null,
      film.duration ? film.duration + " min" : null,
    ].filter(Boolean).join(" · ");
    var version = [
      [film.language, film.subtitles].filter(Boolean).join(" ") || null,
      film.ageRating || null,
    ].filter(Boolean).join(" · ");
    /* « À l'affiche » est déjà le titre de la page : on ne répète
       pas ce statut sur chaque carte. Les autres statuts, eux,
       distinguent utilement les films (avant-première, cycle…). */
    var statut = film.status === "a-laffiche"
      ? ""
      : '<p class="m-film__statut">' + R.statusLabel(film.status) + "</p>";
    return (
      '<a href="' + root + "film/?s=" + encodeURIComponent(film.slug) + '" class="m-film">' +
      '<div class="m-affiche' + (vraieAffiche ? "" : " m-affiche--generee") + '">' + R.posterHTML(film) + "</div>" +
      '<div class="m-cell m-film__meta">' +
      statut +
      '<p class="m-film__titre">' + R.escapeHtml(film.title) + "</p>" +
      realisation +
      (reperes ? '<p class="m-film__ligne">' + R.escapeHtml(reperes) + "</p>" : "") +
      (version ? '<p class="m-film__version">' + R.escapeHtml(version) + "</p>" : "") +
      "</div></a>"
    );
  }

  function filtreHTML(filtre, label) {
    return (
      '<button type="button" class="m-filtre' + (activeFilter === filtre ? " is-active" : "") + '" data-filter="' + filtre + '">' +
      label + "</button>"
    );
  }

  function render() {
    var visible = activeFilter === "tous" ? allFilms : allFilms.filter(function (f) { return f.status === activeFilter; });
    var statuses = Array.from(new Set(allFilms.map(function (f) { return f.status; })));

    var filtresHTML =
      filtreHTML("tous", "Tous") +
      statuses.map(function (s) { return filtreHTML(s, R.statusLabel(s)); }).join("");

    var agendaHTML =
      '<a href="' + root + 'agenda/" class="m-cell m-action m-films-agenda"><span>Agenda complet →</span></a>';

    var filmsHTML = visible.length
      ? '<div class="m-films">' + visible.map(filmHTML).join("") + agendaHTML + "</div>"
      : '<div class="m-cell m-vide"><p class="m-cell__label">Aucun film</p>' +
        '<p class="m-cell__value">Aucun film dans cette catégorie pour le moment.</p></div>';

    app.innerHTML =
      '<article class="mondrian">' +
      '<header class="m-cell m-entete">' +
      '<p class="m-cell__label">Films</p>' +
      "<h1>À l'affiche</h1></header>" +
      '<nav class="m-filtres" aria-label="Filtrer les films">' + filtresHTML + "</nav>" +
      filmsHTML +
      "</article>";

    app.querySelectorAll(".m-filtre").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeFilter = btn.dataset.filter;
        render();
      });
    });
  }

  window.ZinemaData.getFilms().then(function (films) {
    allFilms = films.slice().sort(function (a, b) {
      return a.status.localeCompare(b.status);
    });
    render();
  });
})();
