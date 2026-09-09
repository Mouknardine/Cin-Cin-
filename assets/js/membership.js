/* ============================================================
   Zinéma — page Abonnements : les tarifs et les formules, en
   tableau « Mondrian » (mêmes bandes que la fiche film).

   Tout le contenu de cette page vient de Sanity : les deux tarifs
   des « Réglages du cinéma », les formules et les coordonnées
   bancaires de « Pages du site → Page Abonnements ». Plus aucun
   prix ni aucune formule n'est écrit dans ce fichier.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("membership-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;
  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  function caseTarif(label, prix) {
    return (
      '<div class="m-cell m-info m-tarif ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" +
      '<p class="m-tarif__prix">' + R.escapeHtml(prix) + "</p></div>"
    );
  }

  /* Les conditions du tarif réduit forment leur propre rangée : une
     case par condition, chacune de la largeur de son texte. Glissées
     dans la case du prix, elles la faisaient grandir jusqu'à étirer
     celle du plein tarif à côté — une case vide haute comme un
     écran, pour dire un seul prix. */
  function bandeConditions(conditions) {
    if (!conditions.length) return "";
    return bande(
      "m-bande--conditions",
      '<div class="m-cell m-tarif__pour ' + C.classe() + '">' +
        '<p class="m-cell__label">Tarif réduit pour</p></div>' +
        conditions
          .map(function (condition) {
            return (
              '<div class="m-cell m-tarif__condition ' + C.classe() + '">' +
              R.escapeHtml(condition) + "</div>"
            );
          })
          .join("")
    );
  }

  function caseFormule(formule) {
    var avantages = (formule.avantages || []).filter(Boolean);
    return (
      '<div class="m-cell m-formule ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(formule.titre) + "</p>" +
      '<p class="m-tarif__prix">' + R.escapeHtml(formule.prix) + "</p>" +
      (formule.texte
        ? '<p class="m-formule__texte">' + R.escapeHtml(formule.texte) + "</p>"
        : "") +
      (avantages.length
        ? '<ul class="m-formule__avantages">' +
          avantages
            .map(function (a) {
              return "<li>" + R.escapeHtml(a) + "</li>";
            })
            .join("") +
          "</ul>"
        : "") +
      "</div>"
    );
  }

  /* Les coordonnées bancaires, s'il y en a. */
  function caseBanque(abo) {
    var lignes = [
      abo.beneficiaire,
      abo.iban ? "IBAN " + abo.iban : "",
      abo.ccp ? "CCP " + abo.ccp : "",
      abo.banque,
    ].filter(Boolean);
    if (!lignes.length) return "";
    return (
      '<div class="m-cell m-info ' + C.classe() + '">' +
      '<p class="m-cell__label">Paiement</p>' +
      lignes
        .map(function (l) {
          return '<p class="m-cell__value m-banque__ligne">' + R.escapeHtml(l) + "</p>";
        })
        .join("") +
      (abo.notePaiement
        ? '<p class="m-tarif__precision">' + R.escapeHtml(abo.notePaiement) + "</p>"
        : "") +
      "</div>"
    );
  }

  var D = window.ZinemaData;

  app.innerHTML = R.etatChargement("des abonnements");

  Promise.all([D.getReglages(), D.getAbonnements(), D.getPage("membership")]).then(function (r) {
    var reglages = r[0];
    var abo = r[1];
    var page = r[2];

    if (D.estUneErreur(reglages) || D.estUneErreur(abo)) {
      app.innerHTML = R.etatErreur();
      return;
    }
    reglages = reglages || {};
    abo = abo || {};

    var plein = R.montant(reglages.tarifPlein);
    var reduit = R.montant(reglages.tarifReduit);
    var conditions = (reglages.conditionsReduit || []).filter(Boolean);

    var bandeTarifs =
      plein || reduit
        ? bande(
            "m-bande--infos",
            (plein ? caseTarif("Plein tarif", plein) : "") +
              (reduit ? caseTarif("Tarif réduit", reduit) : "")
          ) + (reduit ? bandeConditions(conditions) : "")
        : "";

    var formules = (abo.formules || []).filter(function (f) {
      return f && f.titre;
    });
    var bandeFormules = formules.length
      ? bande("m-bande--formules", formules.map(caseFormule).join(""))
      : "";

    var banque = caseBanque(abo);
    var bandeBanque = banque ? bande("m-bande--banque", banque) : "";

    var intro = page && page.intro
      ? bande(
          "m-bande--intro",
          '<div class="m-cell m-intro ' + C.classe() + '">' + R.escapeHtml(page.intro) + "</div>"
        )
      : "";

    /* Ni tarifs, ni formules, ni coordonnées bancaires : rien à dire. */
    if (!bandeTarifs && !bandeFormules && !bandeBanque) {
      app.innerHTML = "";
      return;
    }

    var contact = reglages.email
      ? '<a class="m-cell m-action m-acheter" href="mailto:' + R.escapeHtml(reglages.email) +
        '?subject=' + encodeURIComponent("Abonnement Zinéma") + '">' +
        "<span>Acheter un abonnement</span>" +
        '<span class="m-acheter__prix">' + R.escapeHtml(reglages.email) + "</span></a>"
      : "";

    app.innerHTML =
      '<article class="mondrian">' +
      intro +
      bandeTarifs +
      bandeFormules +
      bandeBanque +
      bande(
        "m-bande--achat",
        '<a href="' + root + 'agenda/" class="m-cell m-action m-lien-retour ' + C.classe() +
          '"><span>Voir les séances</span></a>' + contact
      ) +
      "</article>";
  });
})();
