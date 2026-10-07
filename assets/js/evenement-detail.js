/* ============================================================
   Zinéma — un événement en détail, à l'adresse
   evenements/?e=<adresse de l'événement>.

   Sur la page Événements, chaque événement n'est plus montré que
   par son affiche : quatre cases par événement (visuel, titre,
   date, texte) se lisaient comme un seul bloc avec les films
   annoncés juste en dessous. Un clic sur l'affiche mène ici, où
   l'événement retrouve toutes ses informations :

     ┌──────────┬───────────────────────────────────┐
     │ VISUEL   │ LE TITRE DE L'ÉVÉNEMENT           │
     ├──────────┴──────────┬────────────┬───────────┤
     │ ÉVÉNEMENT · DATE    │ Le texte…  │ EN SAVOIR │
     ├─────────────────────┴────────────┴───────────┤
     │ Les films reliés, puis le texte complet       │
     └───────────────────────────────────────────────┘

   Le type et la période s'écrivent ici une seule fois : la liste
   des affiches s'en sert aussi, pour le libellé lu à voix haute.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;

  /* Le type d'un événement : le nom choisi dans le Studio (fiches
     « Type d'événement », que le cinéma nomme lui-même) ; sinon,
     pour les événements saisis avant, l'ancien type de la liste
     fermée ; sinon rien. Même règle que sanity/typesEvenement.ts. */
  var anciensTypes = {
    cycle: "Cycle",
    "cine-club": "Ciné-club",
    brunch: "Brunch",
    "seance-speciale": "Séance spéciale",
    festival: "Festival",
    info: "Information",
  };

  function texte(valeur) {
    return typeof valeur === "string" ? valeur.trim() : "";
  }

  /* Du texte brut, venu du Studio : à échapper avant de l'écrire. */
  function categorie(a) {
    var nom = texte(a.typeNom);
    if (nom) return nom;
    var ancien = texte(a.category);
    return Object.prototype.hasOwnProperty.call(anciensTypes, ancien) ? anciensTypes[ancien] : "";
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

  /* La case date & catégorie. Sans type, la date reste seule. */
  function quandHTML(a) {
    var type = categorie(a);
    return (
      '<div class="m-cell m-annonce__quand m-cell--ligne ' + C.classe() + '">' +
      (type ? '<p class="m-cell__label">' + R.escapeHtml(type) + "</p>" : "") +
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

  /* Le « Texte complet » du Studio, paragraphe par paragraphe. On
     n'en garde que les mots : le tableau a sa propre typographie. */
  function corpsHTML(a) {
    if (!Array.isArray(a.body)) return "";
    var paragraphes = a.body
      .map(function (bloc) {
        return ((bloc && bloc.children) || [])
          .map(function (enfant) { return (enfant && enfant.text) || ""; })
          .join("")
          .trim();
      })
      .filter(Boolean)
      .map(function (p) { return "<p>" + R.escapeHtml(p) + "</p>"; })
      .join("");
    if (!paragraphes) return "";
    return '<div class="m-cell m-annonce__corps ' + C.classe() + '">' + paragraphes + "</div>";
  }

  /* Le retour à toutes les affiches, à côté du chemin des séances. */
  function actionsHTML() {
    var racine = document.body.dataset.root || "";
    return bande(
      "m-bande--actions",
      '<a href="' + racine + 'evenements/" class="m-cell m-action m-lien-retour ' + C.classe() + '">' +
        "<span>Tous les événements</span></a>" + R.caseVoirLesSeances()
    );
  }

  /* L'événement en entier : le visuel en grand et son titre, la
     bande d'informations, les films reliés, le texte complet. Sans
     visuel, le titre occupe seul la première bande. */
  function html(a) {
    var src = R.sanityImageUrl(a.image, 1200);
    var visuelHTML = src
      ? '<div class="m-affiche m-annonce__visuel"><div class="poster">' +
        '<img src="' + R.escapeHtml(src) + '" alt="' +
        R.altDeLImage(a.image, a.title) + '" loading="eager"></div></div>'
      : "";

    var titreHTML =
      '<div class="m-cell m-annonce__une-titre ' + C.classe() + '">' +
      "<h1>" + R.escapeHtml(a.title) + "</h1></div>";

    var films = filmsHTML(a);
    var corps = corpsHTML(a);
    return (
      '<article class="mondrian mondrian--evenements">' +
      bande("m-bande--une", visuelHTML + titreHTML) +
      bande("m-bande--une-infos", quandHTML(a) + texteHTML(a) + lienHTML(a)) +
      (films ? bande("m-bande--une-films", films) : "") +
      (corps ? bande("m-bande--corps", corps) : "") +
      actionsHTML() +
      "</article>"
    );
  }

  /* Une adresse qui ne mène à rien : un événement terminé (il quitte
     le site de lui-même), ou une adresse mal recopiée. */
  function introuvable() {
    return (
      '<article class="mondrian mondrian--evenements">' +
      bande(
        "m-bande--introuvable",
        '<div class="m-cell m-introuvable ' + C.classe() + '"><p class="m-cell__label">Événement introuvable</p>' +
          '<p class="m-cell__value">Cet événement est terminé ou n\'existe pas.</p></div>'
      ) +
      actionsHTML() +
      "</article>"
    );
  }

  global.ZinemaEvenementDetail = {
    html: html,
    introuvable: introuvable,
    categorie: categorie,
    periode: periode,
  };
})(window);
