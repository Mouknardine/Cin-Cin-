/* ============================================================
   Zinéma — pied de page (absent de l'accueil, comme avant)
   ============================================================ */
(function () {
  "use strict";
  var root = document.body.dataset.root || "";
  var mount = document.getElementById("footer-root");
  if (!mount) return;

  var navLinks = [
    { href: "films/", label: "Films" },
    { href: "agenda/", label: "Agenda" },
    { href: "histoire/", label: "Histoire" },
    { href: "annonces/", label: "Annonces" },
    { href: "infos-pratiques/", label: "Infos pratiques" },
  ];

  window.ZinemaData.getSiteSettings().then(function (settings) {
    var navHTML = navLinks
      .map(function (l) {
        return '<a href="' + root + l.href + '" class="underline-hover">' + l.label + "</a>";
      })
      .join("");

    mount.innerHTML =
      '<footer class="site-footer"><div class="site-footer__inner">' +
      '<div><p class="site-footer__name font-display">Zinéma</p>' +
      '<p class="site-footer__tagline">' + window.ZinemaRender.escapeHtml(settings.tagline || "Cinéma indépendant à Lausanne") + "</p></div>" +
      '<nav class="site-footer__nav">' + navHTML + "</nav>" +
      '<div class="site-footer__contact">' +
      "<p>" + window.ZinemaRender.escapeHtml(settings.address || "") + "</p>" +
      (settings.phone ? "<p>" + window.ZinemaRender.escapeHtml(settings.phone) + "</p>" : "") +
      (settings.email ? "<p>" + window.ZinemaRender.escapeHtml(settings.email) + "</p>" : "") +
      "</div></div>" +
      '<p class="site-footer__legal">© ' + new Date().getFullYear() + " Zinéma, Lausanne. Site édité via Sanity.</p>" +
      "</footer>";
  });
})();
