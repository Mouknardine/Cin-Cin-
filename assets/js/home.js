/* ============================================================
   Zinéma — accueil : canevas d'affiches en boucle infinie
   (3 colonnes sur ordinateur, 2 sur mobile), ponctué de
   cases de navigation.
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
  /* Grille aérée : uniquement des cases utiles — affiches et
     boutons de navigation — séparées par de larges espaces blancs
     (gap), pour que chaque case respire et se lise d'un coup d'œil.
     Les boutons de navigation ont TOUS exactement la même taille.
     Les colonnes sont de largeur égale ; le quinconce vient du
     rythme décalé : une colonne commence par une affiche, la
     suivante par un bouton — deux boutons ne se côtoient donc
     jamais, ni dans une colonne, ni entre colonnes voisines,
     ni au raccord de la boucle.
     Les 6 boutons (5 pages + logo) reviennent à chaque cycle,
     toujours à la même place. */

  /* Trois colonnes espacées, en bande centrée sur fond blanc. */
  var desktopConfig = {
    designWidth: 1200,
    cycleHeight: 1230,
    gap: 32,
    columns: [
      { left: 106, width: 308, cells: [
        { type: "poster", height: 441 },
        { type: "tile", height: 110 },
        { type: "poster", height: 441 },
        { type: "tile", height: 110 },
      ] },
      { left: 446, width: 308, cells: [
        { type: "tile", height: 110 },
        { type: "poster", height: 441 },
        { type: "tile", height: 110 },
        { type: "poster", height: 441 },
      ] },
      { left: 786, width: 308, cells: [
        { type: "poster", height: 441 },
        { type: "tile", height: 110 },
        { type: "poster", height: 441 },
        { type: "tile", height: 110 },
      ] },
    ],
  };

  /* Sur mobile : deux colonnes espacées, avec une marge blanche
     de chaque côté de l'écran. */
  var mobileConfig = {
    designWidth: 400,
    cycleHeight: 1056,
    gap: 16,
    columns: [
      { left: 16, width: 176, cells: [
        { type: "poster", height: 244 },
        { type: "tile", height: 76 },
        { type: "poster", height: 244 },
        { type: "tile", height: 76 },
        { type: "poster", height: 244 },
        { type: "tile", height: 76 },
      ] },
      { left: 208, width: 176, cells: [
        { type: "tile", height: 76 },
        { type: "poster", height: 244 },
        { type: "tile", height: 76 },
        { type: "poster", height: 244 },
        { type: "tile", height: 76 },
        { type: "poster", height: 244 },
      ] },
    ],
  };

  /* Colonnes → cases positionnées : chaque case est suivie d'un
     espace blanc (gap), le dernier faisant le raccord de boucle.
     La somme des hauteurs + espaces de chaque colonne doit donc
     valoir exactement cycleHeight. */
  function buildSlots(config) {
    var slots = [];
    config.columns.forEach(function (column) {
      var y = 0;
      column.cells.forEach(function (cell) {
        slots.push({ type: cell.type, left: column.left, top: y, width: column.width, height: cell.height });
        y += cell.height + config.gap;
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

  /* Les cases de navigation : les six pages du menu, le logo, et
     la case d'achat (verte). Huit cases au total — exactement le
     nombre de places par cycle sur ordinateur : aucune rubrique
     n'apparaît donc deux fois dans le même écran. Elles tournent
     de copie en copie, comme les affiches. */
  var navTiles = (window.ZinemaNavLinks || [])
    .slice()
    .concat([{ logo: true }, { achat: true, label: "Acheter", href: "agenda/" }]);

  /* Sur l'écran d'arrivée, la case qui traverse le centre est
     celle d'index 2 dans l'ordre des cases. On y place
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
        '<img src="' + root + 'assets/img/zinema-logo.png" alt="Zinéma"></a>'
      );
    }
    /* Les titres longs (« Membership ») réduisent leur corps pour
       ne jamais couper un mot en deux. La couleur, elle, est tirée
       au hasard à chaque case : la même rubrique n'a pas deux fois
       la même couleur au fil du défilement. Seule la case d'achat
       échappe au tirage : elle est verte, comme partout ailleurs. */
    var compact = tile.label.length > 8 ? " canvas-tile--compact" : "";
    var teinte = tile.achat ? "canvas-tile--achat" : window.ZinemaCouleurs.classe();
    return (
      '<a href="' + root + tile.href + '" class="canvas-tile ' + teinte + compact + '">' +
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

    function config() {
      return window.innerWidth < 768 ? mobileConfig : desktopConfig;
    }
    function scale() {
      return window.innerWidth / config().designWidth;
    }
    function cyclePx() {
      return config().cycleHeight * scale();
    }

    /* Position du logo Zinéma dans une copie donnée du cycle, ou
       -1 si le logo n'y figure pas (les cases tournent d'une copie
       à l'autre, il n'apparaît donc pas dans chacune). */
    function logoTopDansCopie(c, copie, tilesPerCycle) {
      var top = -1;
      var tileIdx = 0;
      c.slots.forEach(function (slot) {
        if (slot.type !== "tile") return;
        if (top < 0 && tileForSlot(copie, tileIdx, tilesPerCycle).logo) top = slot.top;
        tileIdx += 1;
      });
      return top;
    }

    /* Écran d'arrivée : le tableau s'ouvre sur la rangée qui porte
       le logo Zinéma. On part de la copie centrale et on descend
       jusqu'à la première copie où le logo apparaît, puis on cale
       le haut de l'écran juste au-dessus, au début de son espace
       blanc. Le recentrage tolère quatre copies d'écart : on reste
       dans cette marge. */
    function startTop() {
      var c = config();
      var tilesPerCycle = countType(c.slots, "tile");
      for (var copie = JUMP; copie <= JUMP + 4; copie++) {
        var top = logoTopDansCopie(c, copie, tilesPerCycle);
        if (top >= 0) return (copie * c.cycleHeight + top - c.gap) * scale();
      }
      return JUMP * c.cycleHeight * scale();
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
     qui renvoient vers la page Événement. */
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
        return { title: a.title, poster: a.image, href: "evenements/" };
      });

    return filmItems.concat(eventItems);
  }

  app.innerHTML = '<div class="home-canvas"></div>';

  Promise.all([window.ZinemaData.getFilms(), window.ZinemaData.getAnnouncements()]).then(function (results) {
    buildCanvas(selectHomeItems(results[0], results[1]));
  });
})();
