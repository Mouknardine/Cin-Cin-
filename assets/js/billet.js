/* ============================================================
   Zinéma — la page du billet, où SumUp renvoie le client après
   paiement, et qu'on peut rouvrir à tout moment pour retrouver
   son billet (l'adresse contient sa référence).

   Cette page n'annonce JAMAIS un paiement réussi d'elle-même :
   elle demande au serveur, qui redemande à SumUp. Ouvrir cette
   adresse à la main ne fabrique donc pas de billet.

   Un paiement par carte n'est pas toujours conclu à la seconde où
   le client revient : si le statut est encore « en attente », la
   page redemande quelques fois, à intervalle croissant, plutôt que
   d'annoncer un échec à tort.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("billet-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;

  /* Nouvelles tentatives : 2s, 3s, 5s, 8s, 13s. Au-delà, on laisse
     la main au visiteur plutôt que de le faire attendre. */
  var ATTENTES = [2000, 3000, 5000, 8000, 13000];
  var tentative = 0;

  var reference = (new URLSearchParams(window.location.search).get("ref") || "").toUpperCase();

  function bande(classe, contenu) {
    return '<div class="m-bande ' + classe + '">' + contenu + "</div>";
  }

  function caseTexte(label, valeur, classes) {
    return (
      '<div class="m-cell ' + (classes || "") + " " + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" +
      '<p class="m-cell__value">' + R.escapeHtml(valeur) + "</p></div>"
    );
  }

  function retourHTML() {
    var root = document.body.dataset.root || "";
    return bande(
      "m-bande--actions",
      '<a class="m-cell m-action m-lien-retour ' + C.classe() + '" href="' + root +
        'agenda/"><span>← L\'agenda du cinéma</span></a>'
    );
  }

  function messageHTML(label, texte) {
    app.innerHTML =
      '<article class="mondrian mondrian--billet">' +
      bande("m-bande--message", caseTexte(label, texte, "m-billet__message")) +
      retourHTML() +
      "</article>";
  }

  /* ---------------- Le billet ---------------- */

  function detailBillets(billet) {
    var morceaux = [];
    if (billet.plein > 0) morceaux.push(billet.plein + " plein tarif");
    if (billet.reduit > 0) morceaux.push(billet.reduit + " tarif réduit");
    return morceaux.join(" · ");
  }

  function billetHTML(billet) {
    return (
      '<article class="mondrian mondrian--billet">' +
      bande(
        "m-bande--reference",
        '<div class="m-cell m-billet__reference ' + C.classe() + '">' +
          '<p class="m-cell__label">Votre billet — à présenter à l\'entrée</p>' +
          '<p class="m-billet__code">' + R.escapeHtml(billet.reference) + "</p></div>"
      ) +
      bande(
        "m-bande--seance",
        '<div class="m-cell m-billet__film ' + C.classe() + '">' +
          '<p class="m-cell__label">Film</p>' +
          '<p class="m-billet__titre">' + R.escapeHtml(billet.film) + "</p></div>"
      ) +
      bande(
        "m-bande--infos",
        caseTexte("Séance", R.formatDayHeading(billet.date) + " à " + billet.heure, "m-info m-cell--ligne") +
          caseTexte("Salle", billet.salle || "—", "m-info m-cell--ligne") +
          caseTexte("Billets", detailBillets(billet), "m-info m-cell--ligne") +
          caseTexte("Payé", billet.montant.toFixed(2).replace(/\.00$/, ".-"), "m-info m-cell--ligne")
      ) +
      /* On n'annonce QUE ce que le site fait réellement. La phrase
         précédente promettait un exemplaire par e-mail alors que rien
         ne l'envoie : un client qui fermait la page se retrouvait sans
         billet et sans le savoir, en croyant l'avoir reçu. */
      bande(
        "m-bande--rappel",
        '<p class="m-cell m-billet__rappel ' + C.classe() + '">' +
          "Notez la référence ou gardez cette page ouverte : elle seule " +
          "suffit à entrer. Vous pouvez aussi ajouter cette adresse à vos " +
          "favoris pour la retrouver." +
          "</p>"
      ) +
      retourHTML() +
      "</article>"
    );
  }

  /* ---------------- Interrogation du serveur ---------------- */

  function afficher(reponse) {
    if (reponse.statut === "payee") {
      app.innerHTML = billetHTML(reponse.billet);
      return;
    }

    if (reponse.statut === "en-attente") {
      if (tentative < ATTENTES.length) {
        messageHTML("Paiement en cours", "Nous vérifions votre paiement auprès de SumUp…");
        window.setTimeout(interroger, ATTENTES[tentative]);
        tentative++;
        return;
      }
      messageHTML(
        "Paiement en attente",
        "Votre paiement n'est pas encore confirmé. Rechargez cette page dans une minute — " +
          "et si rien ne change, écrivez au cinéma en indiquant la référence " + reference + "."
      );
      return;
    }

    messageHTML(
      reponse.statut === "expiree" ? "Paiement expiré" : "Paiement non abouti",
      "Aucun montant n'a été débité. Vous pouvez reprendre votre achat depuis l'agenda."
    );
  }

  function interroger() {
    window.ZinemaBilletterie.lireBillet(reference)
      .then(afficher)
      .catch(function (erreur) {
        messageHTML("Billet indisponible", erreur.message);
      });
  }

  if (!/^ZIN-[A-Z2-9]{6}$/.test(reference)) {
    messageHTML(
      "Billet introuvable",
      "Cette adresse ne correspond à aucun billet. Vérifiez le lien reçu par e-mail."
    );
    return;
  }

  messageHTML("Un instant", "Nous récupérons votre billet…");
  interroger();
})();
