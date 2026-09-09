/* ============================================================
   Zinéma — page Histoire, en tableau « Mondrian » comme le reste
   du site : des cases blanches séparées par des traits noirs,
   dont la largeur suit la longueur du texte, et dont la couleur
   est tirée au hasard à chaque affichage.

   Une étape ne tient PAS sur une seule bande. Elle en occupe
   deux ou trois, empilées, et c'est ce qui la rend lisible :

     ┌──────┬──────────────────────────────────────────────────┐
     │ 2001 │ OUVERTURE                                        │
     ├──────┴──────────────────────────────────────────────────┤
     │ Le Zinéma est fondé en juin 2001 par Laurent Serge…     │
     ├───────────────────┬──────────────────┬──────────────────┤
     │ ARCHITECTURE      │ DESIGN           │ GRAPHISME        │
     │ Christophe Piguet…│ Elise Gagnebin…  │ Stéphane Hern…   │
     └───────────────────┴──────────────────┴──────────────────┘

   Tout sur une seule bande, l'année et le titre s'étiraient sur
   toute la hauteur du texte : deux colonnes vides hautes comme
   trois écrans, à côté d'un pavé illisible.

   Les lignes de la forme « Architecture : Untel » sont reconnues
   comme des crédits et deviennent des cases intitulé/valeur — le
   même gabarit que les repères d'une fiche film. Le reste du texte
   est du récit, et se lit comme tel.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("histoire-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;
  var D = window.ZinemaData;
  var root = document.body.dataset.root || "";

  function bande(classe, cases) {
    var contenu = (Array.isArray(cases) ? cases : [cases]).filter(Boolean).join("");
    return contenu ? '<div class="m-bande ' + classe + '">' + contenu + "</div>" : "";
  }

  /* Le texte d'une étape arrive de Sanity en blocs de texte riche :
     on en tire la liste des paragraphes, sans les fondre en un seul
     bloc — c'est leur découpage qui fait la mise en page. */
  function paragraphes(body) {
    if (typeof body === "string") {
      return body.split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean);
    }
    if (!Array.isArray(body)) return [];
    return body
      .map(function (bloc) {
        return ((bloc && bloc.children) || [])
          .map(function (enfant) { return enfant.text; })
          .join("")
          .trim();
      })
      .filter(Boolean);
  }

  /* Un crédit : « Architecture : Christophe Piguet, Manuel Borruat ».
     L'intitulé tient en un ou deux mots et ne contient aucune
     ponctuation de phrase — sans quoi une vraie phrase à deux temps
     se retrouverait déguisée en crédit. */
  var CREDIT = /^([^:.,;!?]{2,24})\s*:\s*(.+)$/;

  function estUnCredit(texte) {
    var trouve = CREDIT.exec(texte);
    return Boolean(trouve) && trouve[1].trim().split(/\s+/).length <= 2;
  }

  function caseCredit(texte) {
    var trouve = CREDIT.exec(texte);
    return (
      '<div class="m-cell m-histoire__credit ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(trouve[1].trim()) + "</p>" +
      '<p class="m-histoire__credit-valeur">' + R.escapeHtml(trouve[2].trim()) + "</p></div>"
    );
  }

  /* L'année : le repère chronologique, posé en très grand. C'est lui
     qu'on suit en parcourant la page du regard. */
  function caseAnnee(annee, label) {
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
  function caseAge(premiereEtape) {
    var annee = String(premiereEtape.year || "").match(/\d{4}/);
    var ans = annee ? new Date().getFullYear() - Number(annee[0]) : 0;
    if (ans < 1) return caseAnnee(premiereEtape.year, "Depuis");
    return caseAnnee(ans + (ans > 1 ? " ans" : " an"), "Depuis " + annee[0]);
  }

  /* Le visuel n'existe que si l'étape en a un : jamais de case vide
     dans le tableau. */
  function caseVisuel(entree) {
    var src = R.sanityImageUrl(entree.image, 1200);
    if (!src) return "";
    return (
      '<div class="m-cell m-histoire__visuel"><img src="' + R.escapeHtml(src) + '" alt="' +
      R.altDeLImage(entree.image, entree.title) + '" loading="lazy"></div>'
    );
  }

  /* Une étape : sa tête (l'année et le titre), son récit, ses
     crédits. Une bande sans contenu disparaît — une étape qui n'a
     qu'un titre reste une étape, pas un trou dans le tableau. */
  function etapeHTML(entree) {
    var blocs = paragraphes(entree.body);
    var recit = blocs.filter(function (p) { return !estUnCredit(p); });
    var credits = blocs.filter(estUnCredit);

    var caseTitre = entree.title
      ? '<div class="m-cell m-histoire__titre ' + C.classe() + '">' +
        R.escapeHtml(entree.title) + "</div>"
      : "";

    var caseRecit = recit.length
      ? '<div class="m-cell m-histoire__texte ' + C.classe() + '">' +
        recit.map(function (p) { return "<p>" + R.escapeHtml(p) + "</p>"; }).join("") +
        "</div>"
      : "";

    return (
      bande("m-bande--tete", [caseAnnee(entree.year), caseTitre]) +
      bande("m-bande--recit", [caseRecit, caseVisuel(entree)]) +
      bande("m-bande--credits", credits.map(caseCredit))
    );
  }

  /* Cette page n'est plus dans le menu : on y entre par une case de
     la page Infos. Elle se termine donc par le chemin du
     retour — sans lui, on ne saurait plus d'où l'on vient. */
  function retourHTML() {
    return bande(
      "m-bande--retour",
      '<a href="' + root + 'contact/" class="m-cell m-action ' + C.classe() + '">' +
        "<span>← Infos</span></a>"
    );
  }

  function cadre(contenu) {
    return '<article class="mondrian mondrian--histoire">' + contenu + retourHTML() + "</article>";
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
       Vide, il n'y a simplement pas de paragraphe — et l'âge du
       cinéma prend alors toute la largeur en ouverture, plutôt que
       de laisser un trait noir courir à sa droite. */
    var intro = (page && page.intro) || "";
    var caseIntro = intro
      ? '<div class="m-cell m-histoire__intro ' + C.classe() + '">' + R.escapeHtml(intro) + "</div>"
      : "";

    if (!entrees.length) {
      app.innerHTML = caseIntro ? cadre(bande("m-bande--ouverture", [caseIntro])) : "";
      return;
    }

    var ouverture = bande(
      "m-bande--ouverture" + (caseIntro ? "" : " m-bande--ouverture-seule"),
      [caseAge(entrees[0]), caseIntro]
    );

    app.innerHTML = cadre(ouverture + entrees.map(etapeHTML).join(""));
  });
})();
