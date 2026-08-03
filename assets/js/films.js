/* ============================================================
   Zinéma — page Films : tableau « Mondrian » + filtres par statut.

   Pas de bandeau de titre : la page s'ouvre directement sur les
   filtres, dans l'ordre À l'affiche · Première · Prochainement ·
   Cycles. Elle s'ouvre sur « À l'affiche », ce que les visiteurs
   cherchent en premier.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("films-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;

  var allFilms = [];
  var activeFilter = R.filtresFilms[0].statut;

  function filmHTML(film) {
    /* Vraie affiche = image Sanity OU image locale (assets/img/affiches),
       même critère que la fiche film. */
    var vraieAffiche = Boolean(R.sanityImageUrl(film.poster, 1200) || R.localImageUrl(film.poster));
    var realisation = film.director
      ? '<p class="m-film__real">' + R.escapeHtml(film.director) + "</p>"
      : "";
    /* Une seule ligne de repères, dans sa propre case : les infos
       décisives pour choisir sa séance, d'un coup d'œil. */
    var infos = [
      film.year ? String(film.year) : null,
      film.country || null,
      film.duration ? film.duration + " min" : null,
      [film.language, film.subtitles].filter(Boolean).join(" ") || null,
      film.ageRating || null,
    ].filter(Boolean).join(" · ");
    /* Le statut n'est rappelé que s'il diffère du filtre actif :
       inutile d'écrire « À l'affiche » sur chaque film de la
       rubrique À l'affiche. */
    var statut = film.status === activeFilter
      ? ""
      : '<p class="m-film__statut">' + R.statusLabel(film.status) + "</p>";
    return (
      '<a href="' + root + "film/?s=" + encodeURIComponent(film.slug) + '" class="m-film">' +
      '<div class="m-affiche' + (vraieAffiche ? "" : " m-affiche--generee") + '">' + R.posterHTML(film) + "</div>" +
      '<div class="m-cell m-film__entete ' + C.classe() + '">' +
      statut +
      '<p class="m-film__titre">' + R.escapeHtml(film.title) + "</p>" +
      realisation +
      "</div>" +
      (infos
        ? '<div class="m-cell m-film__infos ' + C.classe() + '">' + R.escapeHtml(infos) + "</div>"
        : "") +
      "</a>"
    );
  }

  function filtreHTML(filtre) {
    return (
      '<button type="button" class="m-filtre ' + C.classe() +
      (activeFilter === filtre.statut ? " is-active" : "") +
      '" data-filter="' + filtre.statut + '">' + filtre.label + "</button>"
    );
  }

  function render() {
    var visible = allFilms.filter(function (f) { return f.status === activeFilter; });

    /* Un filtre n'apparaît que s'il a des films : jamais de rubrique
       vide dans le tableau. */
    var filtres = R.filtresFilms.filter(function (f) {
      return allFilms.some(function (film) { return film.status === f.statut; });
    });
    var filtresHTML = '<nav class="m-filtres" aria-label="Filtrer les films">' +
      filtres.map(filtreHTML).join("") + "</nav>";

    var agendaHTML =
      '<a href="' + root + 'agenda/" class="m-cell m-action m-films-agenda ' + C.classe() + '"><span>Agenda complet →</span></a>';

    var filmsHTML = visible.length
      ? '<div class="m-films">' + visible.map(filmHTML).join("") + agendaHTML + "</div>"
      : '<div class="m-cell m-vide ' + C.classe() + '"><p class="m-cell__label">Aucun film</p>' +
        '<p class="m-cell__value">Aucun film dans cette catégorie pour le moment.</p></div>';

    app.innerHTML = '<article class="mondrian">' + filtresHTML + filmsHTML + "</article>";

    app.querySelectorAll(".m-filtre").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeFilter = btn.dataset.filter;
        render();
      });
    });
  }

  window.ZinemaData.getFilms().then(function (films) {
    allFilms = films;
    /* Si aucun film n'est à l'affiche, on ouvre sur la première
       rubrique qui en contient — jamais de page vide à l'arrivée. */
    var premierNonVide = R.filtresFilms.filter(function (f) {
      return allFilms.some(function (film) { return film.status === f.statut; });
    })[0];
    if (premierNonVide) activeFilter = premierNonVide.statut;
    render();
  });
})();
