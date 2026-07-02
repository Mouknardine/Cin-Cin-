/* ============================================================
   Zinéma — infos pratiques : adresse, horaires, accès
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("infos-app");
  var R = window.ZinemaRender;

  function renderAccess(access) {
    if (typeof access === "string") return access;
    if (Array.isArray(access)) {
      return access
        .map(function (block) {
          return ((block && block.children) || []).map(function (c) { return c.text; }).join("");
        })
        .join("\n");
    }
    return "";
  }

  window.ZinemaData.getSiteSettings().then(function (settings) {
    var access = renderAccess(settings.accessInfo) || "Bus et métro m2, arrêt à quelques minutes. Détails à venir.";

    var mapHTML = settings.mapUrl
      ? '<a href="' + R.escapeHtml(settings.mapUrl) + '" target="_blank" rel="noopener noreferrer" class="practical-map-link underline-hover">Voir sur la carte →</a>'
      : "";

    var contactHTML =
      (settings.phone ? '<a href="tel:' + settings.phone.replace(/\s/g, "") + '">' + R.escapeHtml(settings.phone) + "</a>" : "") +
      (settings.email ? '<a href="mailto:' + settings.email + '">' + R.escapeHtml(settings.email) + "</a>" : "");

    var socialsHTML =
      settings.socialLinks && settings.socialLinks.length
        ? '<div class="practical-socials">' +
          settings.socialLinks
            .map(function (s) {
              return '<a href="' + R.escapeHtml(s.url) + '" target="_blank" rel="noopener noreferrer" class="underline-hover">' + R.escapeHtml(s.label) + "</a>";
            })
            .join("") +
          "</div>"
        : "";

    var hoursHTML = (settings.openingHours || [])
      .map(function (h) {
        return '<li><span class="label">' + R.escapeHtml(h.label) + '</span><span class="value font-display">' + R.escapeHtml(h.value) + "</span></li>";
      })
      .join("");

    app.innerHTML =
      '<div class="practical-grid">' +
      '<div class="practical-col--address reveal">' +
      '<p class="practical-label font-display">Adresse</p>' +
      '<p class="practical-address font-display">' + R.escapeHtml(settings.address || "Adresse à venir") + "</p>" +
      mapHTML +
      '<p class="practical-label font-display" style="margin-top:2rem">Contact</p>' +
      '<div class="practical-contact">' + contactHTML + "</div>" +
      socialsHTML +
      "</div>" +
      '<div class="practical-col--hours reveal" data-delay="0.08">' +
      '<p class="practical-label font-display">Horaires</p>' +
      '<ul class="practical-hours">' + hoursHTML + "</ul></div>" +
      '<div class="practical-col--access reveal" data-delay="0.16">' +
      '<p class="practical-label font-display">Accès</p>' +
      '<p class="practical-access-text">' + R.escapeHtml(access) + "</p></div>" +
      "</div>";

    window.ZinemaReveal.observe(app);
  });
})();
