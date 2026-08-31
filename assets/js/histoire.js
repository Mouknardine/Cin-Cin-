/* ============================================================
   Zinéma — page Histoire, en tableau « Mondrian » comme le reste
   du site : des cases blanches séparées par des traits noirs,
   dont la largeur suit la longueur du texte, et dont la couleur
   est tirée au hasard à chaque affichage.

   La bande d'ouverture pose l'âge du cinéma à côté du texte
   d'introduction ; chaque étape tient ensuite sur une bande :
   l'année, son visuel s'il y en a un, le titre, le texte.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("histoire-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;

  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  /* Le texte d'une étape arrive de Sanity en blocs de texte riche :
     on n'en garde que les paragraphes, séparés par une ligne vide. */
  function texteEtape(body) {
    if (typeof body === "string") return body;
    if (!Array.isArray(body)) return "";
    return body
      .map(function (bloc) {
        return ((bloc && bloc.children) || [])
          .map(function (enfant) { return enfant.text; })
          .join("");
      })
      .filter(Boolean)
      .join("\n\n");
  }

  /* La case de l'année : le repère chronologique, en grand. */
  function anneeHTML(annee, label) {
    return (
      '<div class="m-cell m-histoire__annee ' + C.classe() + '">' +
      (label ? '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" : "") +
      '<p class="m-histoire__annee-valeur">' + R.escapeHtml(annee) + "</p></div>"
    );
  }

  /* L'âge du cinéma, calculé depuis sa première étape : il ouvre la
     page et se met à jour tout seul d'une année sur l'autre. La
     première étape pouvant couvrir une période (« 2001–2003 »), on
     n'en retient que la première année. */
  function ageHTML(premiereEtape) {
    var annee = String(premiereEtape.year || "").match(/\d{4}/);
    var ans = annee ? new Date().getFullYear() - Number(annee[0]) : 0;
    if (ans < 1) return anneeHTML(premiereEtape.year, "Depuis");
    return anneeHTML(ans + (ans > 1 ? " ans" : " an"), "Depuis " + annee[0]);
  }

  /* Le visuel n'existe que si l'étape en a un : jamais de case
     vide dans le tableau. */
  function visuelHTML(entree) {
    var src = R.sanityImageUrl(entree.image, 900);
    if (!src) return "";
    return (
      '<div class="m-affiche m-histoire__visuel"><div class="poster">' +
      '<img src="' + R.escapeHtml(src) + '" alt="' +
      R.altDeLImage(entree.image, entree.title) + '" loading="lazy"></div></div>'
    );
  }

  function etapeHTML(entree) {
    var texte = texteEtape(entree.body);
    return bande(
      "m-bande--etape",
      anneeHTML(entree.year) +
        visuelHTML(entree) +
        '<div class="m-cell m-histoire__titre ' + C.classe() + '">' + R.escapeHtml(entree.title) + "</div>" +
        (texte ? '<div class="m-cell m-histoire__texte ' + C.classe() + '">' + R.escapeHtml(texte) + "</div>" : "")
    );
  }

  var D = window.ZinemaData;

  function cadre(contenu) {
    return '<article class="mondrian mondrian--histoire">' + contenu + "</article>";
  }

  app.innerHTML = R.etatChargement("de l'histoire du cinéma");

  Promise.all([D.getHistory(), D.getPage("histoire")]).then(function (resultats) {
    var entrees = resultats[0];
    var page = resultats[1];

    if (D.estUneErreur(entrees)) {
      app.innerHTML = R.etatErreur();
      return;
    }

    /* L'introduction se règle dans « Pages du site → Histoire ».
       Vide, il n'y a simplement pas de paragraphe. */
    var intro = (page && page.intro) || "";

    if (!entrees.length) {
      app.innerHTML = cadre(
        bande(
          "m-bande--vide",
          '<div class="m-cell m-vide ' + C.classe() + '"><p class="m-cell__label">Histoire</p>' +
            '<p class="m-cell__value">' +
            R.escapeHtml(intro || (page && page.messageVide) || "") +
            "</p></div>"
        )
      );
      return;
    }

    var ouverture = bande(
      "m-bande--intro",
      ageHTML(entrees[0]) +
        (intro
          ? '<div class="m-cell m-histoire__intro ' + C.classe() + '">' +
            R.escapeHtml(intro) + "</div>"
          : "")
    );

    app.innerHTML = cadre(ouverture + entrees.map(etapeHTML).join(""));
  });
})();
