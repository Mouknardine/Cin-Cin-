/* ============================================================
   Zinéma — fiche film « Mondrian ». Une seule page réelle
   (film/index.html) qui lit le film demandé dans l'URL (?s=le-slug)
   et construit un quadrillage : une case = une information.
   La page défile : synopsis complet, toutes les séances à venir,
   bande-annonce intégrée, pied de page dans le quadrillage.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("film-app");
  var R = window.ZinemaRender;

  var statusSeance = { disponible: "Places disponibles", complet: "Complet", annule: "Annulé" };

  /* Une case d'information n'est jamais vide : « — » remplace une donnée manquante. */
  function celluleInfo(classe, label, valeur) {
    return (
      '<div class="m-cell ' + classe + '"><p class="m-cell__label">' + label + "</p>" +
      '<p class="m-cell__value">' + (valeur ? R.escapeHtml(valeur) : "—") + "</p></div>"
    );
  }

  function seancesAVenir(film) {
    return (film.screenings || []).filter(function (s) {
      var date = R.parseISODate(s.date);
      var aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);
      return date >= aujourdhui;
    });
  }

  function chipHTML(seance, film) {
    var note = seance.versionNote || seance.room || "";
    if (seance.status !== "disponible") {
      return (
        '<span class="m-seances__chip m-seances__chip--off">' + R.escapeHtml(seance.time) +
        '<span class="m-seances__chip-note">' + statusSeance[seance.status] + "</span></span>"
      );
    }
    var contenu =
      R.escapeHtml(seance.time) +
      (note ? '<span class="m-seances__chip-note">' + R.escapeHtml(note) + "</span>" : "");
    var url = seance.sumupCheckoutUrl || film.sumupCheckoutUrl;
    if (url) {
      return (
        '<a class="m-seances__chip" href="' + R.escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" ' +
        'aria-label="Réserver la séance de ' + R.escapeHtml(seance.time) + '">' + contenu + "</a>"
      );
    }
    return '<span class="m-seances__chip">' + contenu + "</span>";
  }

  function seancesHTML(film) {
    var seances = seancesAVenir(film);
    if (seances.length === 0) {
      return '<p class="m-seances__vide">Aucune séance pour le moment.</p>';
    }
    var jours = [];
    var index = {};
    seances.forEach(function (s) {
      if (!(s.date in index)) {
        index[s.date] = jours.length;
        jours.push({ date: s.date, liste: [] });
      }
      jours[index[s.date]].liste.push(s);
    });
    var blocs = jours
      .map(function (jour) {
        var chips = jour.liste.map(function (s) { return chipHTML(s, film); }).join("");
        return (
          '<div class="m-seances__bloc"><p class="m-seances__jour">' + R.formatDayHeading(jour.date) + "</p>" +
          '<div class="m-seances__chips">' + chips + "</div></div>"
        );
      })
      .join("");
    return '<div class="m-seances__jours">' + blocs + "</div>";
  }

  function reserverHTML(film) {
    var prochaine = seancesAVenir(film).filter(function (s) {
      return s.status === "disponible";
    })[0];
    var url = (prochaine && prochaine.sumupCheckoutUrl) || film.sumupCheckoutUrl;
    var prix = (prochaine && prochaine.price) || film.price;
    if (!url) {
      return (
        '<div class="m-cell m-action m-reserver m-reserver--indisponible">' +
        "<span>Billetterie bientôt disponible</span></div>"
      );
    }
    return (
      '<a class="m-cell m-action m-reserver" href="' + R.escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
      "<span>Réserver" + (prix ? ' <span class="m-reserver__prix">' + R.escapeHtml(prix) + "</span>" : "") + "</span></a>"
    );
  }

  /* La bande-annonce vit dans la case Synopsis : une vignette sobre,
     la vidéo YouTube ne se charge qu'au clic (rapide et discret). */
  function baHTML(embed, titre) {
    if (!embed) return "";
    var idYoutube = /\/embed\/([\w-]+)/.exec(embed);
    var lecteur =
      '<iframe src="' + R.escapeHtml(embed) + '" title="Bande-annonce — ' + R.escapeHtml(titre) + '" ' +
      'loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    var contenu = idYoutube
      ? '<button type="button" class="m-ba__facade" data-embed="' + R.escapeHtml(embed) + '" aria-label="Lire la bande-annonce">' +
        '<img src="https://i.ytimg.com/vi/' + idYoutube[1] + '/hqdefault.jpg" alt="" loading="lazy">' +
        '<span class="m-ba__play" aria-hidden="true">▶</span></button>'
      : '<div class="m-ba__cadre">' + lecteur + "</div>";
    return '<div class="m-ba"><p class="m-cell__label m-ba__label">Bande-annonce</p>' + contenu + "</div>";
  }

  function brancherBandeAnnonce() {
    var facade = app.querySelector(".m-ba__facade");
    if (!facade) return;
    facade.addEventListener("click", function () {
      var cadre = document.createElement("div");
      cadre.className = "m-ba__cadre";
      cadre.innerHTML =
        '<iframe src="' + facade.dataset.embed + '?autoplay=1&rel=0" title="Bande-annonce" ' +
        'allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      facade.replaceWith(cadre);
    });
  }

  function piedHTML(settings) {
    settings = settings || {};
    var tel = settings.phone
      ? '<a class="m-cell m-pied m-pied--tel" href="tel:' + R.escapeHtml(String(settings.phone).replace(/\s/g, "")) + '">' +
        R.escapeHtml(settings.phone) + "</a>"
      : '<div class="m-cell m-pied m-pied--tel" aria-hidden="true"></div>';
    var email = settings.email
      ? '<a class="m-cell m-pied m-pied--email" href="mailto:' + R.escapeHtml(settings.email) + '">' +
        R.escapeHtml(settings.email) + "</a>"
      : '<div class="m-cell m-pied m-pied--email" aria-hidden="true"></div>';
    return (
      '<a class="m-cell m-pied m-pied--nom" href="' + root + '"><span class="m-pied__nom">Zinéma</span></a>' +
      '<div class="m-cell m-pied m-pied--adresse">' +
      R.escapeHtml(settings.address || "Cinéma indépendant à Lausanne") + "</div>" +
      tel + email
    );
  }

  function langueLigne(film) {
    return [
      [film.language, film.subtitles].filter(Boolean).join(" "),
      film.ageRating,
      film.country,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  /* Sous l'affiche : la citation presse du film — toute la case est
     cliquable et ouvre l'article complet quand son lien existe.
     Sans citation : la carte de visite du cinéma (jamais de case vide). */
  function presseHTML(film, settings) {
    var review = film.review;
    if (review && review.quote) {
      var signature = [review.author, review.source].filter(Boolean).join(", ");
      var contenu =
        '<p class="m-cell__label">La presse</p>' +
        '<p class="m-presse__citation">« ' + R.escapeHtml(review.quote) + " »</p>" +
        (signature ? '<p class="m-presse__signature">— ' + R.escapeHtml(signature) + "</p>" : "");
      if (review.url) {
        return (
          '<a class="m-cell m-presse" href="' + R.escapeHtml(review.url) + '" target="_blank" rel="noopener noreferrer">' +
          contenu + '<span class="m-presse__lien">Lire l\'article</span></a>'
        );
      }
      return '<div class="m-cell m-presse">' + contenu + "</div>";
    }
    return (
      '<div class="m-cell m-presse"><p class="m-cell__label">Le Zinéma</p>' +
      '<p class="m-cell__value">' + R.escapeHtml((settings && settings.tagline) || "Cinéma indépendant à Lausanne") + "</p></div>"
    );
  }

  function renderFilm(film, settings) {
    document.title = film.title + " — Zinéma";
    var embed = R.toEmbedUrl(film.trailerUrl);

    var original =
      film.originalTitle && film.originalTitle !== film.title
        ? '<p class="m-titre__original">' + R.escapeHtml(film.originalTitle) + "</p>"
        : "";

    var realisation = film.director
      ? '<p class="m-titre__realisation">Un film de ' + R.escapeHtml(film.director) + "</p>"
      : "";

    var vraieAffiche = Boolean(R.sanityImageUrl(film.poster, 1200) || R.localImageUrl(film.poster));

    app.innerHTML =
      '<article class="mondrian">' +
      '<div class="m-colonne-affiche">' +
      '<div class="m-affiche' + (vraieAffiche ? "" : " m-affiche--generee") + '">' +
      R.posterHTML(film, { priority: true }) + "</div>" +
      presseHTML(film, settings) + "</div>" +
      '<header class="m-cell m-titre">' +
      '<p class="m-titre__statut">' + R.statusLabel(film.status) + "</p>" +
      "<h1>" + R.escapeHtml(film.title) + "</h1>" + original + realisation + "</header>" +
      celluleInfo("m-annee", "Année", film.year ? String(film.year) : "") +
      celluleInfo("m-duree", "Durée", film.duration ? film.duration + " min" : "") +
      celluleInfo("m-genre", "Genre", (film.genres || []).join(" · ")) +
      celluleInfo("m-langue", "Version", langueLigne(film)) +
      '<div class="m-cell m-synopsis"><p class="m-cell__label">Synopsis</p>' +
      '<p class="m-synopsis__texte">' + R.escapeHtml(film.synopsis || "Synopsis à venir.") + "</p>" +
      baHTML(embed, film.title) + "</div>" +
      '<div class="m-cell m-seances"><p class="m-cell__label">Séances</p>' + seancesHTML(film) +
      '<a href="' + root + 'agenda/" class="m-seances__agenda">Agenda complet</a></div>' +
      '<a href="' + root + 'films/" class="m-cell m-action m-retour"><span>← Tous les films</span></a>' +
      reserverHTML(film) +
      piedHTML(settings) +
      "</article>";

    brancherBandeAnnonce();
  }

  function renderNotFound() {
    app.innerHTML =
      '<article class="mondrian">' +
      '<a href="' + root + 'films/" class="m-cell m-action m-retour"><span>← Tous les films</span></a>' +
      '<div class="m-cell m-introuvable"><p class="m-cell__label">Film introuvable</p>' +
      '<p class="m-cell__value">Ce film n\'existe pas ou plus.</p></div>' +
      "</article>";
  }

  var slug = new URLSearchParams(window.location.search).get("s") || "";
  Promise.all([
    window.ZinemaData.getFilmBySlug(slug),
    window.ZinemaData.getSiteSettings(),
  ]).then(function (resultats) {
    var film = resultats[0];
    if (!film) {
      renderNotFound();
    } else {
      renderFilm(film, resultats[1]);
    }
  });
})();
