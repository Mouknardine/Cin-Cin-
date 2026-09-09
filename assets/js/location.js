/* ============================================================
   Zinéma — page Location, en tableau « Mondrian » comme le reste
   du site : des cases blanches séparées par des traits noirs,
   dont la largeur suit la longueur du texte, et dont la couleur
   est tirée au hasard à chaque affichage.

   On y loue une salle, ou le lieu entier. La page se lit de haut
   en bas comme une visite : ce qu'on peut y faire, chaque espace
   l'un après l'autre, ce qu'il faut savoir, puis le formulaire de
   demande — dernière case, parce que c'est le geste qu'on fait
   une fois qu'on a vu.

   Tout vient de Sanity (« Location »). Une rubrique vide ne
   s'affiche pas : jamais de case vide dans le tableau.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("location-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;
  var D = window.ZinemaData;
  var F = window.ZinemaLocationFormulaire;

  function bande(classe, cases) {
    var contenu = (cases || []).filter(Boolean).join("");
    return contenu ? '<div class="m-bande ' + classe + '">' + contenu + "</div>" : "";
  }

  /* Un texte de Sanity peut arriver en texte simple ou en blocs de
     texte riche : les deux se lisent, on n'en garde que les mots. */
  function texte(valeur) {
    if (typeof valeur === "string") return valeur;
    if (!Array.isArray(valeur)) return "";
    return valeur
      .map(function (bloc) {
        return ((bloc && bloc.children) || [])
          .map(function (enfant) { return enfant.text; })
          .join("");
      })
      .filter(Boolean)
      .join("\n");
  }

  /* Une occasion : une case courte, de la largeur de son mot. Elles
     se lisent d'un coup d'œil — c'est la réponse à « est-ce que je
     peux faire ça ici ? ». */
  function caseOccasion(mot) {
    return '<div class="m-cell m-location__occasion ' + C.classe() + '">' + R.escapeHtml(mot) + "</div>";
  }

  function caseTexte(classe, label, valeur) {
    if (!valeur) return "";
    return (
      '<div class="m-cell ' + classe + " " + C.classe() + '">' +
      (label ? '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" : "") +
      '<p class="m-location__texte">' + R.escapeHtml(valeur) + "</p></div>"
    );
  }

  /* La photo d'un espace : une image horizontale, sans format
     imposé — ce ne sont pas des affiches. */
  function visuelHTML(espace) {
    var src = R.sanityImageUrl(espace.image, 1200);
    if (!src) return "";
    return (
      '<div class="m-cell m-location__visuel"><img src="' + R.escapeHtml(src) + '" alt="' +
      R.altDeLImage(espace.image, espace.nom || "Espace du Zinéma") + '" loading="lazy"></div>'
    );
  }

  /* Un espace = une bande : son nom et sa capacité, sa photo, sa
     description, son équipement, son tarif. Les cases absentes ne
     laissent pas de trou : la bande se repartage la largeur. */
  function espaceHTML(espace) {
    var nom = espace.nom || "Espace";
    var places = typeof espace.places === "number" && espace.places > 0
      ? espace.places + (espace.places > 1 ? " places" : " place")
      : "";

    var caseNom =
      '<div class="m-cell m-location__espace ' + C.classe() + '">' +
      '<p class="m-location__espace-nom">' + R.escapeHtml(nom) + "</p>" +
      (places ? '<p class="m-location__espace-places">' + places + "</p>" : "") +
      "</div>";

    var equipements = (espace.equipements || []).filter(Boolean).join(" · ");

    return bande("m-bande--espace", [
      caseNom,
      visuelHTML(espace),
      caseTexte("m-location__description", "", texte(espace.description)),
      caseTexte("m-location__equipements", "Équipement", equipements),
      caseTexte("m-location__tarif", "Tarif", espace.tarif),
    ]);
  }

  app.innerHTML = R.etatChargement("des espaces à louer");

  D.getLocation().then(function (contenu) {
    if (D.estUneErreur(contenu)) {
      app.innerHTML = R.etatErreur();
      return;
    }
    /* Rien n'est encore rempli dans le Studio : la page ne raconte
       rien plutôt que d'inventer des espaces qui n'existent pas. */
    if (!contenu) {
      app.innerHTML = "";
      return;
    }

    var espaces = (contenu.espaces || []).filter(Boolean);

    app.innerHTML =
      '<article class="mondrian mondrian--location">' +
      bande("m-bande--intro", [
        contenu.intro
          ? '<div class="m-cell m-intro ' + C.classe() + '">' + R.escapeHtml(texte(contenu.intro)) + "</div>"
          : "",
      ]) +
      bande("m-bande--occasions", (contenu.occasions || []).filter(Boolean).map(caseOccasion)) +
      espaces.map(espaceHTML).join("") +
      bande("m-bande--conditions", [
        caseTexte("m-location__conditions", "Bon à savoir", texte(contenu.conditions)),
      ]) +
      (F ? F.html(espaces) : "") +
      /* Après la demande, le chemin des séances : on peut être venu
         pour louer et repartir avec l'envie d'une séance. */
      bande("m-bande--actions", [R.caseVoirLesSeances()]) +
      "</article>";

    if (F) F.brancher(app);
  });
})();
