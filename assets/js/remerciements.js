/* ============================================================
   Zinéma — page Remerciements (adresse /remerciements/), le mur
   de celles et ceux qui font vivre le cinéma.

   Un mur de briques : une brique par nom — une institution, un
   soutien, une personne. Les noms viennent tous du Studio
   (Réglages du cinéma → Infos pratiques → Remerciements) : rien
   n'est écrit en dur ici.

   Toutes les briques sont écrites à la MÊME taille : un mur de
   remerciements ne classe personne, le petit donateur y a les
   mêmes lettres que la grande institution. Ce sont les noms qui
   font les briques inégales — « Ville de Lausanne » est plus long
   que « Loro » — et c'est ce qui donne au mur ses rangées
   décalées, comme un vrai appareil de briques. La couleur de
   chaque brique, elle, est tirée au hasard à chaque visite comme
   partout sur le site.

   La page n'est pas dans le menu : on y entre par une case de la
   page Infos (voir contact.js), qui n'apparaît que s'il y a au
   moins un nom à remercier. Cette case s'appelle « Merci » : la
   page n'a donc pas de titre à elle, elle s'ouvre directement sur
   les noms. Le redire en arrivant ne dirait rien de plus.
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("remerciements-app");
  var R = window.ZinemaRender;
  var C = window.ZinemaCouleurs;
  var D = window.ZinemaData;
  var root = document.body.dataset.root || "";

  function bande(classe, cases) {
    var contenu = (Array.isArray(cases) ? cases : [cases]).filter(Boolean).join("");
    return contenu ? '<div class="m-bande ' + classe + '">' + contenu + "</div>" : "";
  }

  /* Le contenu d'une brique : le nom, et sous lui, s'il est
     renseigné, ce pour quoi on remercie — à la même taille, en
     maigre : sur ce site la hiérarchie se fait par la graisse,
     jamais par la taille. */
  function contenu(merci) {
    var mention = merci.mention
      ? '<p class="m-merci__mention">' + R.escapeHtml(merci.mention) + "</p>"
      : "";
    return '<p class="m-merci__nom">' + R.escapeHtml(merci.nom) + "</p>" + mention;
  }

  /* Une brique. Elle devient un lien si — et seulement si — une
     adresse a été renseignée dans le Studio : un lien qui ne mène
     nulle part ne doit pas se présenter comme un lien. */
  function brique(merci) {
    if (!merci || !merci.nom) return "";
    var classes = "m-cell m-merci " + C.classe();
    if (!merci.url) {
      return '<div class="' + classes + '">' + contenu(merci) + "</div>";
    }
    return (
      '<a class="' + classes + '" href="' + R.escapeHtml(merci.url) +
      '" target="_blank" rel="noopener noreferrer">' + contenu(merci) + "</a>"
    );
  }

  /* Cette page n'est pas dans le menu : on y entre par la page
     Infos. Elle se termine donc par le chemin du retour — sans lui,
     on ne saurait plus d'où l'on vient. */
  function retourHTML() {
    return bande("m-bande--retour", [
      '<a href="' + root + 'contact/" class="m-cell m-action ' + C.classe() + '">' +
        "<span>Infos</span></a>",
      R.caseVoirLesSeances(),
    ]);
  }

  function cadre(contenu) {
    return '<article class="mondrian mondrian--remerciements">' + contenu + retourHTML() + "</article>";
  }

  /* Personne à remercier encore : la page existe (son adresse a pu
     être partagée), elle le dit simplement, sans laisser un cadre
     vide. */
  function pageVide() {
    return cadre(
      bande("m-bande--vide", [
        '<div class="m-cell m-info ' + C.classe() + '">' +
        '<p class="m-cell__label">Merci</p>' +
        '<p class="m-cell__value">La liste est en préparation.</p></div>',
      ])
    );
  }

  app.innerHTML = R.etatChargement("des remerciements");

  D.getReglages().then(function (reglages) {
    if (D.estUneErreur(reglages)) {
      app.innerHTML = R.etatErreur();
      return;
    }

    var noms = ((reglages && reglages.remerciements) || []).filter(function (merci) {
      return merci && merci.nom;
    });

    if (!noms.length) {
      app.innerHTML = pageVide();
      return;
    }

    app.innerHTML = cadre(bande("m-bande--mur", noms.map(brique)));
  });
})();
