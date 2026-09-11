/* ============================================================
   Zinéma — les films que la page Événements annonce d'elle-même.

   Deux choses n'ont jamais eu à être ressaisies dans un événement,
   parce qu'elles sont déjà écrites dans la fiche du film :

     — les films qui sortent PROCHAINEMENT (« Où en est ce film ? »
       dans le Studio) ;
     — les films projetés EN PRÉSENCE de quelqu'un (le champ
       « Séance en présence de… » de la fiche).

   Ils apparaissent donc tout seuls, sous les événements saisis à
   la main, dans la même mise en page : une bande par film —
   l'affiche, la date, le titre, l'invité·e, et le chemin vers la
   fiche. Rien à créer, rien à supprimer : un film qui passe à
   l'affiche quitte la rubrique de lui-même, comme un invité
   retiré de la fiche.

   Un film qui est dans les deux cas n'est annoncé qu'une fois :
   sa bande porte simplement les deux informations.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;

  /* Ce que la case de date raconte, selon ce qu'on sait du film.
     Dans l'ordre de ce qui compte : le jour où l'invité·e sera là,
     sinon la date de sortie annoncée, sinon la prochaine séance.
     Si rien n'est su, on le dit — plutôt que d'inventer un jour. */
  function quandTexte(film) {
    if (film.presence && film.presenceDate) {
      var jour = R.formatDateSortie(film.presenceDate);
      if (jour) return jour;
    }
    if (film.status === "prochainement") {
      var sortie = R.formatDateSortie(film.releaseDate);
      return sortie ? "dès le " + sortie : "Date à venir";
    }
    var seance = film.prochaineSeance;
    if (seance && seance.date) {
      var date = R.formatDateSortie(seance.date);
      if (date) return seance.time ? date + ", " + seance.time : date;
    }
    return "Date à venir";
  }

  /* La date sur laquelle la rubrique se range. Un film dont on ne
     sait pas encore quand il passe se range après les autres, sans
     jamais disparaître de la page. */
  function dateDeTri(film) {
    var seance = film.prochaineSeance;
    return (
      (film.presence && film.presenceDate) ||
      (film.status === "prochainement" && film.releaseDate) ||
      (seance && seance.date) ||
      "9999-12-31"
    );
  }

  /* Une case intitulé + valeur, comme les repères de la fiche film. */
  function caseInfo(classe, label, valeur) {
    if (!valeur) return "";
    return (
      '<div class="m-cell ' + classe + ' m-cell--ligne ' + C.classe() + '">' +
      '<p class="m-cell__label">' + R.escapeHtml(label) + "</p>" +
      '<p class="m-cell__value">' + R.escapeHtml(valeur) + "</p></div>"
    );
  }

  /* L'affiche du film. Un film sans affiche déposée reçoit l'affiche
     typographique du site, qui n'a pas le format d'une vraie affiche :
     sa case doit alors être prévenue, sinon l'image déborde. */
  function afficheHTML(film, lien) {
    var generee = R.hasRealImage(film.poster) ? "" : " m-affiche--generee";
    return (
      '<a class="m-affiche m-affiche--film m-annonce__affiche' + generee + '" href="' +
      R.escapeHtml(lien) + '" tabindex="-1" aria-hidden="true">' +
      R.posterHTML(film) + "</a>"
    );
  }

  /* Une bande par film : l'affiche, le titre, la date, l'invité·e.
     Le titre suit immédiatement l'affiche — c'est ce qui permet aux
     deux de tenir sur la même ligne sur téléphone, plutôt que de
     laisser l'affiche seule avec un trait noir à sa droite.

     Pas de case « Voir le film » : le titre EST le lien, comme les
     affiches de la page Films. Une case de plus, et la rangée ne
     tenait plus sur une ligne d'écran d'ordinateur — pour répéter un
     geste que le titre offrait déjà. L'affiche mène au même endroit ;
     elle est retirée du parcours au clavier plutôt que de le doubler. */
  function bandeHTML(film, racine) {
    var lien = racine + "film/?s=" + encodeURIComponent(film.slug);
    return (
      '<div class="m-bande m-bande--annonce m-bande--film">' +
      afficheHTML(film, lien) +
      '<a class="m-cell m-annonce__titre m-annonce__film-titre ' + C.classe() + '" href="' +
      R.escapeHtml(lien) + '">' + R.escapeHtml(film.title) + "</a>" +
      caseInfo("m-annonce__quand", R.statusLabel(film.status), quandTexte(film)) +
      caseInfo("m-annonce__presence", "En présence de", film.presence) +
      "</div>"
    );
  }

  /* Toutes les bandes, prêtes à être posées dans le tableau. Les
     séances en présence de quelqu'un passent devant : ce sont des
     rendez-vous datés, alors qu'un film annoncé peut encore
     attendre. Sans aucun film à annoncer, rien n'est écrit. */
  function bandes(films) {
    if (!Array.isArray(films) || !films.length) return "";
    var racine = document.body.dataset.root || "";
    var avecInvite = [];
    var annonces = [];
    films.forEach(function (film) {
      if (!film || !film.slug) return;
      /* On n'annonce que ce qui a quelque chose à annoncer : un
         invité·e, ou une sortie à venir. Un film qui n'a ni l'un ni
         l'autre n'a rien à faire sur cette page, même si la requête
         le renvoyait. */
      if (film.presence) avecInvite.push(film);
      else if (film.status === "prochainement") annonces.push(film);
    });
    function parDate(a, b) {
      return String(dateDeTri(a)).localeCompare(String(dateDeTri(b)));
    }
    return avecInvite
      .sort(parDate)
      .concat(annonces.sort(parDate))
      .map(function (film) { return bandeHTML(film, racine); })
      .join("");
  }

  global.ZinemaEvenementsFilms = { bandes: bandes };
})(window);
