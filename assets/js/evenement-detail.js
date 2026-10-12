/* ============================================================
   Zinéma — un événement : le flyer à gauche, toutes les
   informations à droite. Deux cases, pas plus, sans rien à
   cliquer (demandes du cinéma, 12 octobre 2026).

     ┌──────────┬───────────────────────────────────┐
     │          │ TYPE · DATE                       │
     │ FLYER    │ LE TITRE DE L'ÉVÉNEMENT           │
     │          │ Le texte complet, mis en forme…   │
     │          │ LIEN EXTERNE · FILMS RELIÉS       │
     └──────────┴───────────────────────────────────┘

   La même rangée sert sur la page Événements (une par événement,
   voir evenements.js) et à l'adresse evenements/?e=… d'un
   événement seul. Sans visuel, la case de texte occupe seule toute
   la largeur.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;
  var TexteRiche = global.ZinemaTexteRiche;

  /* Le type d'un événement : celui que le cinéma écrit dans le
     Studio (champ « Type d'événement ») ; sinon,
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

  /* Le texte complet s'il existe — il reprend et détaille le
     résumé ; sinon le résumé. */
  function texteHTML(a) {
    var complet = TexteRiche.html(a.body);
    if (complet) return complet;
    return a.excerpt ? '<p class="m-annonce__resume">' + R.escapeHtml(a.excerpt) + "</p>" : "";
  }

  /* Le lien externe de l'événement, puis les films reliés dans le
     Studio, chacun vers sa page. */
  function liensHTML(a) {
    var racine = document.body.dataset.root || "";
    var liens = "";
    if (a.linkUrl) {
      liens +=
        '<a href="' + R.escapeHtml(a.linkUrl) + '" target="_blank" rel="noopener noreferrer">' +
        R.escapeHtml(a.linkLabel || "En savoir plus") + "</a>";
    }
    (a.films || []).forEach(function (f) {
      if (!f || !f.slug || !f.title) return;
      liens +=
        '<a href="' + racine + "film/?s=" + encodeURIComponent(f.slug) + '">' +
        R.escapeHtml(f.title) + "</a>";
    });
    return liens ? '<p class="m-annonce__liens">' + liens + "</p>" : "";
  }

  /* La case de droite : tout ce qu'il faut savoir, d'un seul tenant.
     Sans type, la date reste seule. Le titre est un h1 sur la page
     de l'événement, un h2 dans la liste. */
  function infosHTML(a, balise) {
    var quand = [categorie(a), periode(a)].filter(Boolean).join(" · ");
    return (
      '<div class="m-cell m-annonce__infos ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(quand) + "</p>" +
      "<" + balise + ">" + R.escapeHtml(a.title) + "</" + balise + ">" +
      texteHTML(a) + liensHTML(a) + "</div>"
    );
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

  /* Le flyer, à gauche. Sa case et celle du texte ont toujours la
     même hauteur (demande du cinéma, 12 octobre 2026) : si le texte
     est plus haut que le flyer, celui-ci s'agrandit pour la remplir
     (voir .m-annonce__visuel dans evenements-mondrian.css). */
  function visuelHTML(a, chargement) {
    var src = R.sanityImageUrl(a.image, 1200);
    if (!src) return "";
    return (
      '<div class="m-cell m-annonce__visuel"><img src="' + R.escapeHtml(src) + '" alt="' +
      R.altDeLImage(a.image, a.title) + '" loading="' + chargement + '" decoding="async"></div>'
    );
  }

  /** Deux cases : le flyer à gauche, toutes les informations à
      droite. Sans visuel, la case de texte occupe toute la largeur.
      La page Événements en pose une par événement (evenements.js). */
  function bandeHTML(a, index) {
    var dansLaListe = typeof index === "number";
    var chargement = dansLaListe && index > 0 ? "lazy" : "eager";
    return bande(
      "m-bande--une",
      visuelHTML(a, chargement) + infosHTML(a, dansLaListe ? "h2" : "h1")
    );
  }

  /* L'événement seul, à son adresse. */
  function html(a) {
    return (
      '<article class="mondrian mondrian--evenements">' +
      bandeHTML(a) +
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
    bandeHTML: bandeHTML,
  };
})(window);
