/* ============================================================
   Zinéma — page Événements, en tableau « Mondrian » comme le
   reste du site : des cases blanches séparées par des traits
   noirs, dont la largeur suit la longueur du texte, et dont la
   couleur est tirée au hasard à chaque affichage.

   L'événement épinglé ouvre la page en grand :

     ┌──────────┬───────────────────────────────────┐
     │ VISUEL   │ LE TITRE DE L'ÉVÉNEMENT           │
     ├──────────┴──────────┬────────────┬───────────┤
     │ ÉVÉNEMENT · DATE    │ Le texte…  │ EN SAVOIR │
     └─────────────────────┴────────────┴───────────┘

   Les événements suivants tiennent chacun sur une bande :
   période & type, titre, texte, lien.

   La page n'affiche que les événements en cours ou à venir : ceux
   dont le dernier jour est passé s'archivent tout seuls dans le
   Studio, sans rien décocher.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("evenements-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;

  var categoryLabels = {
    cycle: "Cycle",
    "cine-club": "Ciné-club",
    brunch: "Brunch",
    "seance-speciale": "Séance spéciale",
    festival: "Festival",
    info: "Information",
  };

  function categorie(a) {
    return categoryLabels[a.category] || "Événement";
  }

  /* « du 3 au 19 juillet » si l'événement dure, « 3 juillet » sinon. */
  function periode(a) {
    if (a.dateFin && a.dateFin !== a.dateDebut) {
      return "du " + R.formatLongDate(a.dateDebut) + " au " + R.formatLongDate(a.dateFin);
    }
    return R.formatLongDate(a.dateDebut);
  }

  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  /* La case date & catégorie, commune à toutes les annonces. */
  function quandHTML(a) {
    return (
      '<div class="m-cell m-annonce__quand m-cell--ligne ' + C.classe() + '">' +
      '<p class="m-cell__label">' + categorie(a) + "</p>" +
      '<p class="m-cell__value">' + R.escapeHtml(periode(a)) + "</p></div>"
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
      "<span>" + R.escapeHtml(a.linkLabel || "En savoir plus") + " →</span></a>"
    );
  }

  /* Les films reliés à l'événement dans le Studio : leurs affiches
     apparaissent ici sans qu'on ait rien à recopier. */
  function filmsHTML(a) {
    if (!a.films || !a.films.length) return "";
    return a.films
      .map(function (f) {
        var src = R.afficheUrl(f.poster, 600);
        if (!src) return "";
        return (
          '<a class="m-affiche m-affiche--film m-annonce__film" href="../film/?s=' +
          encodeURIComponent(f.slug) + '"><div class="poster"><img src="' +
          R.escapeHtml(src) + '" alt="' + R.altDeLImage(f.poster, "Affiche de " + f.title) +
          '" loading="lazy"></div></a>'
        );
      })
      .join("");
  }

  /* L'événement épinglé : deux bandes, le visuel en grand. */
  function uneHTML(a) {
    var src = R.sanityImageUrl(a.image, 1200);
    var visuelHTML = src
      ? '<div class="m-affiche m-annonce__visuel"><div class="poster">' +
        '<img src="' + R.escapeHtml(src) + '" alt="' +
        R.altDeLImage(a.image, a.title) + '" loading="eager"></div></div>'
      : "";

    var titreHTML =
      '<div class="m-cell m-annonce__une-titre ' + C.classe() + '">' +
      "<h2>" + R.escapeHtml(a.title) + "</h2></div>";

    var films = filmsHTML(a);
    return (
      bande("m-bande--une", visuelHTML + titreHTML) +
      bande("m-bande--une-infos", quandHTML(a) + texteHTML(a) + lienHTML(a)) +
      (films ? bande("m-bande--une-films", films) : "")
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

  function cadre(contenu) {
    return '<article class="mondrian mondrian--evenements">' + contenu + "</article>";
  }

  var D = window.ZinemaData;

  app.innerHTML = R.etatChargement("des événements");

  Promise.all([D.getEvenements(), D.getPage("evenements")]).then(function (r) {
    var evenements = r[0];
    var page = r[1];

    if (D.estUneErreur(evenements)) {
      app.innerHTML = R.etatErreur();
      return;
    }

    var intro =
      page && page.intro
        ? bande(
            "m-bande--intro",
            '<div class="m-cell m-intro ' + C.classe() + '">' +
              R.escapeHtml(page.intro) + "</div>"
          )
        : "";

    /* Rien à annoncer : on n'annonce rien. Une case qui dit « il n'y
       a rien » occupe autant de place qu'une vraie annonce et n'en
       apprend aucune. Seul le paragraphe d'introduction subsiste,
       s'il a été écrit — c'est du texte voulu, pas un bouche-trou. */
    if (!evenements.length) {
      app.innerHTML = intro ? cadre(intro) : "";
      return;
    }

    app.innerHTML = cadre(
      intro + uneHTML(evenements[0]) + evenements.slice(1).map(annonceHTML).join("")
    );
  });
})();
