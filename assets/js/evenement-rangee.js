/* ============================================================
   Zinéma — un événement en rangée, sur la page Événements, sur le
   modèle des films annoncés juste en dessous (evenements-films.js).

   Demande du cinéma (12 octobre 2026) : un flyer seul sur sa
   rangée s'étirait sur toute la largeur de l'écran — « monstrueux ».
   L'événement se présente donc « comme si c'était un film », mais
   avec une vignette en paysage :

     ┌──────────────┬──────────────────────────────┬──────────────┐
     │ VIGNETTE     │ LE TITRE                     │ TYPE         │
     │ paysage      │ Le texte complet, mis en     │ date         │
     │              │ forme ; liens, films reliés  │              │
     └──────────────┴──────────────────────────────┴──────────────┘

   Tout le texte se lit directement, sans rien à ouvrir ; il
   s'écrit comme sur la page de l'événement (texteHTML, liensHTML
   de evenement-detail.js). La
   vignette et le titre mènent à la page de l'événement
   (evenement-detail.js), où le flyer s'affiche en grand. Sans
   visuel, la rangée commence par le texte.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;
  var Detail = global.ZinemaEvenementDetail;

  /* La vignette : le flyer ENTIER, jamais recadré. Elle double le
     lien du titre ; elle est donc retirée du parcours au clavier,
     comme l'affiche d'un film annoncé. */
  function vignetteHTML(a, lien) {
    var src = R.sanityImageUrl(a.image, 800);
    if (!src) return "";
    return (
      '<a class="m-cell m-annonce__vignette ' + C.classe() + '" href="' + R.escapeHtml(lien) +
      '" tabindex="-1" aria-hidden="true"><img src="' + R.escapeHtml(src) + '" alt="' +
      R.altDeLImage(a.image, a.title) + '" loading="lazy" decoding="async"></a>'
    );
  }

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

  function bandeHTML(a, racine) {
    var lien = racine + "evenements/?e=" + encodeURIComponent(a.slug || a._id || "");
    return (
      '<div class="m-bande m-bande--annonce m-bande--evenement">' +
      vignetteHTML(a, lien) +
      '<div class="m-cell m-annonce__evenement ' + C.classe() + '">' +
      '<a class="m-annonce__titre" href="' + R.escapeHtml(lien) + '">' +
      R.escapeHtml(a.title) + "</a>" +
      Detail.texteHTML(a) + Detail.liensHTML(a) + "</div>" +
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
      .map(function (a) { return bandeHTML(a, racine); })
      .join("");
  }

  global.ZinemaEvenementRangee = { bandes: bandes };
})(window);
