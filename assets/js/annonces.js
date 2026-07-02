/* ============================================================
   Zinéma — annonces : mise en avant + liste
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("annonces-app");
  var R = window.ZinemaRender;

  var categoryLabels = {
    nouveaute: "Nouveauté",
    evenement: "Évènement",
    cycle: "Cycle",
    brunch: "Brunch",
    info: "Info spéciale",
  };

  function highlightHTML(a) {
    var linkHTML = a.linkUrl
      ? '<a href="' + R.escapeHtml(a.linkUrl) + '" target="_blank" rel="noopener noreferrer" class="announcement-highlight__link underline-hover">En savoir plus →</a>'
      : "";
    return (
      '<div class="announcement-highlight reveal"><p class="announcement-highlight__cat font-display">' +
      (categoryLabels[a.category] || "Annonce") + " — " + R.formatLongDate(a.date) + "</p>" +
      '<h2 class="announcement-highlight__title font-display">' + R.escapeHtml(a.title) + "</h2>" +
      (a.excerpt ? '<p class="announcement-highlight__excerpt">' + R.escapeHtml(a.excerpt) + "</p>" : "") +
      linkHTML + "</div>"
    );
  }

  function itemHTML(a, i) {
    var linkHTML = a.linkUrl
      ? '<a href="' + R.escapeHtml(a.linkUrl) + '" target="_blank" rel="noopener noreferrer" class="announcement-item__link underline-hover">En savoir plus →</a>'
      : "";
    return (
      '<li class="announcement-item reveal" data-delay="' + i * 0.05 + '">' +
      '<div class="announcement-item__date-col"><p class="font-display">' + R.formatLongDate(a.date) + "</p>" +
      '<p class="announcement-item__cat">' + (categoryLabels[a.category] || "Annonce") + "</p></div>" +
      '<div><h3 class="announcement-item__title font-display">' + R.escapeHtml(a.title) + "</h3>" +
      (a.excerpt ? '<p class="announcement-item__excerpt">' + R.escapeHtml(a.excerpt) + "</p>" : "") +
      linkHTML + "</div></li>"
    );
  }

  window.ZinemaData.getAnnouncements().then(function (announcements) {
    if (announcements.length === 0) {
      app.innerHTML = '<p class="empty-state font-display">Aucune annonce publiée pour le moment.</p>';
      return;
    }
    var first = announcements[0];
    var rest = announcements.slice(1);
    var listHTML = rest.length
      ? '<ul class="announcements-list">' + rest.map(itemHTML).join("") + "</ul>"
      : "";
    app.innerHTML = highlightHTML(first) + listHTML;
    window.ZinemaReveal.observe(app);
  });
})();
