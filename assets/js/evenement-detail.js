/* ============================================================
   Zinéma — un événement en détail, à l'adresse
   evenements/?e=<adresse de l'événement>.

   Deux cases, pas plus (demande du cinéma, 12 octobre 2026 : les
   cinq cases d'avant « faisaient beaucoup ») :

     ┌──────────┬───────────────────────────────────┐
     │          │ TYPE · DATE                       │
     │ FLYER    │ LE TITRE DE L'ÉVÉNEMENT           │
     │          │ Le texte complet, mis en forme…   │
     │          │ LIEN EXTERNE · FILMS RELIÉS       │
     └──────────┴───────────────────────────────────┘

   Sans visuel, la case de texte occupe seule toute la largeur.
   Le type, la période, le texte et les liens s'écrivent ici une
   seule fois : les rangées de la page Événements
   (evenement-rangee.js) s'en servent aussi.
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
     Sans type, la date reste seule. */
  function infosHTML(a) {
    var quand = [categorie(a), periode(a)].filter(Boolean).join(" · ");
    return (
      '<div class="m-cell m-annonce__infos ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(quand) + "</p>" +
      "<h1>" + R.escapeHtml(a.title) + "</h1>" +
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

  /* L'événement en entier : le flyer à gauche, ENTIER, jamais
     recadré ; tout le reste à droite. */
  function html(a) {
    var src = R.sanityImageUrl(a.image, 1200);
    var visuelHTML = src
      ? '<div class="m-affiche m-annonce__visuel"><div class="poster">' +
        '<img src="' + R.escapeHtml(src) + '" alt="' +
        R.altDeLImage(a.image, a.title) + '" loading="eager"></div></div>'
      : "";
    return (
      '<article class="mondrian mondrian--evenements">' +
      bande("m-bande--une", visuelHTML + infosHTML(a)) +
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
    texteHTML: texteHTML,
    liensHTML: liensHTML,
  };
})(window);
