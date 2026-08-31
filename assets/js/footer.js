/* ============================================================
   Zinéma — pied de page (absent de l'accueil, comme avant).

   Il reprend le langage du site : un petit tableau de cases
   blanches séparées par des traits noirs, dont la largeur suit la
   longueur du texte. Une seule suite de cases, qui se replient
   toutes seules en autant de rangées que l'écran le demande —
   une seule ligne sur ordinateur, trois ou quatre sur mobile.

   Il ne reprend AUCUNE rubrique du site : la barre de navigation
   (ordinateur) et le menu plein écran (mobile) les portent déjà
   toutes les six. Il ne garde que ce qu'on ne trouve nulle part
   ailleurs — suivre le cinéma, s'y rendre, l'appeler.

   Comme partout ailleurs, la couleur de chaque case est tirée au
   hasard (couleurs.js) et n'apparaît qu'au survol.
   ============================================================ */
(function () {
  "use strict";
  var mount = document.getElementById("footer-root");
  if (!mount) return;

  window.ZinemaData.getReglages().then(function (settings) {
    /* Pas de réglages publiés (ou réseau coupé) : pas de pied de
       page inventé — on n'affiche simplement que la signature. */
    if (window.ZinemaData.estUneErreur(settings) || !settings) settings = {};
    var esc = window.ZinemaRender.escapeHtml;
    var C = window.ZinemaCouleurs;

    var reseauxHTML = (settings.socialLinks || [])
      .filter(function (reseau) {
        return reseau && reseau.url && reseau.label;
      })
      .map(function (reseau) {
        return (
          '<a href="' + esc(reseau.url) + '" class="site-footer__lien ' + C.classe() + '" ' +
          'target="_blank" rel="noopener noreferrer">' + esc(reseau.label) + "</a>"
        );
      })
      .join("");

    var telephoneHTML = settings.phone
      ? '<a class="site-footer__case ' + C.classe() + '" href="tel:' +
        esc(settings.phone.replace(/\s/g, "")) + '">' + esc(settings.phone) + "</a>"
      : "";

    mount.innerHTML =
      '<footer class="site-footer">' +
      reseauxHTML +
      (settings.address
        ? '<p class="site-footer__case ' + C.classe() + '">' +
          esc(String(settings.address).replace(/\s*\n\s*/g, ", ")) + "</p>"
        : "") +
      telephoneHTML +
      /* La signature de l'agence ferme le tableau. Seule case du
         site à ne pas participer au tirage des couleurs : elle est
         rose au survol, la couleur de We Are Brothers. */
      '<a class="site-footer__case site-footer__signature" ' +
      'href="https://wearebrothers.ch" target="_blank" rel="noopener noreferrer">' +
      "Site par We Are Brothers</a>" +
      "</footer>";
  });
})();
