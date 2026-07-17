/* ============================================================
   Zinéma — accueil : canevas à deux colonnes d'affiches en
   boucle infinie, ponctué de cases de navigation colorées.
   La navigation du site se fait uniquement par ces cases :
   il n'y a ni barre en haut ni logo central sur l'accueil.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("app");

  /* Chaque cycle contient 6 affiches et 3 cases de navigation,
     toutes rangées dans les deux mêmes colonnes (gauche/droite),
     en quinconce. Les positions sont en pixels de la grille de
     référence (designWidth), mise à l'échelle de l'écran ensuite. */
  /* Tableau « Mondrian » comme les pages Films : uniquement des
     cases utiles — affiches et boutons de navigation — séparées
     par des traits noirs continus de 4 px, jamais de vide.
     Les boutons de navigation ont TOUS exactement la même taille.
     Pour le garantir dans une grille pleine, les colonnes sont de
     largeur égale ; le quinconce vient du rythme décalé : une
     colonne commence par une affiche, la suivante par un bouton —
     deux boutons ne se touchent donc jamais, ni dans une colonne,
     ni entre colonnes voisines, ni au raccord de la boucle.
     Les 6 boutons (5 pages + logo) reviennent à chaque cycle,
     toujours à la même place. */
  var LINE = 4;

  var desktopConfig = {
    designWidth: 1192,
    cycleHeight: 1478,
    columns: [
      { left: 4, width: 392, cells: [
        { type: "poster", height: 561 },
        { type: "tile", height: 170 },
        { type: "poster", height: 561 },
        { type: "tile", height: 170 },
      ] },
      { left: 400, width: 392, cells: [
        { type: "tile", height: 170 },
        { type: "poster", height: 561 },
        { type: "tile", height: 170 },
        { type: "poster", height: 561 },
      ] },
      { left: 796, width: 392, cells: [
        { type: "poster", height: 561 },
        { type: "tile", height: 170 },
        { type: "poster", height: 561 },
        { type: "tile", height: 170 },
      ] },
    ],
  };

  var mobileConfig = {
    designWidth: 400,
    cycleHeight: 1155,
    columns: [
      { left: 4, width: 194, cells: [
        { type: "poster", height: 277 },
        { type: "tile", height: 100 },
        { type: "poster", height: 277 },
        { type: "tile", height: 100 },
        { type: "poster", height: 277 },
        { type: "tile", height: 100 },
      ] },
      { left: 202, width: 194, cells: [
        { type: "tile", height: 100 },
        { type: "poster", height: 277 },
        { type: "tile", height: 100 },
        { type: "poster", height: 277 },
        { type: "tile", height: 100 },
        { type: "poster", height: 277 },
      ] },
    ],
  };

  /* Colonnes → cases positionnées : chaque case est suivie d'un
     trait de 4 px, le dernier trait faisant le raccord de boucle. */
  function buildSlots(config) {
    var slots = [];
    config.columns.forEach(function (column) {
      var y = 0;
      column.cells.forEach(function (cell) {
        slots.push({ type: cell.type, left: column.left, top: y, width: column.width, height: cell.height });
        y += cell.height + LINE;
      });
    });
    return slots;
  }
  desktopConfig.slots = buildSlots(desktopConfig);
  mobileConfig.slots = buildSlots(mobileConfig);

  var COPIES = 16;
  var JUMP = 8;

  function countType(slots, type) {
    return slots.filter(function (slot) {
      return slot.type === type;
    }).length;
  }

  /* Les cases de navigation : les cinq pages du menu + le logo.
     Elles tournent de copie en copie, comme les affiches, pour
     que toutes les options reviennent régulièrement au fil du
     scroll (le cycle complet des 6 cases s'étale sur 2 copies). */
  var navTiles = (window.ZinemaNavLinks || []).concat([{ logo: true }]);

  function filmForSlot(films, copyIndex, posterIndex, perCycle) {
    var globalIndex = copyIndex * perCycle + posterIndex;
    return films[globalIndex % films.length];
  }

  function tileForSlot(copyIndex, tileIndex, perCycle) {
    var globalIndex = copyIndex * perCycle + tileIndex;
    return navTiles[globalIndex % navTiles.length];
  }

  function canvasPosterHTML(film, priority) {
    return (
      '<a href="' + root + "film/?s=" + encodeURIComponent(film.slug) + '" class="canvas-poster">' +
      window.ZinemaRender.posterHTML(film, { priority: priority }) +
      '<span class="canvas-poster__plus">+</span></a>'
    );
  }

  function canvasTileHTML(tile) {
    if (tile.logo) {
      return (
        '<a href="' + root + '" class="canvas-tile canvas-tile--logo" aria-label="Zinéma — accueil">' +
        '<img src="' + root + 'assets/img/zinema-logo.png" alt="Zinéma"></a>'
      );
    }
    /* Le numéro vit dans la même ligne de texte que le titre : si le
       titre passe sur deux lignes, rien ne se désaligne. Les titres
       longs (« Infos pratiques ») réduisent leur corps pour ne jamais
       couper un mot en deux. */
    var compact = tile.label.length > 8 ? " canvas-tile--compact" : "";
    return (
      '<a href="' + root + tile.href + '" class="canvas-tile canvas-tile--' + tile.color + compact + '">' +
      '<span class="canvas-tile__label"><span class="canvas-tile__num">' + tile.num + "</span>" + tile.label + "</span></a>"
    );
  }

  function buildCanvas(items) {
    app.innerHTML =
      '<div class="home-canvas">' +
      '<div class="home-canvas__scroll"><div class="home-canvas__track"><div class="home-canvas__stage"></div></div></div>' +
      "</div>";

    var scrollEl = app.querySelector(".home-canvas__scroll");
    var trackEl = app.querySelector(".home-canvas__track");
    var stageEl = app.querySelector(".home-canvas__stage");

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

      var postersPerCycle = countType(c.slots, "poster");
      var tilesPerCycle = countType(c.slots, "tile");

      var html = "";
      for (var copyIdx = 0; copyIdx < COPIES; copyIdx++) {
        html += '<div class="home-canvas__copy" style="top:' + copyIdx * c.cycleHeight + "px;width:" + c.designWidth + "px;height:" + c.cycleHeight + 'px">';
        var posterIdx = 0;
        var tileIdx = 0;
        c.slots.forEach(function (slot) {
          var content;
          if (slot.type === "tile") {
            content = canvasTileHTML(tileForSlot(copyIdx, tileIdx, tilesPerCycle));
            tileIdx += 1;
          } else if (items.length > 0) {
            var priority = copyIdx === JUMP && posterIdx < 3;
            content = canvasPosterHTML(filmForSlot(items, copyIdx, posterIdx, postersPerCycle), priority);
            posterIdx += 1;
          } else {
            /* Case de secours si aucun film n'a d'affiche :
               le tableau reste plein. */
            content = '<div class="canvas-block"></div>';
          }
          html +=
            '<div class="home-canvas__slot" style="left:' + slot.left + "px;top:" + slot.top + "px;width:" + slot.width + "px;height:" + slot.height + 'px">' +
            content +
            "</div>";
        });
        html += "</div>";
      }
      stageEl.innerHTML = html;
    }

    layout();

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollEl.scrollTo({ top: JUMP * cyclePx(), left: 0, behavior: "instant" });
      });
    });

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

  /* Seuls les films avec une véritable affiche (image Sanity ou
     fichier local) entrent dans le collage : jamais d'affiche
     générée/fictive sur l'accueil. */
  function hasRealPoster(film) {
    var R = window.ZinemaRender;
    return Boolean(R.hasRealImage(film.poster) || (film.poster && film.poster.localUrl));
  }

  function selectHomeItems(films) {
    var active = films
      .filter(function (f) {
        return f.status !== "passe" && hasRealPoster(f);
      })
      .sort(function (a, b) {
        return Number(Boolean(b.featuredHome)) - Number(Boolean(a.featuredHome));
      });
    return active.slice(0, 8);
  }

  app.innerHTML = '<div class="home-canvas"></div>';

  window.ZinemaData.getFilms().then(function (films) {
    buildCanvas(selectHomeItems(films));
  });
})();
