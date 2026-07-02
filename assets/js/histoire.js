/* ============================================================
   Zinéma — histoire : intro + frise chronologique
   ============================================================ */
(function () {
  "use strict";

  var app = document.getElementById("histoire-app");
  var R = window.ZinemaRender;

  function renderBody(body) {
    if (typeof body === "string") return body;
    if (Array.isArray(body)) {
      return body
        .map(function (block) {
          return ((block && block.children) || []).map(function (c) { return c.text; }).join("");
        })
        .join("\n\n");
    }
    return "";
  }

  function entryHTML(entry, i) {
    var bodyText = renderBody(entry.body);
    return (
      '<li class="history-entry reveal" data-delay="' + i * 0.06 + '"><span class="history-entry__dot"></span>' +
      '<p class="history-entry__ghost-year font-display">' + R.escapeHtml(entry.year) + "</p>" +
      '<div class="history-entry__body"><p class="history-entry__year font-display">' + R.escapeHtml(entry.year) + "</p>" +
      '<h2 class="history-entry__title font-display">' + R.escapeHtml(entry.title) + "</h2>" +
      (bodyText ? '<p class="history-entry__text">' + R.escapeHtml(bodyText) + "</p>" : "") +
      "</div></li>"
    );
  }

  Promise.all([window.ZinemaData.getHistory(), window.ZinemaData.getSiteSettings()]).then(function (results) {
    var entries = results[0];
    var settings = results[1];
    var intro =
      settings.historyIntro ||
      "Pendant que les grandes salles rétrécissaient leurs rangées pour multiplier les écrans, le Zinéma a fait le pari inverse : une salle généreuse, pensée pour rassembler un public plutôt que le fragmenter en micro-écrans.";

    app.innerHTML =
      '<div class="history-intro reveal"><p class="font-display">' + R.escapeHtml(intro) + "</p></div>" +
      '<ol class="history-timeline">' + entries.map(entryHTML).join("") + "</ol>";

    window.ZinemaReveal.observe(app);
  });
})();
