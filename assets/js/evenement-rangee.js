/* ============================================================
   Zinéma — un événement en rangée, sur la page Événements, sur le
   modèle des films annoncés juste en dessous (evenements-films.js).

   Demandes du cinéma (12 octobre 2026) : un flyer seul s'étirait
   sur toute la largeur de l'écran — « monstrueux ». L'événement se
   présente donc « comme si c'était un film », avec son flyer en
   vignette, qui se retourne d'un clic pour montrer le texte
   (evenement-carte.js) :

     ┌──────────────┬──────────────────────────────┬──────────────┐
     │ FLYER        │ LE TITRE                     │ TYPE         │
     │ (un clic :   │                              │ date         │
     │  le texte)   │                              │              │
     └──────────────┴──────────────────────────────┴──────────────┘

   Le titre mène à la page de l'événement (evenement-detail.js), où
   le flyer s'affiche en grand. Sans visuel, rien à retourner : le
   texte s'écrit directement sous le titre.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;
  var Detail = global.ZinemaEvenementDetail;
  var Carte = global.ZinemaEvenementCarte;

  /* Le type et la date, comme « Prochainement / dès le … » pour un
     film. Sans type, la date reste seule. */
  function quandHTML(a) {
    var type = Detail.categorie(a);
    return (
      '<div class="m-cell m-annonce__quand m-cell--ligne ' + C.classe() + '">' +
      (type ? '<p class="m-cell__label">' + R.escapeHtml(type) + "</p>" : "") +
      '<p class="m-cell__value">' + R.escapeHtml(Detail.periode(a)) + "</p></div>"
    );
  }

  function bandeHTML(a, index, racine) {
    var lien = racine + "evenements/?e=" + encodeURIComponent(a.slug || a._id || "");
    var carte = Carte.html(a, index);
    return (
      '<div class="m-bande m-bande--annonce m-bande--evenement">' + carte +
      '<div class="m-cell m-annonce__evenement ' + C.classe() + '">' +
      '<a class="m-annonce__titre" href="' + R.escapeHtml(lien) + '">' +
      R.escapeHtml(a.title) + "</a>" +
      (carte ? "" : Detail.texteHTML(a) + Detail.liensHTML(a)) + "</div>" +
      quandHTML(a) +
      "</div>"
    );
  }

  /** Toutes les rangées, dans l'ordre reçu (du plus proche au plus
      lointain). */
  function bandes(evenements) {
    var racine = document.body.dataset.root || "";
    return (evenements || [])
      .filter(function (a) { return a && a.title; })
      .map(function (a, index) { return bandeHTML(a, index, racine); })
      .join("");
  }

  global.ZinemaEvenementRangee = { bandes: bandes };
})(window);
