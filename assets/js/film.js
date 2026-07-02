/* ============================================================
   Zinéma — fiche film. Une seule page réelle (film/index.html)
   qui lit le film demandé dans l'URL (?s=le-slug) et va le
   chercher dans le navigateur : un nouveau film publié dans
   Sanity a immédiatement une fiche fonctionnelle, sans jamais
   reconstruire le site.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("film-app");
  var R = window.ZinemaRender;

  var statusText = { disponible: "Places disponibles", complet: "Complet", annule: "Annulé" };

  function screeningsHTML(film) {
    var screenings = film.screenings || [];
    if (screenings.length === 0) {
      return '<p class="screenings-list__empty font-display">Aucune séance programmée pour le moment — revenez bientôt.</p>';
    }
    var byDate = [];
    var index = {};
    screenings.forEach(function (s) {
      if (!(s.date in index)) {
        index[s.date] = byDate.length;
        byDate.push({ date: s.date, list: [] });
      }
      byDate[index[s.date]].list.push(s);
    });

    var days = byDate
      .map(function (day) {
        var rows = day.list
          .map(function (s) {
            var infoBits = [
              R.escapeHtml(s.room || ""),
              s.versionNote ? "— " + R.escapeHtml(s.versionNote) : "",
            ]
              .filter(Boolean)
              .join(" ");
            var statusSpan = '<span class="' + (s.status === "disponible" ? "" : "is-status-red") + '">' + statusText[s.status] + "</span>";
            var action =
              s.status === "disponible"
                ? R.buyButtonHTML(s.sumupCheckoutUrl || film.sumupCheckoutUrl, s.price || film.price)
                : '<span class="screening-row__unavailable">' + statusText[s.status] + "</span>";
            return (
              '<li class="screening-row"><div><p class="screening-row__time font-display">' + s.time + "</p>" +
              '<p class="screening-row__info">' + infoBits + " · " + statusSpan + "</p></div>" +
              action + "</li>"
            );
          })
          .join("");
        return (
          '<div class="screenings-day"><p class="screenings-day__date font-display">' + R.formatDayHeading(day.date) + "</p>" +
          '<ul class="screenings-day__list">' + rows + "</ul></div>"
        );
      })
      .join("");
    return '<div class="screenings-list">' + days + "</div>";
  }

  function trailerHTML(url, title) {
    var embed = R.toEmbedUrl(url);
    if (!embed) {
      return '<div class="trailer trailer--empty"><p class="font-display">Bande-annonce à venir</p></div>';
    }
    return (
      '<div class="trailer"><iframe src="' + embed + '" title="Bande-annonce — ' + R.escapeHtml(title) + '" loading="lazy" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
    );
  }

  function reviewHTML(review) {
    if (!review) return "";
    var content =
      '<p class="review-quote__text font-display">« ' + R.escapeHtml(review.quote) + ' »</p>' +
      '<p class="review-quote__source font-display">' + R.escapeHtml([review.author, review.source].filter(Boolean).join(" — ")) + "</p>";
    var inner = review.url
      ? '<a href="' + R.escapeHtml(review.url) + '" target="_blank" rel="noopener noreferrer">' + content + "</a>"
      : content;
    return '<blockquote class="review-quote">' + inner + "</blockquote>";
  }

  function renderFilm(film) {
    document.title = film.title + " — Zinéma";
    var nextAvailable = (film.screenings || []).filter(function (s) { return s.status === "disponible"; })[0];

    var nextHTML = nextAvailable
      ? '<div class="film-detail__next"><div><p class="film-detail__next-label font-display">Prochaine séance</p>' +
        '<p class="film-detail__next-time font-display">' + nextAvailable.time + " — " + R.escapeHtml(nextAvailable.room || "") + "</p></div>" +
        R.buyButtonHTML(nextAvailable.sumupCheckoutUrl || film.sumupCheckoutUrl, nextAvailable.price || film.price, "Billet") +
        "</div>"
      : "";

    var originalTitleHTML =
      film.originalTitle && film.originalTitle !== film.title
        ? '<p class="film-detail__original">' + R.escapeHtml(film.originalTitle) + "</p>"
        : "";

    var genresHTML =
      film.genres && film.genres.length
        ? '<div class="film-detail__genres">' +
          film.genres.map(function (g) { return '<span class="film-detail__genre">' + R.escapeHtml(g) + "</span>"; }).join("") +
          "</div>"
        : "";

    var synopsisHTML = film.synopsis ? '<p class="film-detail__synopsis">' + R.escapeHtml(film.synopsis) + "</p>" : "";
    var reviewSection = film.review ? '<section class="film-detail__section">' + reviewHTML(film.review) + "</section>" : "";

    app.innerHTML =
      '<article class="film-detail">' +
      '<div class="film-detail__poster-col"><div class="film-detail__poster">' + R.posterHTML(film, { priority: true }) + "</div>" + nextHTML + "</div>" +
      '<div class="film-detail__main">' +
      '<p class="film-detail__status font-display">' + R.statusLabel(film.status) + "</p>" +
      '<h1 class="film-detail__title font-display">' + R.escapeHtml(film.title) + "</h1>" +
      originalTitleHTML +
      '<div class="film-detail__meta-row"><span>' + R.escapeHtml(film.director) + "</span><span>" + R.escapeHtml(R.filmMetaLine(film)) + "</span></div>" +
      genresHTML +
      synopsisHTML +
      '<section class="film-detail__section"><p class="film-detail__section-label font-display">Séances</p>' + screeningsHTML(film) + "</section>" +
      '<section class="film-detail__section"><p class="film-detail__section-label font-display" style="margin-bottom:0.75rem">Bande-annonce</p>' + trailerHTML(film.trailerUrl, film.title) + "</section>" +
      reviewSection +
      "</div></article>";

    window.ZinemaReveal.observe(app);
  }

  function renderNotFound() {
    app.innerHTML =
      '<div class="film-not-found"><p class="film-not-found__eyebrow font-display">Film introuvable</p>' +
      '<p class="film-not-found__title font-display">Ce film n\'existe pas ou plus.</p>' +
      '<a href="' + root + 'films/" class="film-not-found__link underline-hover">← Retour aux films</a></div>';
  }

  var slug = new URLSearchParams(window.location.search).get("s") || "";
  window.ZinemaData.getFilmBySlug(slug).then(function (film) {
    if (!film) {
      renderNotFound();
    } else {
      renderFilm(film);
    }
  });
})();
