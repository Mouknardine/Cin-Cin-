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
     par des traits noirs continus fins (LINE), jamais de vide.
     Les boutons de navigation ont TOUS exactement la même taille.
     Pour le garantir dans une grille pleine, les colonnes sont de
     largeur égale ; le quinconce vient du rythme décalé : une
     colonne commence par une affiche, la suivante par un bouton —
     deux boutons ne se touchent donc jamais, ni dans une colonne,
     ni entre colonnes voisines, ni au raccord de la boucle.
     Les 6 boutons (5 pages + logo) reviennent à chaque cycle,
     toujours à la même place.
     Pour aérer l'écran, le tableau est une bande centrée qui
     flotte sur fond blanc (gridLeft/gridWidth), avec des traits
     fins — comme une toile accrochée à un mur. */
  var LINE = 4;

  var desktopConfig = {
    designWidth: 1200,
    cycleHeight: 1244,
    gridLeft: 106,
    gridWidth: 988,
    columns: [
      { left: 110, width: 324, cells: [
        { type: "poster", height: 464 },
        { type: "tile", height: 150 },
        { type: "poster", height: 464 },
        { type: "tile", height: 150 },
      ] },
      { left: 438, width: 324, cells: [
        { type: "tile", height: 150 },
        { type: "poster", height: 464 },
        { type: "tile", height: 150 },
        { type: "poster", height: 464 },
      ] },
      { left: 766, width: 324, cells: [
        { type: "poster", height: 464 },
        { type: "tile", height: 150 },
        { type: "poster", height: 464 },
        { type: "tile", height: 150 },
      ] },
    ],
  };

  /* Sur mobile, le tableau occupe toute la largeur de l'écran :
     les marges blanches n'existent que sur ordinateur. */
  var mobileConfig = {
    designWidth: 400,
    cycleHeight: 1131,
    gridLeft: 0,
    gridWidth: 400,
    columns: [
      { left: 4, width: 194, cells: [
        { type: "poster", height: 269 },
        { type: "tile", height: 100 },
        { type: "poster", height: 269 },
        { type: "tile", height: 100 },
        { type: "poster", height: 269 },
        { type: "tile", height: 100 },
      ] },
      { left: 202, width: 194, cells: [
        { type: "tile", height: 100 },
        { type: "poster", height: 269 },
        { type: "tile", height: 100 },
        { type: "poster", height: 269 },
        { type: "tile", height: 100 },
        { type: "poster", height: 269 },
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
  var navTiles = (window.ZinemaNavLinks || []).slice().concat([{ logo: true }]);

  /* Sur l'écran d'arrivée, la case qui traverse le centre (et s'y
     allume) est celle d'index 2 dans l'ordre des cases. On y place
     « Films » : c'est ce que les visiteurs cherchent en premier. */
  var CENTER_TILE_INDEX = 2;
  var filmsIndex = -1;
  navTiles.forEach(function (tile, i) {
    if (tile.page === "films") filmsIndex = i;
  });
  if (filmsIndex > -1 && filmsIndex !== CENTER_TILE_INDEX) {
    var swapped = navTiles[CENTER_TILE_INDEX];
    navTiles[CENTER_TILE_INDEX] = navTiles[filmsIndex];
    navTiles[filmsIndex] = swapped;
  }

  function filmForSlot(films, copyIndex, posterIndex, perCycle) {
    var globalIndex = copyIndex * perCycle + posterIndex;
    return films[globalIndex % films.length];
  }

  function tileForSlot(copyIndex, tileIndex, perCycle) {
    var globalIndex = copyIndex * perCycle + tileIndex;
    return navTiles[globalIndex % navTiles.length];
  }

  /* Chaque affiche porte le titre du film : toujours visible sur
     mobile (pas de survol possible), au survol sur ordinateur. */
  function canvasPosterHTML(item, priority) {
    return (
      '<a href="' + root + item.href + '" class="canvas-poster">' +
      window.ZinemaRender.posterHTML(item, { priority: priority }) +
      '<span class="canvas-poster__plus">+</span>' +
      '<span class="canvas-poster__title">' + window.ZinemaRender.escapeHtml(item.title) + "</span></a>"
    );
  }

  function canvasTileHTML(tile) {
    if (tile.logo) {
      return (
        '<a href="' + root + '" class="canvas-tile canvas-tile--logo" aria-label="Zinéma — accueil">' +
        '<img src="' + root + 'assets/img/zinema-logo.png" alt="Zinéma">' +
        '<span class="canvas-tile__tagline">Cinéma indépendant — Lausanne</span></a>'
      );
    }
    /* Les titres longs (« Infos pratiques ») réduisent leur corps
       pour ne jamais couper un mot en deux. */
    var compact = tile.label.length > 8 ? " canvas-tile--compact" : "";
    return (
      '<a href="' + root + tile.href + '" class="canvas-tile canvas-tile--' + tile.color + compact + '">' +
      '<span class="canvas-tile__label">' + tile.label + "</span></a>"
    );
  }

  function buildCanvas(items) {
    app.innerHTML =
      '<div class="home-canvas">' +
      '<div class="home-canvas__scroll"><div class="home-canvas__track"><div class="home-canvas__stage"></div></div></div>' +
      '<div class="home-scroll-cue" aria-hidden="true">↓</div>' +
      "</div>";

    var scrollEl = app.querySelector(".home-canvas__scroll");
    var trackEl = app.querySelector(".home-canvas__track");
    var stageEl = app.querySelector(".home-canvas__stage");

    /* La flèche invite à faire défiler le tableau ; elle disparaît
       dès que le visiteur a compris (premier vrai défilement). Le
       calage initial déclenche aussi un événement scroll : on ne
       masque qu'à partir d'un écart net avec la position de départ. */
    var cueEl = app.querySelector(".home-scroll-cue");
    var cueOrigin = null;

    function hideCueIfScrolled() {
      if (!cueEl || cueOrigin === null) return;
      if (Math.abs(scrollEl.scrollTop - cueOrigin) > 40) {
        cueEl.classList.add("is-hidden");
        cueEl = null;
      }
    }

    /* Les cases de navigation s'allument de leur couleur quand
       elles traversent le milieu de l'écran pendant le scroll. */
    var litTiles = [];

    function updateLitTiles() {
      var s = scale();
      var middle = scrollEl.scrollTop + scrollEl.clientHeight / 2;
      var band = scrollEl.clientHeight * 0.22;
      litTiles.forEach(function (tile) {
        tile.el.classList.toggle("is-lit", Math.abs(tile.center * s - middle) < band);
      });
    }

    function config() {
      return window.innerWidth < 768 ? mobileConfig : desktopConfig;
    }
    function scale() {
      return window.innerWidth / config().designWidth;
    }
    function cyclePx() {
      return config().cycleHeight * scale();
    }

    /* Écran d'arrivée : le tableau s'ouvre sur la rangée dont la
       case en haut à droite est le logo Zinéma. On cherche la case
       logo dans la copie centrale et on cale le haut de l'écran
       juste au-dessus, sur son trait noir. */
    function startTop() {
      var c = config();
      var tilesPerCycle = countType(c.slots, "tile");
      var logoTop = 0;
      var tileIdx = 0;
      c.slots.forEach(function (slot) {
        if (slot.type !== "tile") return;
        if (tileForSlot(JUMP, tileIdx, tilesPerCycle).logo) logoTop = slot.top;
        tileIdx += 1;
      });
      return (JUMP * c.cycleHeight + logoTop - LINE) * scale();
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
        /* Le fond noir du quadrillage, limité à la bande du tableau :
           tout autour, la page reste blanche. */
        html += '<div class="home-canvas__grid" style="left:' + c.gridLeft + "px;top:0;width:" + c.gridWidth + "px;height:" + c.cycleHeight + 'px"></div>';
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

      /* Position (en pixels de la grille) du centre de chaque case
         de navigation, pour l'allumage au passage du milieu. */
      litTiles = [];
      var tileEls = stageEl.querySelectorAll(".canvas-tile");
      var k = 0;
      for (var copy = 0; copy < COPIES; copy++) {
        c.slots.forEach(function (slot) {
          if (slot.type !== "tile") return;
          litTiles.push({ el: tileEls[k], center: copy * c.cycleHeight + slot.top + slot.height / 2 });
          k += 1;
        });
      }
      updateLitTiles();
    }

    layout();

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollEl.scrollTo({ top: startTop(), left: 0, behavior: "instant" });
        cueOrigin = scrollEl.scrollTop;
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
        hideCueIfScrolled();

        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var c = cyclePx();
          var y = scrollEl.scrollTop;
          var max = scrollEl.scrollHeight - scrollEl.clientHeight;
          if (y < c * 2 || y > max - c * 2) recentre();
          updateLitTiles();
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
        scrollEl.scrollTo({ top: startTop(), left: 0, behavior: "instant" });
        if (cueEl) cueOrigin = scrollEl.scrollTop;
      }, 150);
    });
  }

  /* Seules les véritables images (Sanity ou fichier local) entrent
     dans le collage : jamais d'affiche générée/fictive sur l'accueil. */
  function isRealImage(image) {
    return Boolean(window.ZinemaRender.hasRealImage(image) || (image && image.localUrl));
  }

  /* Le collage mélange les affiches des films à l'affiche et les
     visuels des annonces épinglées (événements type Coupe du monde),
     qui renvoient vers la page Annonces. */
  function selectHomeItems(films, announcements) {
    var filmItems = films
      .filter(function (f) {
        return f.status !== "passe" && isRealImage(f.poster);
      })
      .sort(function (a, b) {
        return Number(Boolean(b.featuredHome)) - Number(Boolean(a.featuredHome));
      })
      .slice(0, 8)
      .map(function (f) {
        return { title: f.title, poster: f.poster, href: "film/?s=" + encodeURIComponent(f.slug) };
      });

    var eventItems = (announcements || [])
      .filter(function (a) {
        return a.pinned && isRealImage(a.image);
      })
      .map(function (a) {
        return { title: a.title, poster: a.image, href: "annonces/" };
      });

    return filmItems.concat(eventItems);
  }

  app.innerHTML = '<div class="home-canvas"></div>';

  Promise.all([window.ZinemaData.getFilms(), window.ZinemaData.getAnnouncements()]).then(function (results) {
    buildCanvas(selectHomeItems(results[0], results[1]));
  });
})();
