/* ============================================================
   Zinéma — pied de page (absent de l'accueil, comme avant) :
   le logo en grand, une ligne de petits liens, une ligne légale.
   ============================================================ */
(function () {
  "use strict";
  var root = document.body.dataset.root || "";
  var mount = document.getElementById("footer-root");
  if (!mount) return;

  window.ZinemaData.getSiteSettings().then(function (settings) {
    var esc = window.ZinemaRender.escapeHtml;

    var links = [{ href: root + "infos-pratiques/", label: "Conditions & tarifs" }];
    if (settings.email) {
      links.push({ href: "mailto:" + settings.email, label: "Contact" });
    }
    (settings.socialLinks || []).forEach(function (social) {
      if (social && social.url && social.label) {
        links.push({ href: social.url, label: social.label, external: true });
      }
    });

    var linksHTML = links
      .map(function (l) {
        return (
          '<a href="' + esc(l.href) + '" class="underline-hover"' +
          (l.external ? ' target="_blank" rel="noopener noreferrer"' : "") +
          ">" + esc(l.label) + "</a>"
        );
      })
      .join("");

    mount.innerHTML =
      '<footer class="site-footer">' +
      '<a href="' + root + '" class="site-footer__logo" aria-label="Zinéma — accueil">' +
      '<img src="' + root + 'assets/img/zinema-logo.png" alt="Zinéma"></a>' +
      '<nav class="site-footer__links" aria-label="Liens du pied de page">' + linksHTML + "</nav>" +
      '<p class="site-footer__legal">© ' + new Date().getFullYear() + " Zinéma — " + esc(settings.address || "Lausanne") + "</p>" +
      "</footer>";
  });
})();
