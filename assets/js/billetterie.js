/* ============================================================
   Zinéma — le dialogue entre le site et la caisse.

   Ce fichier ne connaît AUCUN secret : il ne fait que poser deux
   questions au serveur du cinéma, qui lui parle seul à SumUp.

     creerPaiement()  → « je veux ces billets » → une adresse de
                        page de paiement, où l'on emmène le client
     lireBillet()     → « où en est cette commande ? » → le billet

   Si le serveur n'est pas joignable (site encore hébergé sans
   partie serveur, panne réseau), les fonctions échouent proprement
   avec un message lisible : la page ne casse jamais.
   ============================================================ */
(function (global) {
  "use strict";

  /* Les deux points d'entrée vivent à la racine du site, dans /api.
     Le chemin est calculé depuis data-root pour marcher aussi bien
     depuis /film/ que depuis /billet/. */
  function urlApi(fichier) {
    var root = (document.body && document.body.getAttribute("data-root")) || "";
    return root + "api/" + fichier;
  }

  var PANNE = "La billetterie est momentanément injoignable. Réessayez dans un instant.";

  function lireReponse(reponse) {
    return reponse
      .json()
      .catch(function () {
        /* Réponse illisible : serveur absent, page d'erreur HTML de
           l'hébergeur… On ne laisse jamais remonter un charabia. */
        throw new Error(PANNE);
      })
      .then(function (donnees) {
        if (!reponse.ok || !donnees || donnees.ok !== true) {
          throw new Error((donnees && donnees.message) || PANNE);
        }
        return donnees;
      });
  }

  function erreurReseau() {
    throw new Error(PANNE);
  }

  /* Demande la création d'un paiement.
     commande = { seance, plein, reduit, email } */
  function creerPaiement(commande) {
    return fetch(urlApi("creer-paiement.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commande),
    })
      .catch(erreurReseau)
      .then(lireReponse);
  }

  /* Demande l'état d'une commande à partir de sa référence. */
  function lireBillet(reference) {
    return fetch(urlApi("statut-paiement.php?ref=" + encodeURIComponent(reference)))
      .catch(erreurReseau)
      .then(lireReponse);
  }

  global.ZinemaBilletterie = {
    creerPaiement: creerPaiement,
    lireBillet: lireBillet,
  };
})(window);
