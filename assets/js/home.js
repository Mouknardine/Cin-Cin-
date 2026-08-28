/* ============================================================
   Zinéma — accueil : un mur d'affiches en boucle infinie.

   Le mur ne contient QUE des affiches : la navigation vit dans la
   barre fixe en haut, la même que sur toutes les autres pages du
   site. Un menu qui se déplace au fil du défilement n'est pas un
   menu, et une case de texte posée au milieu d'un mur d'images se
   lit comme un trou, pas comme un bouton.

   Ici : le défilement infini et le choix des affiches. La forme
   du mur, elle, est décrite dans home-grille.js.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("app");
  var G = window.ZinemaHomeGrille;

  /* Seize copies du cycle empilées, et l'on se tient toujours vers
     la huitième : le visiteur peut défiler longtemps dans les deux
     sens avant qu'on le ramène discrètement au centre. */
  var COPIES = 16;
  var JUMP = 8;

  function filmForSlot(films, copyIndex, posterIndex, perCycle) {
    var globalIndex = copyIndex * perCycle + posterIndex;
    return films[globalIndex % films.length];
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
      return window.innerWidth < 768 ? G.mobile : G.desktop;
    }
    function scale() {
      return window.innerWidth / config().designWidth;
    }
    function cyclePx() {
      return config().cycleHeight * scale();
    }

    /* Écran d'arrivée : le mur s'ouvre pile sur le haut d'un cycle,
       donc sur une rangée entière d'affiches, posée juste sous la
       barre de navigation. On part de la copie centrale, pour
       pouvoir défiler dans les deux sens. */
    function startTop() {
      return JUMP * config().cycleHeight * scale();
    }

    function layout() {
      var c = config();
      var s = scale();
      trackEl.style.height = c.cycleHeight * COPIES * s + "px";
      stageEl.style.width = c.designWidth + "px";
      stageEl.style.height = c.cycleHeight * COPIES + "px";
      stageEl.style.transform = "scale(" + s + ")";

      var postersPerCycle = c.slots.length;

      var html = "";
      for (var copyIdx = 0; copyIdx < COPIES; copyIdx++) {
        html += '<div class="home-canvas__copy" style="top:' + copyIdx * c.cycleHeight + "px;width:" + c.designWidth + "px;height:" + c.cycleHeight + 'px">';
        var posterIdx = 0;
        c.slots.forEach(function (slot) {
          var content;
          if (items.length > 0) {
            /* Chargement immédiat pour la seule rangée visible à
               l'arrivée : celle du haut de la copie centrale. */
            var priority = copyIdx === JUMP && slot.top === 0;
            content = G.caseHTML(root, filmForSlot(items, copyIdx, posterIdx, postersPerCycle), priority);
            posterIdx += 1;
          } else {
            content = G.caseVideHTML();
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
