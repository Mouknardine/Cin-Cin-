/* ============================================================
   Zinéma — page Événements, en tableau « Mondrian » comme le
   reste du site : des cases blanches séparées par des traits
   noirs, dont la couleur est tirée au hasard à chaque affichage.

   Chaque événement y est une carte aux proportions exactes de
   son affiche, en portrait comme en paysage :

     ┌────────┬──────────────────┬──────────┬─────────┐
     │ AFFI-  │     AFFICHE      │  AFFI-   │ (case   │
     │ CHE    │     paysage      │  CHE     │  libre) │
     └────────┴──────────────────┴──────────┴─────────┘

   Un clic sur l'affiche la retourne : l'information est derrière
   (type, date, titre, texte, liens) — voir evenement-carte.js. Le
   détail complet reste à evenements/?e=…, voir evenement-detail.js.

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
  var Carte = window.ZinemaEvenementCarte;
  var D = window.ZinemaData;

  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  /* Les cartes se partagent la rangée au prorata de leur format :
     toutes ont la même hauteur et gardent leurs proportions. La
     case libre finale absorbe ce qui reste au bout de la dernière
     rangée — sans elle, une affiche seule s'étirerait sur toute la
     largeur, et sa hauteur avec. */
  function bandeDesCartes(evenements) {
    return bande(
      "m-bande--cartes",
      evenements.map(Carte.html).join("") +
        '<div class="m-carte-libre ' + C.classe() + '" aria-hidden="true"></div>'
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

      /* Toutes les cartes sur une même bande, séparée des films
         par un trait : on ne peut plus croire qu'elles vont avec. */
      var cartes = evenements.length ? bandeDesCartes(evenements) : "";

      app.innerHTML = cadre(cartes + bandesFilms);
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

  Carte.activer(app);

  if (adresse) {
    app.innerHTML = R.etatChargement("de l'événement");
    afficherLEvenement(adresse);
  } else {
    app.innerHTML = R.etatChargement("des événements");
    afficherLaListe();
  }
})();
