/* ============================================================
   Zinéma — agenda : vues jour et semaine
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("agenda-app");
  var R = window.ZinemaRender;

  var statusText = { disponible: "", complet: "Complet", annule: "Annulé" };

  function groupByDate(screenings) {
    var map = {};
    var order = [];
    screenings.forEach(function (s) {
      if (!(s.date in map)) {
        map[s.date] = [];
        order.push(s.date);
      }
      map[s.date].push(s);
    });
    order.sort();
    return order.map(function (date) {
      var list = map[date].slice().sort(function (a, b) { return a.time.localeCompare(b.time); });
      return { date: date, screenings: list };
    });
  }

  var days = [];
  var activeDate = null;
  var mode = "jour";

  function dayTabsHTML() {
    return days
      .map(function (d) {
        var date = R.parseISODate(d.date);
        var label = R.isToday(date) ? "AUJ." : R.formatDowShort(d.date);
        return (
          '<button type="button" class="agenda-day-btn' + (d.date === activeDate ? " is-active" : "") + '" data-date="' + d.date + '">' +
          '<span class="agenda-day-btn__dow">' + label + "</span>" +
          '<span class="agenda-day-btn__num">' + String(date.getDate()).padStart(2, "0") + "</span></button>"
        );
      })
      .join("");
  }

  function dayPanelHTML() {
    var activeDay = days.filter(function (d) { return d.date === activeDate; })[0] || days[0];
    if (!activeDay) return "";
    var items = activeDay.screenings
      .map(function (s) {
        var filmHref = s.film ? root + "film/?s=" + encodeURIComponent(s.film.slug) : root + "films/";
        var statusMobile = statusText[s.status]
          ? '<span class="agenda-item__sub-status' + (s.status === "annule" ? " is-status-red" : "") + '"> · ' + statusText[s.status] + "</span>"
          : "";
        var statusDesktop = '<span class="agenda-item__status' + (s.status === "annule" ? " is-status-red" : "") + '">' + statusText[s.status] + "</span>";
        var sub = [R.escapeHtml(s.room || ""), s.versionNote ? "— " + R.escapeHtml(s.versionNote) : ""].filter(Boolean).join(" ");
        return (
          '<li class="agenda-item"><span class="agenda-item__time font-display">' + s.time + "</span>" +
          "<div><a href=\"" + filmHref + '" class="agenda-item__title underline-hover font-display">' + R.escapeHtml(s.film ? s.film.title : "Séance") + "</a>" +
          '<p class="agenda-item__sub">' + sub + statusMobile + "</p></div>" +
          statusDesktop + "</li>"
        );
      })
      .join("");
    return (
      '<div class="agenda-day-panel"><p class="agenda-day-panel__heading font-display">' + R.formatDayHeading(activeDay.date) + "</p>" +
      '<ul>' + items + "</ul></div>"
    );
  }

  function weekViewHTML() {
    return (
      '<div class="agenda-week">' +
      days
        .map(function (d) {
          var items = d.screenings
            .map(function (s) {
              var filmHref = s.film ? root + "film/?s=" + encodeURIComponent(s.film.slug) : root + "films/";
              var statusStr = statusText[s.status] ? " · " + statusText[s.status] : "";
              return (
                '<li><a href="' + filmHref + '" class="agenda-week__link underline-hover font-display">' + s.time + " — " + R.escapeHtml(s.film ? s.film.title : "") + "</a>" +
                '<p class="agenda-week__meta">' + R.escapeHtml(s.room || "") + statusStr + "</p></li>"
              );
            })
            .join("");
          return (
            '<div class="agenda-week__col"><p class="agenda-week__date font-display">' + R.formatDayHeading(d.date) + "</p>" +
            '<ul class="agenda-week__list">' + items + "</ul></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function render() {
    if (days.length === 0) {
      app.innerHTML = '<p class="empty-state font-display">Aucune séance programmée pour le moment.</p>';
      return;
    }
    var modesHTML =
      '<div class="agenda-toolbar__modes">' +
      '<button type="button" class="chip' + (mode === "jour" ? " is-active" : "") + '" data-mode="jour">Jour</button>' +
      '<button type="button" class="chip' + (mode === "semaine" ? " is-active" : "") + '" data-mode="semaine">Semaine</button>' +
      "</div>";

    var body = mode === "jour"
      ? '<div class="agenda-days">' + dayTabsHTML() + "</div>" + dayPanelHTML()
      : weekViewHTML();

    app.innerHTML = '<div class="agenda-toolbar">' + modesHTML + "</div>" + body;

    app.querySelectorAll("[data-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        mode = btn.dataset.mode;
        render();
      });
    });
    app.querySelectorAll("[data-date]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeDate = btn.dataset.date;
        render();
      });
    });
  }

  window.ZinemaData.getScreenings().then(function (screenings) {
    days = groupByDate(screenings);
    activeDate = days[0] ? days[0].date : null;
    render();
  });
})();
