/* ============================================================
   Zinéma — page Événement, en tableau « Mondrian » comme le
   reste du site : des cases blanches séparées par des traits
   noirs, dont la largeur suit la longueur du texte, et dont la
   couleur est tirée au hasard à chaque affichage.

   L'événement épinglé ouvre la page en grand :

     ┌──────────┬───────────────────────────────────┐
     │ VISUEL   │ LE TITRE DE L'ÉVÉNEMENT           │
     ├──────────┴──────────┬────────────┬───────────┤
     │ ÉVÉNEMENT · 22 JUIL.│ Le texte…  │ EN SAVOIR │
     └─────────────────────┴────────────┴───────────┘

   Les annonces suivantes tiennent chacune sur une bande :
   date & catégorie, titre, texte, lien.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("evenements-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;

  var categoryLabels = {
    nouveaute: "Nouveauté",
    evenement: "Évènement",
    cycle: "Cycle",
    brunch: "Brunch",
    info: "Info spéciale",
  };

  function categorie(a) {
    return categoryLabels[a.category] || "Annonce";
  }

  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  /* La case date & catégorie, commune à toutes les annonces. */
  function quandHTML(a) {
    return (
      '<div class="m-cell m-annonce__quand m-cell--ligne ' + C.classe() + '">' +
      '<p class="m-cell__label">' + categorie(a) + "</p>" +
      '<p class="m-cell__value">' + R.formatLongDate(a.date) + "</p></div>"
    );
  }

  function texteHTML(a) {
    if (!a.excerpt) return "";
    return '<div class="m-cell m-annonce__texte ' + C.classe() + '">' + R.escapeHtml(a.excerpt) + "</div>";
  }

  /* Le lien « En savoir plus » n'existe que si l'annonce en a un :
     jamais de case vide dans le tableau. */
  function lienHTML(a) {
    if (!a.linkUrl) return "";
    return (
      '<a class="m-cell m-annonce__lien ' + C.classe() + '" href="' +
      R.escapeHtml(a.linkUrl) + '" target="_blank" rel="noopener noreferrer">' +
      "<span>En savoir plus →</span></a>"
    );
  }

  /* L'événement épinglé : deux bandes, le visuel en grand. */
  function uneHTML(a) {
    var src = R.sanityImageUrl(a.image, 1200) || R.localImageUrl(a.image);
    var visuelHTML = src
      ? '<div class="m-affiche m-annonce__visuel"><div class="poster">' +
        '<img src="' + R.escapeHtml(src) + '" alt="Affiche — ' + R.escapeHtml(a.title) + '" loading="eager"></div></div>'
      : "";

    var titreHTML =
      '<div class="m-cell m-annonce__une-titre ' + C.classe() + '">' +
      "<h2>" + R.escapeHtml(a.title) + "</h2></div>";

    return (
      bande("m-bande--une", visuelHTML + titreHTML) +
      bande("m-bande--une-infos", quandHTML(a) + texteHTML(a) + lienHTML(a))
    );
  }

  /* Les annonces suivantes : une bande chacune. */
  function annonceHTML(a) {
    return bande(
      "m-bande--annonce",
      quandHTML(a) +
        '<div class="m-cell m-annonce__titre ' + C.classe() + '">' + R.escapeHtml(a.title) + "</div>" +
        texteHTML(a) +
        lienHTML(a)
    );
  }

  window.ZinemaData.getAnnouncements().then(function (annonces) {
    if (annonces.length === 0) {
      app.innerHTML =
        '<article class="mondrian mondrian--evenements">' +
        bande(
          "m-bande--vide",
          '<div class="m-cell m-vide ' + C.classe() + '"><p class="m-cell__label">Événements</p>' +
            '<p class="m-cell__value">Rien de programmé pour le moment.</p></div>'
        ) +
        "</article>";
      return;
    }

    app.innerHTML =
      '<article class="mondrian mondrian--evenements">' +
      uneHTML(annonces[0]) +
      annonces.slice(1).map(annonceHTML).join("") +
      "</article>";
  });
})();
