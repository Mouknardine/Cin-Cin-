/* ============================================================
   Zinéma — le formulaire de demande de location.

   Il ferme la page Location : on a vu les espaces, on demande.
   La demande part sur le serveur du site (api/demande-location.php),
   qui l'envoie par courriel au cinéma — la même voie que les
   billets. Aucune adresse n'est écrite dans cette page : elle vit
   dans le Studio, hors de portée des robots ramasseurs d'e-mails.

   Trois choses seulement sont obligatoires : le nom, l'e-mail et
   le message. Tout le reste aide le cinéma à répondre juste, sans
   bloquer quelqu'un qui ne connaît pas encore sa date.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;

  var CHOIX_INDECIS = "Je ne sais pas encore";

  function champ(nom, label, attributs, aide) {
    return (
      '<label class="m-cell m-demande__champ ' + C.classe() + '">' +
      '<span class="m-cell__label">' + R.escapeHtml(label) + "</span>" +
      "<input name=\"" + nom + '" ' + attributs + ">" +
      (aide ? '<span class="m-demande__aide">' + R.escapeHtml(aide) + "</span>" : "") +
      "</label>"
    );
  }

  function choixEspaces(espaces) {
    var options = (espaces || [])
      .map(function (espace) {
        var nom = espace && espace.nom;
        return nom ? '<option value="' + R.escapeHtml(nom) + '">' + R.escapeHtml(nom) + "</option>" : "";
      })
      .filter(Boolean)
      .join("");
    return (
      '<label class="m-cell m-demande__champ ' + C.classe() + '">' +
      '<span class="m-cell__label">Espace souhaité</span>' +
      '<select name="espace">' + options +
      '<option value="' + CHOIX_INDECIS + '">' + CHOIX_INDECIS + "</option></select></label>"
    );
  }

  /* Le tableau de la demande. Le champ « site » est un piège : un
     visiteur ne le voit pas et ne le remplit jamais ; un robot,
     lui, remplit tout ce qu'il trouve. Rempli, la demande est
     refusée sans un mot — inutile d'expliquer sa ruse à un robot. */
  function html(espaces) {
    return (
      '<form class="m-bande m-bande--demande" id="demande-location" novalidate>' +
      '<div class="m-cell m-demande__titre ' + C.classe() + '">' +
      "<p>Demander une location</p></div>" +
      champ("nom", "Votre nom", 'type="text" required autocomplete="name" placeholder="Prénom Nom"') +
      champ("email", "Votre e-mail", 'type="email" required autocomplete="email" inputmode="email" placeholder="prenom@exemple.ch"') +
      champ("telephone", "Téléphone", 'type="tel" autocomplete="tel" placeholder="021 000 00 00"', "Facultatif") +
      choixEspaces(espaces) +
      champ("date", "Date souhaitée", 'type="date"', "Facultatif") +
      champ("personnes", "Nombre de personnes", 'type="number" min="1" max="500" inputmode="numeric" placeholder="30"', "Facultatif") +
      '<label class="m-cell m-demande__champ m-demande__champ--message ' + C.classe() + '">' +
      '<span class="m-cell__label">Votre projet</span>' +
      '<textarea name="message" rows="4" required placeholder="Ce que vous aimeriez organiser, et à quel moment de la journée."></textarea></label>' +
      '<label class="m-demande__piege" aria-hidden="true" tabindex="-1">' +
      'Ne pas remplir<input name="site" type="text" tabindex="-1" autocomplete="off"></label>' +
      '<p class="m-demande__message" role="status" hidden></p>' +
      '<button type="submit" class="m-cell m-action m-demande__envoyer">' +
      "<span>Envoyer la demande</span></button></form>"
    );
  }

  /* ---------------- Envoi ---------------- */

  function valeurs(form) {
    var lu = {};
    ["nom", "email", "telephone", "espace", "date", "personnes", "message", "site"].forEach(
      function (nom) {
        var champDom = form.elements[nom];
        lu[nom] = champDom ? String(champDom.value || "").trim() : "";
      }
    );
    return lu;
  }

  /* Une seule vérification côté navigateur : les trois champs
     obligatoires et la forme de l'adresse. Le serveur revérifie
     tout — une page peut être contournée, pas lui. */
  function premierManque(donnees) {
    if (!donnees.nom) return "Indiquez votre nom, pour qu'on sache à qui répondre.";
    if (!donnees.email || donnees.email.indexOf("@") < 1 || donnees.email.indexOf(".") < 0) {
      return "Vérifiez votre adresse e-mail : c'est par là que la réponse arrivera.";
    }
    if (!donnees.message) return "Dites-nous en deux mots ce que vous aimeriez organiser.";
    return "";
  }

  function afficherMessage(form, texte, estUneErreur) {
    var zone = form.querySelector(".m-demande__message");
    zone.textContent = texte || "";
    zone.hidden = !texte;
    zone.classList.toggle("m-demande__message--erreur", Boolean(estUneErreur));
  }

  function brancher(app) {
    var form = app.querySelector("#demande-location");
    if (!form) return;
    var bouton = form.querySelector(".m-demande__envoyer");
    var root = document.body.dataset.root || "";
    var envoiEnCours = false;

    form.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      if (envoiEnCours) return;

      var donnees = valeurs(form);
      var manque = premierManque(donnees);
      if (manque) {
        afficherMessage(form, manque, true);
        return;
      }

      envoiEnCours = true;
      bouton.disabled = true;
      bouton.querySelector("span").textContent = "Envoi…";
      afficherMessage(form, "", false);

      fetch(root + "api/demande-location.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees),
      })
        .then(function (reponse) {
          return reponse.json().catch(function () {
            return { ok: false };
          });
        })
        .then(function (resultat) {
          if (resultat && resultat.ok) {
            /* Demande partie : le formulaire disparaît et laisse la
               confirmation à sa place. Le renvoyer deux fois par
               impatience n'apprendrait rien de plus au cinéma. */
            form.innerHTML =
              '<div class="m-cell m-demande__confirmation ' + C.classe() + '">' +
              "<p>Votre demande est partie. Le cinéma vous répond en général sous deux jours ouvrables.</p></div>";
            return;
          }
          afficherMessage(
            form,
            (resultat && resultat.message) ||
              "L'envoi n'a pas abouti. Réessayez dans un instant, ou appelez le cinéma.",
            true
          );
        })
        .catch(function () {
          afficherMessage(
            form,
            "L'envoi n'a pas abouti : vérifiez votre connexion, puis réessayez.",
            true
          );
        })
        .finally(function () {
          envoiEnCours = false;
          if (!form.querySelector(".m-demande__confirmation")) {
            bouton.disabled = false;
            bouton.querySelector("span").textContent = "Envoyer la demande";
          }
        });
    });
  }

  global.ZinemaLocationFormulaire = { html: html, brancher: brancher };
})(window);
