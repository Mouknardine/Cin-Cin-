/* ============================================================
   Zinéma — Membership : les tarifs et les formules d'abonnement,
   en tableau « Mondrian » (mêmes bandes que la fiche film).
   La page s'ouvre directement sur les tarifs, sans bandeau de
   titre — comme toutes les pages du site.

   Les deux prix du cinéma viennent de ZinemaData.tarifs : ils
   sont écrits à un seul endroit et repris partout (bouton
   d'achat, fiche film, ici).

   Les formules d'abonnement ci-dessous sont à confirmer avec le
   cinéma : ce sont les seules valeurs de cette page qui ne
   proviennent pas encore de Sanity.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("membership-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;
  var tarifs = window.ZinemaData.tarifs;

  var formules = [
    {
      titre: "Carte 10 entrées",
      prix: "prix libre, 90.- à 140.-",
      texte:
        "Dix places, valables un an, transmissibles. Vous choisissez ce que vous payez : un cinéma de quartier doit rester accessible à tout le quartier.",
    },
    {
      titre: "Membre de soutien",
      prix: "dès 50.- par an",
      texte:
        "Vous soutenez la programmation indépendante et recevez le programme avant tout le monde, avec une invitation aux avant-premières.",
    },
    {
      titre: "Écoles & associations",
      prix: "sur demande",
      texte:
        "Projections scolaires, séances privées, partenariats de quartier : écrivez-nous, on construit la séance avec vous.",
    },
  ];

  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  function caseTarif(label, prix, precision) {
    return (
      '<div class="m-cell m-info ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" +
      '<p class="m-tarif__prix">' + R.escapeHtml(prix) + "</p>" +
      (precision ? '<p class="m-tarif__precision">' + R.escapeHtml(precision) + "</p>" : "") +
      "</div>"
    );
  }

  function caseFormule(formule) {
    return (
      '<div class="m-cell m-formule ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(formule.titre) + "</p>" +
      '<p class="m-tarif__prix">' + R.escapeHtml(formule.prix) + "</p>" +
      '<p class="m-formule__texte">' + R.escapeHtml(formule.texte) + "</p></div>"
    );
  }

  window.ZinemaData.getSiteSettings().then(function (settings) {
    var contact = settings.email
      ? '<a class="m-cell m-action m-acheter" href="mailto:' + R.escapeHtml(settings.email) +
        '?subject=' + encodeURIComponent("Abonnement Zinéma") + '">' +
        "<span>Acheter un abonnement</span>" +
        '<span class="m-acheter__prix">' + R.escapeHtml(settings.email) + "</span></a>"
      : '<div class="m-cell m-action m-acheter m-acheter--indisponible"><span>Abonnements bientôt disponibles</span></div>';

    app.innerHTML =
      '<article class="mondrian">' +
      bande(
        "m-bande--infos",
        caseTarif("Plein tarif", tarifs.plein, "Une séance, tous les jours") +
          caseTarif("Tarif réduit", tarifs.reduit, tarifs.conditionsReduit)
      ) +
      bande("m-bande--formules", formules.map(caseFormule).join("")) +
      bande(
        "m-bande--achat",
        '<a href="' + root + 'agenda/" class="m-cell m-action m-lien-retour ' + C.classe() + '"><span>← Voir les séances</span></a>' +
          contact
      ) +
      "</article>";
  });
})();
