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
    /* Vraie affiche = affiche déposée dans le Studio. Sinon, le site
       fabrique une affiche typographique à partir du titre. */
    var vraieAffiche = Boolean(R.afficheUrl(film.poster));
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
       rubrique À l'affiche. Un film annoncé fait exception : sa date
       de sortie remplace le statut et se dit dans toutes les
       rubriques, parce qu'elle apprend quelque chose. */
    var sortie =
      film.status === "prochainement" ? R.formatDateSortieCourte(film.releaseDate) : "";
    var statut;
    if (sortie) {
      statut = '<p class="m-film__statut">Dès le ' + R.escapeHtml(sortie) + "</p>";
    } else if (film.status === activeFilter) {
      statut = "";
    } else {
      statut = '<p class="m-film__statut">' + R.statusLabel(film.status) + "</p>";
    }
    return (
      '<a href="' + root + "film/?s=" + encodeURIComponent(film.slug) + '" class="m-film">' +
      '<div class="m-affiche m-affiche--film' + (vraieAffiche ? "" : " m-affiche--generee") + '">' +
      R.posterHTML(film) + "</div>" +
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

  /* Le paragraphe d'introduction se règle dans le Studio
     (« Pages du site → Textes des pages »). Vide, il n'y a
     simplement pas de bande. */
  /* L'introduction seule, dans son cadre, pour les pages qui n'ont
     rien d'autre à afficher. */
  function cadreIntro() {
    return intro ? '<article class="mondrian">' + introHTML() + "</article>" : "";
  }

  function introHTML() {
    if (!intro) return "";
    return (
      '<div class="m-bande m-bande--intro"><div class="m-cell m-intro ' +
      C.classe() + '">' + R.escapeHtml(intro) + "</div></div>"
    );
  }

  function filtreHTML(filtre) {
    return (
      '<button type="button" class="m-filtre ' + C.classeVive() +
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
      '<a href="' + root + 'agenda/" class="m-cell m-action m-films-agenda ' + C.classe() + '"><span>Agenda complet</span></a>';

    /* Une rubrique sans film n'affiche rien : les filtres restent
       au-dessus, il suffit d'en choisir un autre. Une case pour dire
       « il n'y a rien » n'apprendrait rien de plus. */
    var filmsHTML = visible.length
      ? '<div class="m-films">' + visible.map(filmHTML).join("") + agendaHTML + "</div>"
      : "";

    app.innerHTML =
      '<article class="mondrian">' + introHTML() + filtresHTML + filmsHTML + "</article>";

    app.querySelectorAll(".m-filtre").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeFilter = btn.dataset.filter;
        render();
      });
    });
  }

  var D = window.ZinemaData;
  var intro = "";

  app.innerHTML = R.etatChargement("des films");

  Promise.all([D.getFilms(), D.getPage("films")]).then(function (r) {
    var films = r[0];
    var page = r[1];
    intro = (page && page.intro) || "";

    if (D.estUneErreur(films)) {
      app.innerHTML = R.etatErreur();
      return;
    }
    /* Le paragraphe d'introduction reste affiché même quand il n'y a
       rien à montrer : sinon un texte écrit dans le Studio semblerait
       ne servir à rien. Rien d'autre n'est ajouté. */
    if (!films.length) {
      app.innerHTML = cadreIntro();
      return;
    }
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
