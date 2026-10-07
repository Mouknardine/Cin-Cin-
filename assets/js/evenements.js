/* ============================================================
   Zinéma — page Événements, en tableau « Mondrian » comme le
   reste du site : des cases blanches séparées par des traits
   noirs, dont la couleur est tirée au hasard à chaque affichage.

   Chaque événement n'y est montré QUE par son affiche :

     ┌──────────────┬──────────────┬──────────────┐
     │   AFFICHE    │   AFFICHE    │   AFFICHE    │
     └──────────────┴──────────────┴──────────────┘

   Un clic sur l'affiche ouvre l'événement en détail (type, date,
   texte, films, lien) — evenements/?e=…, voir evenement-detail.js.
   Quatre cases par événement, comme avant, se lisaient comme un
   même bloc avec les films annoncés juste dessous.

   La page n'affiche que les événements en cours ou à venir : ceux
   dont le dernier jour est passé s'archivent tout seuls dans le
   Studio, sans rien décocher.

   Sous les affiches viennent les films que la page annonce
   d'elle-même — ceux qui sortent prochainement, et ceux qui passent
   en présence de quelqu'un. Ils sont construits à partir des fiches
   de film, sans rien à ressaisir : voir evenements-films.js.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("evenements-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;
  var Films = window.ZinemaEvenementsFilms;
  var Detail = window.ZinemaEvenementDetail;
  var D = window.ZinemaData;

  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  /* Une affiche, et rien d'autre : c'est elle le lien. Le type et la
     date ne s'affichent pas, mais sont lus par les lecteurs d'écran
     avec le titre — le lien dit où il mène. Sans visuel déposé dans
     le Studio, le titre prend la place de l'image, sur un fond de
     couleur. La première affiche se charge tout de suite : c'est
     elle qu'on voit en arrivant. */
  function vignetteHTML(a, index) {
    var racine = document.body.dataset.root || "";
    var src = R.sanityImageUrl(a.image, 900);
    var contenu = src
      ? '<img src="' + R.escapeHtml(src) + '" alt="' + R.escapeHtml(a.title) +
        '" loading="' + (index === 0 ? "eager" : "lazy") + '">'
      : '<span class="m-vignette__titre">' + R.escapeHtml(a.title) + "</span>";
    return (
      '<a class="m-cell m-vignette' + (src ? "" : " m-vignette--texte") + " " + C.classe() +
      '" href="' + racine + "evenements/?e=" + encodeURIComponent(a.slug) + '">' + contenu +
      '<span class="visually-hidden">, ' +
      R.escapeHtml([Detail.categorie(a), Detail.periode(a)].filter(Boolean).join(", ")) +
      "</span></a>"
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

  /* La liste : les affiches des événements, puis les films. */
  function afficherLaListe() {
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

      /* Toutes les affiches sur une même bande, séparée des films
         par un trait : on ne peut plus croire qu'elles vont avec. */
      var affiches = evenements.length
        ? bande("m-bande--vignettes", evenements.map(vignetteHTML).join(""))
        : "";

      app.innerHTML = cadre(affiches + bandesFilms);
    });
  }

  /* Un événement en détail, retrouvé parmi ceux de la page : un
     événement terminé n'y est plus, et l'adresse le dit. */
  function afficherLEvenement(adresse) {
    D.getEvenements().then(function (evenements) {
      if (D.estUneErreur(evenements)) {
        app.innerHTML = R.etatErreur();
        return;
      }
      var evenement = (evenements || []).filter(function (a) {
        return a && (a.slug === adresse || a._id === adresse);
      })[0];
      if (!evenement) {
        app.innerHTML = Detail.introuvable();
        return;
      }
      document.title = evenement.title + " — Zinéma";
      app.innerHTML = Detail.html(evenement);
    });
  }

  var adresse = new URLSearchParams(window.location.search).get("e");

  if (adresse) {
    app.innerHTML = R.etatChargement("de l'événement");
    afficherLEvenement(adresse);
  } else {
    app.innerHTML = R.etatChargement("des événements");
    afficherLaListe();
  }
})();
