/* ============================================================
   Zinéma — le panneau d'achat d'un billet.

   Il s'ouvre par-dessus la fiche film quand on choisit un horaire :
   combien de billets, à quel tarif, à quelle adresse envoyer le
   billet. Puis il emmène le client sur la page de paiement de
   SumUp — c'est là, et seulement là, qu'une carte est saisie.

   Aucun prix n'est décidé ici : les tarifs affichés ne sont qu'un
   aperçu. Le montant réellement facturé est recalculé par le
   serveur (voir api/creer-paiement.php).

   Le panneau est un <dialog> : le navigateur gère seul la touche
   Échap, le clic à côté et le retour du curseur au bon endroit.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;
  var MAX_BILLETS = 10;

  var dialogue = null;
  var etat = { seance: null, plein: 1, reduit: 0, envoi: false };

  /* Les tarifs affichés dans le panneau viennent des « Réglages du
     cinéma » dans Sanity, chargés une fois à l'ouverture. Le serveur,
     lui, relit ces mêmes montants de son côté au moment du paiement :
     l'aperçu ci-dessous ne peut donc pas être trafiqué. */
  var reglages = { tarifPlein: 0, tarifReduit: 0 };
  global.ZinemaData.getReglages().then(function (r) {
    if (!global.ZinemaData.estUneErreur(r) && r) reglages = r;
  });

  function tarifs() {
    return {
      plein: R.montant(reglages.tarifPlein) || "",
      reduit: R.montant(reglages.tarifReduit) || "",
    };
  }

  function total() {
    return etat.plein * (reglages.tarifPlein || 0) +
      etat.reduit * (reglages.tarifReduit || 0);
  }

  function totalBillets() {
    return etat.plein + etat.reduit;
  }

  /* ---------------- Construction ---------------- */

  function compteurHTML(cle, label, prix) {
    return (
      '<div class="m-cell m-achat__compteur ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(label) + " · " + R.escapeHtml(prix) + "</p>" +
      '<div class="m-achat__reglage">' +
      '<button type="button" class="m-achat__pas" data-pas="-1" data-cle="' + cle +
      '" aria-label="Retirer un billet ' + R.escapeHtml(label) + '">−</button>' +
      '<output class="m-achat__nombre" data-nombre="' + cle + '">0</output>' +
      '<button type="button" class="m-achat__pas" data-pas="1" data-cle="' + cle +
      '" aria-label="Ajouter un billet ' + R.escapeHtml(label) + '">+</button>' +
      "</div></div>"
    );
  }

  function construire() {
    dialogue = document.createElement("dialog");
    dialogue.className = "m-achat";
    dialogue.innerHTML =
      '<form method="dialog" class="mondrian mondrian--achat" novalidate>' +
      '<div class="m-bande">' +
      '<div class="m-cell m-achat__seance ' + C.classe() + '">' +
      '<p class="m-cell__label">Votre séance</p>' +
      '<p class="m-achat__film"></p>' +
      '<p class="m-achat__quand"></p></div>' +
      "</div>" +
      '<div class="m-bande">' +
      compteurHTML("plein", "Plein tarif", tarifs().plein) +
      compteurHTML("reduit", "Tarif réduit", tarifs().reduit) +
      "</div>" +
      '<div class="m-bande">' +
      '<label class="m-cell m-achat__email ' + C.classe() + '">' +
      '<span class="m-cell__label">Votre e-mail — le billet y sera envoyé</span>' +
      '<input type="email" name="email" required autocomplete="email" ' +
      'inputmode="email" placeholder="prenom@exemple.ch"></label>' +
      "</div>" +
      '<p class="m-bande m-achat__erreur" role="alert" hidden></p>' +
      '<div class="m-bande">' +
      '<button type="button" class="m-cell m-action m-achat__annuler ' + C.classe() + '">' +
      "<span>← Annuler</span></button>" +
      '<button type="submit" class="m-cell m-action m-acheter m-achat__payer">' +
      "<span>Payer</span><span class=\"m-acheter__prix\"></span></button>" +
      "</div></form>";

    document.body.appendChild(dialogue);

    dialogue.addEventListener("click", surClic);
    dialogue.querySelector("form").addEventListener("submit", surEnvoi);
    /* Clic sur le fond noir, hors du panneau : on ferme. */
    dialogue.addEventListener("mousedown", function (e) {
      if (e.target === dialogue) dialogue.close();
    });
  }

  /* ---------------- Interactions ---------------- */

  function surClic(e) {
    var annuler = e.target.closest(".m-achat__annuler");
    if (annuler) {
      dialogue.close();
      return;
    }
    var pas = e.target.closest(".m-achat__pas");
    if (!pas) return;
    var cle = pas.getAttribute("data-cle");
    var delta = parseInt(pas.getAttribute("data-pas"), 10);
    var suivant = etat[cle] + delta;
    if (suivant < 0) return;
    if (delta > 0 && totalBillets() >= MAX_BILLETS) return;
    etat[cle] = suivant;
    rafraichir();
  }

  function messageErreur(texte) {
    var zone = dialogue.querySelector(".m-achat__erreur");
    zone.textContent = texte || "";
    zone.hidden = !texte;
  }

  function surEnvoi(e) {
    e.preventDefault();
    if (etat.envoi) return;

    var email = dialogue.querySelector('input[name="email"]').value.trim();
    if (totalBillets() < 1) {
      messageErreur("Choisissez au moins un billet.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      messageErreur("Merci d'indiquer une adresse e-mail valide : le billet y sera envoyé.");
      return;
    }

    etat.envoi = true;
    messageErreur("");
    rafraichir();

    global.ZinemaBilletterie.creerPaiement({
      seance: etat.seance._id,
      plein: etat.plein,
      reduit: etat.reduit,
      email: email,
    })
      .then(function (reponse) {
        /* Départ vers la page de paiement SumUp. On ne revient pas :
           inutile de remettre le panneau en état. */
        global.location.href = reponse.pagePaiement;
      })
      .catch(function (erreur) {
        etat.envoi = false;
        rafraichir();
        messageErreur(erreur.message);
      });
  }

  /* ---------------- Affichage ---------------- */

  function rafraichir() {
    dialogue.querySelector('[data-nombre="plein"]').textContent = etat.plein;
    dialogue.querySelector('[data-nombre="reduit"]').textContent = etat.reduit;

    var payer = dialogue.querySelector(".m-achat__payer");
    var nombre = totalBillets();
    payer.disabled = etat.envoi || nombre < 1;
    payer.querySelector("span").textContent = etat.envoi
      ? "Redirection…"
      : "Payer " + nombre + " billet" + (nombre > 1 ? "s" : "");
    payer.querySelector(".m-acheter__prix").textContent =
      nombre > 0 ? total().toFixed(2).replace(/\.00$/, ".-") : "";
  }

  /* ---------------- Ouverture ---------------- */

  function ouvrir(seance, film) {
    if (!dialogue) construire();

    etat = { seance: seance, plein: 1, reduit: 0, envoi: false };
    dialogue.querySelector(".m-achat__film").textContent = film.title;
    dialogue.querySelector(".m-achat__quand").textContent =
      R.formatDayHeading(seance.date) + " à " + seance.time +
      (seance.room ? " · " + seance.room : "");
    dialogue.querySelector('input[name="email"]').value = "";
    messageErreur("");
    rafraichir();
    dialogue.showModal();
  }

  global.ZinemaAchat = { ouvrir: ouvrir };
})(window);
