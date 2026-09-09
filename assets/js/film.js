/* ============================================================
   Zinéma — fiche film « Mondrian ». Une seule page réelle
   (film/index.html) qui lit le film demandé dans l'URL (?s=le-slug)
   et pose une case par information.

   Les cases sont écrites À PLAT, dans l'ordre de lecture du
   mobile : titre, acheter, affiche, informations, bande-annonce,
   séances, puis la rangée du bas (synopsis, presse, retour aux
   films). Aucune case n'est imbriquée dans une autre — c'est ce
   qui permet à la grille ordinateur de les replacer librement
   (voir .mondrian--film dans film-mondrian.css) :

     ┌──────────────────────────────────┬───────────┐
     │ TITRE                            │  ACHETER  │
     ├──────────┬───────────────────────┴───────────┤
     │ année · pays · durée · genre · version · âge │
     ├──────────┼───────────────────────┬───────────┤
     │ AFFICHE  │ BANDE-ANNONCE         │ SÉANCES   │
     ├────────────┬────────────────────┬───────────┤
     │ ← LES FILMS│ SYNOPSIS           │ LA PRESSE │
     └────────────┴────────────────────┴───────────┘

   L'affiche tient le tiers gauche, sur la seule rangée de la
   bande-annonce : elle est grande sans faire descendre le reste
   de la page. On voit ainsi le titre, les informations, la
   bande-annonce, les séances et le bouton d'achat sans défiler.

   Sur mobile, l'ordre change sur un point : le synopsis remonte
   entre les informations et la bande-annonce (voir la règle
   display: contents dans film-mondrian.css).
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("film-app");
  var reglages = null;
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;

  var statusSeance = { disponible: "Places disponibles", complet: "Complet", annule: "Annulé" };

  /* Une case d'information : elle n'existe que si la donnée existe —
     pas de case « — » qui ne dit rien. C'est ce qui fait que deux
     films n'ont jamais exactement la même page. */
  /* Un repère du film : l'intitulé au-dessus, la valeur en dessous.
     Comme toutes les cases du tableau, il se cale sur la longueur
     de son texte — c'est ce qui permet à deux ou trois repères
     courts de tenir sur la même rangée, y compris sur mobile. */
  function celluleInfo(label, valeur) {
    if (!valeur) return "";
    return (
      '<div class="m-cell m-info ' + C.classe() + '">' +
      '<p class="m-cell__label">' + label + "</p>" +
      '<p class="m-cell__value">' + R.escapeHtml(valeur) + "</p></div>"
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
    var etiquette = 'aria-label="Acheter un billet pour la séance de ' + R.escapeHtml(seance.time) + '"';

    /* Caisse en ligne : la pastille ouvre le panneau d'achat. */
    if (window.ZinemaData.billetterieEnLigne) {
      return (
        '<button type="button" class="m-seances__chip" data-achat="' +
        R.escapeHtml(seance._id) + '" ' + etiquette + ">" + contenu + "</button>"
      );
    }

    /* Sinon : le lien de paiement collé à la main dans Sanity. */
    var url = seance.sumupCheckoutUrl || film.sumupCheckoutUrl;
    if (url) {
      return (
        '<a class="m-seances__chip" href="' + R.escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" ' +
        etiquette + ">" + contenu + "</a>"
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

  /* Un film annoncé n'a pas encore d'horaires : sa case ne dit donc
     pas « Séances » mais « Sortie », et annonce le jour où il arrive.
     Dès qu'une séance est programmée, la case redevient la liste des
     horaires — même si le film est resté sur « Prochainement » dans
     le Studio, ce sont les séances qui font foi. */
  function estAnnonce(film) {
    return film.status === "prochainement" && seancesAVenir(film).length === 0;
  }

  function sortieHTML(film) {
    var date = R.formatDateSortie(film.releaseDate);
    if (!date) {
      return '<p class="m-seances__vide">Date de sortie à venir.</p>';
    }
    return '<p class="m-sortie__date">À partir du ' + R.escapeHtml(date) + "</p>";
  }

  function caseSeancesHTML(film) {
    var annonce = estAnnonce(film);
    return (
      '<div class="m-cell m-seances ' + C.classeSansSurvol() + '">' +
      '<p class="m-cell__label">' + (annonce ? "Sortie" : "Séances") + "</p>" +
      (annonce ? sortieHTML(film) : seancesHTML(film)) +
      '<a href="' + root + 'agenda/" class="m-seances__agenda">Agenda complet</a></div>'
    );
  }

  /* Le geste principal de la page : acheter un billet. Toujours vert,
     avec les deux tarifs du cinéma. */
  function acheterHTML(film) {
    var prochaine = seancesAVenir(film).filter(function (s) {
      return s.status === "disponible";
    })[0];
    var indisponible =
      '<div class="m-cell m-action m-acheter m-acheter--indisponible">' +
      "<span>Billetterie bientôt disponible</span></div>";

    /* Caisse en ligne : le bouton ouvre le panneau d'achat sur la
       prochaine séance disponible. */
    if (window.ZinemaData.billetterieEnLigne) {
      if (!prochaine) return indisponible;
      return (
        '<button type="button" class="m-cell m-action m-acheter" data-achat="' +
        R.escapeHtml(prochaine._id) + '">' +
        "<span>Acheter</span>" +
        '<span class="m-acheter__prix">' + R.escapeHtml(R.prixLabel(film, prochaine, reglages)) + "</span></button>"
      );
    }

    var url = (prochaine && prochaine.sumupCheckoutUrl) || film.sumupCheckoutUrl;
    if (!url) return indisponible;
    var prix = R.prixLabel(film, prochaine, reglages);
    return (
      '<a class="m-cell m-action m-acheter" href="' + R.escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
      "<span>Acheter</span>" +
      '<span class="m-acheter__prix">' + R.escapeHtml(prix) + "</span></a>"
    );
  }

  /* La bande-annonce occupe sa propre case, à côté de l'affiche :
     une vignette sobre, la vidéo YouTube ne se charge qu'au clic
     (rapide et discret). */
  function baHTML(embed, titre) {
    var idYoutube = embed ? /\/embed\/([\w-]+)/.exec(embed) : null;
    var media;
    if (idYoutube) {
      media =
        '<button type="button" class="m-ba__media m-ba__media--bouton" data-embed="' + R.escapeHtml(embed) + '" aria-label="Lire la bande-annonce">' +
        '<img src="https://i.ytimg.com/vi/' + idYoutube[1] + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">' +
        '<span class="m-ba__play" aria-hidden="true">▶</span></button>';
    } else if (embed) {
      media =
        '<div class="m-ba__media"><iframe src="' + R.escapeHtml(embed) + '" title="Bande-annonce — ' + R.escapeHtml(titre) + '" ' +
        'loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    } else {
      return "";
    }
    return (
      '<div class="m-cell m-ba ' + C.classe() + '">' +
      '<p class="m-cell__label">Bande-annonce</p>' + media + "</div>"
    );
  }

  function brancherBandeAnnonce() {
    var bouton = app.querySelector(".m-ba__media--bouton");
    if (!bouton) return;
    bouton.addEventListener("click", function () {
      var cadre = document.createElement("div");
      cadre.className = "m-ba__media";
      cadre.innerHTML =
        '<iframe src="' + bouton.dataset.embed + '?autoplay=1&rel=0" title="Bande-annonce" ' +
        'allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      bouton.replaceWith(cadre);
    });
  }

  /* La presse ferme la fiche : toute la case est cliquable et ouvre
     l'article quand son lien existe.

     Deux cas, et le plus courant est le second :

     - une citation a été saisie : on l'affiche entre guillemets,
       signée du journal ;
     - il n'y a qu'un lien : la case annonce simplement « Article de
       presse ». C'est le cas normal — trouver une phrase à citer
       prend du temps, coller un lien n'en prend aucun.

     Sans citation NI lien, la case disparaît et la rangée du bas se
     repartage sa largeur.

     Les valeurs sont nettoyées avant d'être jugées : un champ rempli
     d'un simple espace n'est pas un contenu, et affichait jusqu'ici
     une paire de guillemets vides. */
  function presseHTML(film) {
    var review = film.review;
    if (!review) return "";

    var citation = String(review.quote || "").trim();
    var lien = String(review.url || "").trim();
    if (!citation && !lien) return "";

    var signature = [review.author, review.source]
      .map(function (valeur) {
        return String(valeur || "").trim();
      })
      .filter(Boolean)
      .join(", ");

    var corps = citation
      ? '<p class="m-presse__citation">« ' + R.escapeHtml(citation) + " »</p>"
      : '<p class="m-presse__lien">Article de presse</p>';

    var contenu =
      '<p class="m-cell__label">La presse</p>' +
      corps +
      (signature ? '<p class="m-presse__signature">— ' + R.escapeHtml(signature) + "</p>" : "");

    if (lien) {
      return (
        '<a class="m-cell m-presse ' + C.classe() + '" href="' + R.escapeHtml(lien) + '" target="_blank" rel="noopener noreferrer" aria-label="Lire l\'article de presse">' +
        contenu + "</a>"
      );
    }
    return '<div class="m-cell m-presse ' + C.classe() + '">' + contenu + "</div>";
  }

  /* Une bande : une rangée de cases qui traverse le tableau.
     Seules les six informations générales en ont besoin, parce
     qu'elles se partagent une même ligne. Toutes les autres cases
     sont posées à plat dans le tableau, pour que la grille
     ordinateur puisse les replacer une par une. */
  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  function renderFilm(film) {
    document.title = film.title + " — Zinéma";
    var embed = R.toEmbedUrl(film.trailerUrl);

    var original =
      film.originalTitle && film.originalTitle !== film.title
        ? '<p class="m-titre__original">' + R.escapeHtml(film.originalTitle) + "</p>"
        : "";

    var realisation = film.director
      ? '<p class="m-titre__realisation">Un film de ' + R.escapeHtml(film.director) + "</p>"
      : "";

    var vraieAffiche = Boolean(R.sanityImageUrl(film.poster, 1200));

    var titreHTML =
      '<header class="m-cell m-titre ' + C.classe() + '">' +
      "<h1>" + R.escapeHtml(film.title) + "</h1>" + original + realisation + "</header>";

    var afficheHTML =
      '<div class="m-affiche m-affiche--film' + (vraieAffiche ? "" : " m-affiche--generee") + '">' +
      R.posterHTML(film, { priority: true }) + "</div>";

    var infosHTML =
      celluleInfo("Année", film.year ? String(film.year) : "") +
      celluleInfo("Pays", film.country) +
      celluleInfo("Durée", film.duration ? film.duration + " min" : "") +
      /* Le point médian est collé au genre qui le suit (espace
         insécable) : à la coupure, il descend avec lui au lieu de
         rester orphelin en bout de ligne. */
      celluleInfo("Genre", (film.genres || []).join(" ·\u00A0")) +
      celluleInfo("Version", [film.language, film.subtitles].filter(Boolean).join(" ")) +
      celluleInfo("Âge", film.ageRating);

    var synopsisHTML =
      '<div class="m-cell m-synopsis ' + C.classe() + '"><p class="m-cell__label">Synopsis</p>' +
      '<p class="m-synopsis__texte">' + R.escapeHtml(film.synopsis || "Synopsis à venir.") + "</p></div>";

    var seancesCellHTML = caseSeancesHTML(film);

    /* La rangée du bas : synopsis, presse et retour aux films.
       Ses trois cases se partagent la largeur au prorata de leur
       texte — le synopsis prend donc l'essentiel, le lien de
       retour juste ce qu'il lui faut. */
    var basHTML = bande(
      "m-bande--bas",
      synopsisHTML +
        presseHTML(film) +
        '<a href="' + root + 'films/" class="m-cell m-action m-lien-retour ' + C.classe() + '">' +
        "<span>← Tous les films</span></a>"
    );

    /* Les photos du film (« Photos du film » dans le Studio), en une
       bande sous la fiche. Sans photo, pas de bande : jamais de case
       vide dans le tableau. */
    var photosHTML = (film.stillImages || [])
      .map(function (image) {
        var src = R.sanityImageUrl(image, 1200);
        if (!src) return "";
        return (
          '<div class="m-cell m-photo"><img src="' + R.escapeHtml(src) + '" alt="' +
          R.altDeLImage(image, "Photo du film " + film.title) + '" loading="lazy"></div>'
        );
      })
      .filter(Boolean)
      .join("");

    /* Sans bande-annonce, la grille ordinateur laisserait un trou
       noir à sa place : on prévient la feuille de style, qui
       redistribue alors la case aux séances. */
    var baCellHTML = baHTML(embed, film.title);
    var classes = "mondrian mondrian--film" + (baCellHTML ? "" : " mondrian--film-sans-ba");

    app.innerHTML =
      '<article class="' + classes + '">' +
      titreHTML +
      acheterHTML(film) +
      afficheHTML +
      (infosHTML ? bande("m-bande--reperes", infosHTML) : "") +
      baCellHTML +
      seancesCellHTML +
      basHTML +
      (photosHTML ? bande("m-bande--photos", photosHTML) : "") +
      "</article>";

    brancherBandeAnnonce();
    brancherAchat(film);
  }

  /* Un seul écouteur pour toutes les pastilles d'horaire et le
     bouton d'achat : ils portent l'identifiant de leur séance. */
  function brancherAchat(film) {
    if (!window.ZinemaData.billetterieEnLigne) return;
    app.addEventListener("click", function (evenement) {
      var bouton = evenement.target.closest("[data-achat]");
      if (!bouton) return;
      var id = bouton.getAttribute("data-achat");
      var seance = (film.screenings || []).filter(function (s) {
        return s._id === id;
      })[0];
      if (seance) window.ZinemaAchat.ouvrir(seance, film);
    });
  }

  function renderNotFound() {
    app.innerHTML =
      '<article class="mondrian">' +
      bande(
        "m-bande--introuvable",
        '<div class="m-cell m-introuvable ' + C.classe() + '"><p class="m-cell__label">Film introuvable</p>' +
          '<p class="m-cell__value">Ce film n\'existe pas ou plus.</p></div>'
      ) +
      bande(
        "m-bande--retour",
        '<a href="' + root + 'films/" class="m-cell m-action m-lien-retour ' + C.classe() + '"><span>← Tous les films</span></a>'
      ) +
      "</article>";
  }

  var D = window.ZinemaData;
  var slug = new URLSearchParams(window.location.search).get("s") || "";

  app.innerHTML = R.etatChargement("du film");

  Promise.all([D.getFilmBySlug(slug), D.getReglages()]).then(function (r) {
    var film = r[0];

    if (D.estUneErreur(film)) {
      app.innerHTML = R.etatErreur();
      return;
    }

    /* Les tarifs affichés sur le bouton d'achat viennent des
       « Réglages du cinéma » : un prix changé dans Sanity est
       immédiatement le bon ici. */
    reglages = D.estUneErreur(r[1]) ? null : r[1];

    if (!film) {
      renderNotFound();
    } else {
      renderFilm(film);
    }
  });
})();
