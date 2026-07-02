/* ============================================================
   Zinéma — page Films : grille asymétrique + filtres par statut
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("films-app");
  var R = window.ZinemaRender;

  var spanClass = { large: "film-card--large", medium: "film-card--medium", small: "film-card--small" };
  var offsetClass = ["", "film-card--offset-1", "", "film-card--offset-2", "film-card--offset-3", ""];

  var allFilms = [];
  var activeFilter = "tous";

  function filmCardHTML(film, i) {
    var classes = ["film-card", spanClass[film.posterSize] || "", offsetClass[i % offsetClass.length]].filter(Boolean).join(" ");
    var arrow = R.hasRealImage(film.poster) ? '<span class="film-card__arrow">→</span>' : "";
    return (
      '<div class="' + classes + ' reveal" data-delay="' + (i % 6) * 0.06 + '">' +
      '<a href="' + root + "film/?s=" + encodeURIComponent(film.slug) + '" class="film-card__link">' +
      '<div class="film-card__frame">' + R.posterHTML(film) + arrow + "</div>" +
      '<div class="film-meta">' +
      '<p class="film-meta__status font-display">' + R.statusLabel(film.status) + "</p>" +
      '<p class="film-meta__title font-display">' + R.escapeHtml(film.title) + "</p>" +
      '<p class="film-meta__director">' + R.escapeHtml(film.director) + "</p>" +
      '<p class="film-meta__line">' + R.escapeHtml(R.filmMetaLine(film)) + "</p>" +
      "</div></a></div>"
    );
  }

  function render() {
    var visible = activeFilter === "tous" ? allFilms : allFilms.filter(function (f) { return f.status === activeFilter; });
    var statuses = Array.from(new Set(allFilms.map(function (f) { return f.status; })));

    var chipsHTML =
      '<button type="button" class="chip' + (activeFilter === "tous" ? " is-active" : "") + '" data-filter="tous">Tous</button>' +
      statuses
        .map(function (s) {
          return '<button type="button" class="chip' + (activeFilter === s ? " is-active" : "") + '" data-filter="' + s + '">' + R.statusLabel(s) + "</button>";
        })
        .join("");

    var gridHTML = visible.map(filmCardHTML).join("");
    var emptyHTML = visible.length === 0 ? '<p class="empty-state font-display">Aucun film dans cette catégorie pour le moment.</p>' : "";

    app.innerHTML =
      '<div class="films-toolbar">' + chipsHTML + "</div>" +
      '<div class="films-grid">' + gridHTML + "</div>" + emptyHTML;

    app.querySelectorAll(".chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeFilter = btn.dataset.filter;
        render();
      });
    });
    window.ZinemaReveal.observe(app);
  }

  window.ZinemaData.getFilms().then(function (films) {
    allFilms = films.slice().sort(function (a, b) {
      return a.status.localeCompare(b.status);
    });
    render();
  });
})();
