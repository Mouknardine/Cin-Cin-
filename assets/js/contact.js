/* ============================================================
   Zinéma — page Infos (adresse /contact/), en tableau « Mondrian »
   comme le reste
   du site : des cases blanches séparées par des traits noirs,
   dont la largeur suit la longueur du texte, et dont la couleur
   est tirée au hasard à chaque affichage.

   L'adresse ouvre la page, la carte à côté ; viennent ensuite les
   horaires, les coordonnées, l'accès et les réseaux — une
   information par case. Tout vient de Sanity : une case qui n'a
   rien à dire n'est pas affichée, jamais de case vide.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("contact-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;

  /* Une bande vide laisserait un trait noir en travers du tableau :
     on ne l'écrit que si elle a au moins une case. */
  function bande(classe, cases) {
    var contenu = cases.filter(Boolean).join("");
    return contenu ? '<div class="m-bande ' + classe + '">' + contenu + "</div>" : "";
  }

  /* Une case d'information : un intitulé, une valeur — le même
     gabarit que les repères de la fiche film. Sur mobile, les deux
     tiennent sur une seule ligne (voir .m-cell--ligne). */
  function caseInfo(label, valeur) {
    if (!valeur) return "";
    return (
      '<div class="m-cell m-info m-cell--ligne ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" +
      '<p class="m-cell__value">' + R.escapeHtml(valeur) + "</p></div>"
    );
  }

  /* La même case, mais cliquable : téléphone, e-mail. */
  function caseLien(label, valeur, href) {
    if (!valeur) return "";
    return (
      '<a class="m-cell m-info m-cell--ligne ' + C.classe() + '" href="' + R.escapeHtml(href) + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" +
      '<p class="m-cell__value">' + R.escapeHtml(valeur) + "</p></a>"
    );
  }

  /* Une case-lien qui reste sur le site : elle mène vers une autre
     page du Zinéma, pas vers l'extérieur — ni cible ni « rel ». */
  function caseInterne(label, libelle, href) {
    return (
      '<a class="m-cell m-contact__page ' + C.classe() + '" href="' + R.escapeHtml(href) + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" +
      '<p class="m-contact__page-titre">' + R.escapeHtml(libelle) + "</p></a>"
    );
  }

  /* Une case-lien qui sort du site. */
  function caseAction(libelle, href) {
    return (
      '<a class="m-cell m-action ' + C.classe() + '" href="' +
      R.escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' +
      "<span>" + R.escapeHtml(libelle) + "</span></a>"
    );
  }

  /* Le texte d'accès arrive de Sanity en blocs de texte riche. */
  function texteAcces(access) {
    if (typeof access === "string") return access;
    if (!Array.isArray(access)) return "";
    return access
      .map(function (bloc) {
        return ((bloc && bloc.children) || [])
          .map(function (enfant) { return enfant.text; })
          .join("");
      })
      .filter(Boolean)
      .join("\n");
  }

  function numeroVersLien(numero) {
    return "tel:" + String(numero).replace(/\s/g, "");
  }

  /* L'adresse est écrite comme sur une enveloppe : la rue, puis le
     code postal et la ville sur la ligne suivante. Dans Sanity, on
     peut passer à la ligne soit avec un vrai retour à la ligne,
     soit avec une virgule — les deux marchent. Le numéro de rue
     est rattaché au nom de la rue par une espace insécable : écrit
     en très gros, il ne se retrouve jamais seul en début de ligne. */
  function adresseEnLignes(adresse) {
    return adresse
      .split(/\s*\n\s*|,\s*/)
      .filter(Boolean)
      .map(function (ligne) {
        return ligne.replace(/\s+(\d+[a-z]?)$/i, " $1");
      })
      .join("\n");
  }

  var D = window.ZinemaData;

  app.innerHTML = R.etatChargement("des infos pratiques");

  Promise.all([D.getReglages(), D.getPage("contact")]).then(function (r) {
    var reglages = r[0];
    var page = r[1];

    if (D.estUneErreur(reglages)) {
      app.innerHTML = R.etatErreur();
      return;
    }
    /* Aucun réglage renseigné : rien à afficher. */
    if (!reglages) {
      app.innerHTML = "";
      return;
    }

    var adresse = reglages.address || "";

    /* La carte est construite à partir de l'adresse renseignée dans
       Sanity (cet embed en lecture seule ne demande aucune clé API) :
       elle suit l'adresse toute seule, sans champ à maintenir en
       double. « Lien carte » dans Sanity reste disponible pour
       pointer vers une fiche Google Maps précise (avis, photos…). */
    var requeteCarte = encodeURIComponent(adresse.replace(/\s*\n\s*/g, ", "));
    var lienCarte = reglages.mapUrl || "https://www.google.com/maps/search/?api=1&query=" + requeteCarte;
    var sourceCarte = "https://www.google.com/maps?q=" + requeteCarte + "&output=embed";

    var caseAdresse = !adresse ? "" :
      '<div class="m-cell m-contact__adresse ' + C.classe() + '">' +
      '<p class="m-cell__label">Adresse</p>' +
      '<p class="m-contact__adresse-valeur">' + R.escapeHtml(adresseEnLignes(adresse)) + "</p></div>";

    var caseCarte = !adresse ? "" :
      '<div class="m-contact__carte"><iframe src="' + R.escapeHtml(sourceCarte) +
      '" title="Le Zinéma sur Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>';

    /* Pas de texte d'accès dans Sanity : pas de case Accès. */
    var acces = texteAcces(reglages.accessInfo);
    var caseAcces = acces
      ? '<div class="m-cell m-contact__acces ' + C.classe() + '">' +
        '<p class="m-cell__label">Accès</p>' +
        '<p class="m-contact__acces-texte">' + R.escapeHtml(acces) + "</p></div>"
      : "";

    var caseIntro =
      page && page.intro
        ? '<div class="m-cell m-intro ' + C.classe() + '">' +
          R.escapeHtml(page.intro) + "</div>"
        : "";

    app.innerHTML =
      '<article class="mondrian mondrian--contact">' +
      bande("m-bande--intro", [caseIntro]) +
      bande("m-bande--adresse", [caseAdresse]) +
      bande("m-bande--carte", [caseCarte]) +
      /* Le lien vers Google Maps suit immédiatement la carte : c'est
         en la regardant qu'on a envie de l'ouvrir en grand, pas trois
         bandes plus bas une fois les horaires lus. */
      bande("m-bande--actions", adresse ? [caseAction("Voir sur Google Maps", lienCarte)] : []) +
      bande(
        "m-bande--horaires",
        (reglages.openingHours || []).map(function (horaire) {
          return caseInfo(horaire.label, horaire.value);
        })
      ) +
      bande("m-bande--coordonnees", [
        caseLien("Cinéma", reglages.phone, numeroVersLien(reglages.phone || "")),
        caseLien("Bureau", reglages.phoneSecondary, numeroVersLien(reglages.phoneSecondary || "")),
        caseLien("E-mail", reglages.email, "mailto:" + (reglages.email || "")),
      ]) +
      /* Les réseaux sociaux, « nous écrire » et le retour vers
         l'agenda ne sont pas repris ici : le pied de page les porte
         déjà, sur toutes les pages du site, et il s'affiche juste
         en dessous. Les répéter allongeait la page d'un écran
         entier sur mobile, avec Instagram et Facebook deux fois. */
      bande("m-bande--acces", [caseAcces]) +
      /* L'Histoire du cinéma a quitté le menu : elle se lit une
         fois, quand la Location se demande. On y entre par cette
         case, à la fin des infos pratiques — à l'endroit où l'on a
         fini de chercher un renseignement et où l'on a le temps de
         lire. */
      bande("m-bande--pages", [
        caseInterne("À lire", "L'histoire du Zinéma", root + "histoire/"),
      ]) +
      "</article>";
  });
})();
