/* ============================================================
   Zinéma — les rangées d'un jour de l'agenda.

   Chaque séance est une rangée de cases — heure / film & salle /
   statut — entièrement cliquable vers la fiche du film. Les cases
   sans film (« Vacances », « Projection privée ») sont des rangées
   qui ne mènent nulle part : ce ne sont pas des séances.

   Séparé de agenda.js, qui garde la page : les vues Jour et Semaine,
   les onglets, le chargement.
   ============================================================ */
(function (global) {
  "use strict";

  var root = document.body.dataset.root || "";
  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;

  var statusText = { disponible: "", complet: "Complet", annule: "Annulé" };

  /* Une séance = une rangée de cases, toute la rangée est cliquable.
     Chaque case tire SA couleur, pas la rangée : au survol, l'heure
     et le titre du film se remplissent de deux couleurs différentes
     — c'est ce qui fait lire la rangée comme un tableau de cases, et
     non comme une seule barre de couleur. Le tirage ne sert jamais
     deux fois la même couleur d'affilée, deux cases voisines sont
     donc toujours distinctes.

     La case statut n'existe que si la séance est complète ou annulée
     (jamais de case vide dans le tableau). */
  function seanceHTML(s) {
    var filmHref = s.film ? root + "film/?s=" + encodeURIComponent(s.film.slug) : root + "films/";
    /* La salle se lit d'un coup d'œil, en capitales et en gras comme
       le titre au-dessus (demande du cinéma, 22 septembre). La note de
       version reste en maigre et telle qu'elle est écrite : « VO st.
       fr » en capitales se lirait plus mal, pas mieux. */
    /* Une séance spéciale (avant-première, en présence de la
       réalisatrice…) porte sa mention dans un bandeau d'encre, sous le
       titre, et non plus en petit à côté de la salle (demande du
       cinéma, 3 novembre 2026). */
    var speciale = R.particularitesDeLaSeance(s, s.film).join(" · ");
    var sub = [
      s.room ? '<span class="m-seance__salle-nom">' + R.escapeHtml(s.room) + "</span>" : "",
      s.versionNote && !speciale ? "— " + R.escapeHtml(s.versionNote) : "",
    ]
      .filter(Boolean)
      .join(" ");
    var heureHTML =
      '<span class="m-cell m-seance__heure c-' + C.suivante() + '">' + s.time + "</span>";
    var infosHTML =
      '<span class="m-cell m-seance__infos c-' + C.suivante() + '">' +
      '<span class="m-seance__titre">' + R.escapeHtml(s.film ? s.film.title : "Séance") + "</span>" +
      (sub ? '<span class="m-seance__salle">' + sub + "</span>" : "") +
      (speciale ? '<span class="m-seance__special">' + R.escapeHtml(speciale) + "</span>" : "") +
      "</span>";
    var statutHTML = statusText[s.status]
      ? '<span class="m-cell m-seance__statut c-' + C.suivante() +
        (s.status === "annule" ? " m-seance__statut--annule" : "") + '">' +
        statusText[s.status] + "</span>"
      : "";
    return (
      '<a class="m-seance" href="' + filmHref + '">' +
      heureHTML + infosHTML + statutHTML + "</a>"
    );
  }

  /* Une case sans film, dans une rangée qui ne mène nulle part : ni
     lien, ni survol. L'étiquette est un bandeau d'encre, comme la
     mention d'une séance spéciale — elle se lit comme une annonce, pas
     comme un titre de film. Une journée fermée (« Vacances ») tient en
     une seule case, sans heure ni salle. */
  function etiquetteHTML(libelle) {
    return '<span class="m-seance__etiquette">' + R.escapeHtml(libelle) + "</span>";
  }

  function journeeFermeeHTML(libelle) {
    return (
      '<div class="m-seance m-seance--sans-film">' +
      '<span class="m-cell m-seance__infos">' + etiquetteHTML(libelle) + "</span></div>"
    );
  }

  function caseSansFilmHTML(c) {
    var heureHTML = c.time
      ? '<span class="m-cell m-seance__heure">' + R.escapeHtml(c.time) + "</span>"
      : "";
    var salleHTML = c.room
      ? '<span class="m-seance__salle"><span class="m-seance__salle-nom">' + R.escapeHtml(c.room) + "</span></span>"
      : "";
    return (
      '<div class="m-seance m-seance--sans-film">' +
      heureHTML +
      '<span class="m-cell m-seance__infos">' + etiquetteHTML(c.libelle) + salleHTML + "</span></div>"
    );
  }

  /* Les rangées d'un jour : la journée fermée d'abord, puis séances et
     cases sans film à leur heure, dans l'ordre du programme. */
  function rangeesDuJourHTML(jour) {
    return (
      jour.journee.map(journeeFermeeHTML).join("") +
      jour.screenings
        .map(function (s) {
          return s.sansFilm ? caseSansFilmHTML(s) : seanceHTML(s);
        })
        .join("")
    );
  }

  global.ZinemaAgendaRangees = { duJour: rangeesDuJourHTML };
})(window);
