/* ============================================================
   Zinéma — la case « Remerciements » de la page Infos.

   Une grande case qui en contient de plus petites : une par nom
   à remercier — une institution, un soutien, une personne. Les
   noms viennent tous du Studio (Réglages du cinéma → Infos
   pratiques → Remerciements) : rien n'est écrit en dur ici, et
   sans aucun nom la case n'est pas affichée du tout, pour ne
   jamais laisser un cadre vide dans le tableau.

   Comme partout sur le site, la couleur de chaque sous-case est
   tirée au hasard à chaque visite. La TAILLE l'est aussi, ce qui
   n'existe nulle part ailleurs : trois formats tirés dans le même
   paquet mélangé que les couleurs, pour que la rangée ressemble à
   un vrai Mondrian — des rectangles inégaux — et non à une liste
   de cases toutes pareilles.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;

  /* Trois formats seulement : c'est ce qui garde la rangée lisible.
     Au-delà, la plus petite case devient illisible à côté de la
     plus grande. Le tirage est équilibré : sur six noms, les trois
     formats sortent deux fois chacun. */
  var tailleSuivante = C.tirage(["petite", "moyenne", "grande"]);

  /* Le contenu d'une sous-case : le nom en grand, et sous lui, s'il
     est renseigné, ce pour quoi on remercie. */
  function contenu(merci) {
    var mention = merci.mention
      ? '<p class="m-merci__mention">' + R.escapeHtml(merci.mention) + "</p>"
      : "";
    return '<p class="m-merci__nom">' + R.escapeHtml(merci.nom) + "</p>" + mention;
  }

  /* Une sous-case. Elle devient un lien si — et seulement si — une
     adresse a été renseignée dans le Studio : un lien qui ne mène
     nulle part ne doit pas se présenter comme un lien. */
  function sousCase(merci) {
    if (!merci || !merci.nom) return "";
    var classes = "m-cell m-merci m-merci--" + tailleSuivante() + " " + C.classe();
    if (!merci.url) {
      return '<div class="' + classes + '">' + contenu(merci) + "</div>";
    }
    return (
      '<a class="' + classes + '" href="' + R.escapeHtml(merci.url) +
      '" target="_blank" rel="noopener noreferrer">' + contenu(merci) + "</a>"
    );
  }

  /* La bande entière, prête à être posée dans le tableau. Renvoie
     une chaîne vide s'il n'y a personne à remercier : la page ne
     porte alors aucune trace de cette rubrique. */
  function bande(remerciements) {
    if (!Array.isArray(remerciements)) return "";
    var cases = remerciements.map(sousCase).filter(Boolean).join("");
    if (!cases) return "";
    return (
      '<div class="m-bande m-bande--remerciements">' +
      '<div class="m-cell m-merci__titre ' + C.classe() + '">' +
      '<p class="m-cell__label">Remerciements</p></div>' +
      '<div class="m-bande m-merci__liste">' + cases + "</div></div>"
    );
  }

  global.ZinemaRemerciements = { bande: bande };
})(window);
