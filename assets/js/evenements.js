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

   Sous les événements saisis à la main viennent les films que la
   page annonce d'elle-même — ceux qui sortent prochainement, et
   ceux qui passent en présence de quelqu'un. Ils sont construits
   à partir des fiches de film, sans rien à ressaisir : voir
   evenements-films.js.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("evenements-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;
  var Films = window.ZinemaEvenementsFilms;

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
      "<span>" + R.escapeHtml(a.linkLabel || "En savoir plus") + "</span></a>"
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

  /* La page se ferme sur le chemin des séances : une annonce donne
     envie de venir, encore faut-il pouvoir savoir quand. */
  function cadre(contenu) {
    return (
      '<article class="mondrian mondrian--evenements">' + contenu +
      bande("m-bande--actions", R.caseVoirLesSeances()) + "</article>"
    );
  }

  var D = window.ZinemaData;

  app.innerHTML = R.etatChargement("des événements");

  /* Les deux sources arrivent ensemble : les événements saisis dans
     le Studio, et les films que la page déduit toute seule. La page
     ne s'affiche qu'une fois, avec tout — plutôt que de sauter sous
     les yeux du visiteur quand la seconde réponse arrive. */
  Promise.all([D.getEvenements(), D.getFilmsAnnonces()]).then(function (reponses) {
    var evenements = reponses[0];
    var films = reponses[1];

    /* Une seule des deux sources en panne suffit à fausser la page :
       on le dit, on n'affiche pas la moitié d'un programme en
       laissant croire que c'est tout. */
    if (D.estUneErreur(evenements) || D.estUneErreur(films)) {
      app.innerHTML = R.etatErreur();
      return;
    }

    /* Sanity a répondu qu'il n'y a rien : une liste vide, pas une
       panne. Les deux se distinguent plus haut. */
    evenements = evenements || [];

    var bandesFilms = Films.bandes(films);

    /* Rien à annoncer : on n'annonce rien. Une case qui dit « il n'y
       a rien » occupe autant de place qu'une vraie annonce et n'en
       apprend aucune. */
    if (!evenements.length && !bandesFilms) {
      app.innerHTML = "";
      return;
    }

    /* Sans événement saisi, ce sont les films qui ouvrent la page :
       la grande mise en page de l'événement épinglé n'a alors
       personne à mettre en avant. */
    var annonces = evenements.length
      ? uneHTML(evenements[0]) + evenements.slice(1).map(annonceHTML).join("")
      : "";

    app.innerHTML = cadre(annonces + bandesFilms);
  });
})();
