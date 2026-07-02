/* ============================================================
   Zinéma — accueil : canevas d'affiches à deux colonnes, en
   boucle infinie. Port direct de l'ancienne version React,
   même logique de positionnement et de recentrage de la boucle.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("app");

  var desktopConfig = {
    designWidth: 1200,
    posterWidth: 230,
    posterHeight: 345,
    cycleHeight: 1290,
    slots: [
      { left: 50, top: 0 },
      { left: 920, top: 215 },
      { left: 50, top: 430 },
      { left: 920, top: 645 },
      { left: 50, top: 860 },
      { left: 920, top: 1075 },
    ],
  };

  var mobileConfig = {
    designWidth: 400,
    posterWidth: 130,
    posterHeight: 195,
    cycleHeight: 1200,
    slots: [
      { left: 10, top: 0 },
      { left: 260, top: 200 },
      { left: 10, top: 400 },
      { left: 260, top: 600 },
      { left: 10, top: 800 },
      { left: 260, top: 1000 },
    ],
  };

  var COPIES = 16;
  var JUMP = 8;

  function filmForSlot(films, copyIndex, slotIndex) {
    var n = films.length;
    var globalIndex = copyIndex * 6 + slotIndex;
    return films[globalIndex % n];
  }

  function canvasPosterHTML(film, priority) {
    return (
      '<a href="' + root + "film/?s=" + encodeURIComponent(film.slug) + '" class="canvas-poster">' +
      window.ZinemaRender.posterHTML(film, { priority: priority }) +
      '<span class="canvas-poster__plus">+</span></a>'
    );
  }

  function buildCanvas(items) {
    app.innerHTML =
      '<div class="home-canvas">' +
      '<div class="home-canvas__logo"><img src="' + root + 'assets/img/zinema-logo.png" alt="Zinéma"></div>' +
      '<div class="home-canvas__scroll"><div class="home-canvas__track"><div class="home-canvas__stage"></div></div></div>' +
      "</div>";

    var canvasEl = app.querySelector(".home-canvas");
    var scrollEl = app.querySelector(".home-canvas__scroll");
    var trackEl = app.querySelector(".home-canvas__track");
    var stageEl = app.querySelector(".home-canvas__stage");

    var scrolledIn = false;

    function config() {
      return window.innerWidth < 768 ? mobileConfig : desktopConfig;
    }
    function scale() {
      return window.innerWidth / config().designWidth;
    }
    function cyclePx() {
      return config().cycleHeight * scale();
    }

    function layout() {
      var c = config();
      var s = scale();
      trackEl.style.height = c.cycleHeight * COPIES * s + "px";
      stageEl.style.width = c.designWidth + "px";
      stageEl.style.height = c.cycleHeight * COPIES + "px";
      stageEl.style.transform = "scale(" + s + ")";

      var html = "";
      for (var copyIdx = 0; copyIdx < COPIES; copyIdx++) {
        html += '<div class="home-canvas__copy" style="top:' + copyIdx * c.cycleHeight + "px;width:" + c.designWidth + "px;height:" + c.cycleHeight + 'px">';
        c.slots.forEach(function (slot, slotIdx) {
          var film = filmForSlot(items, copyIdx, slotIdx);
          var priority = copyIdx === JUMP && slotIdx < 3;
          html +=
            '<div class="home-canvas__slot" style="left:' + slot.left + "px;top:" + slot.top + "px;width:" + c.posterWidth + "px;height:" + c.posterHeight + 'px">' +
            canvasPosterHTML(film, priority) +
            "</div>";
        });
        html += "</div>";
      }
      stageEl.innerHTML = html;
    }

    layout();

    if (!scrolledIn) {
      scrolledIn = true;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          scrollEl.scrollTo({ top: JUMP * cyclePx(), left: 0, behavior: "instant" });
        });
      });
    }

    function recentre() {
      var c = cyclePx();
      var y = scrollEl.scrollTop;
      if (y < c * (JUMP - 4)) {
        scrollEl.scrollTo({ top: y + JUMP * c, left: 0, behavior: "instant" });
      } else if (y > c * (JUMP + 4)) {
        scrollEl.scrollTo({ top: y - JUMP * c, left: 0, behavior: "instant" });
      }
    }

    var settleTimer = null;
    var ticking = false;
    scrollEl.addEventListener(
      "scroll",
      function () {
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(recentre, 120);

        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var c = cyclePx();
          var y = scrollEl.scrollTop;
          var max = scrollEl.scrollHeight - scrollEl.clientHeight;
          if (y < c * 2 || y > max - c * 2) recentre();
          ticking = false;
        });
      },
      { passive: true }
    );

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        layout();
        scrollEl.scrollTo({ top: JUMP * cyclePx(), left: 0, behavior: "instant" });
      }, 150);
    });
  }

  function selectHomeItems(films) {
    var active = films
      .filter(function (f) {
        return f.status !== "passe";
      })
      .sort(function (a, b) {
        return Number(Boolean(b.featuredHome)) - Number(Boolean(a.featuredHome));
      });
    return active.slice(0, 8);
  }

  app.innerHTML =
    '<div class="home-canvas"><div class="home-canvas__logo"><img src="' + root + 'assets/img/zinema-logo.png" alt="Zinéma"></div></div>';

  window.ZinemaData.getFilms().then(function (films) {
    buildCanvas(selectHomeItems(films));
  });
})();
