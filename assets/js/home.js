/* ============================================================
   Zinéma — accueil : un mur d'affiches en boucle infinie.

   Le mur ne contient QUE des affiches : la navigation vit dans la
   barre fixe en haut, la même que sur toutes les autres pages du
   site. Un menu qui se déplace au fil du défilement n'est pas un
   menu, et une case de texte posée au milieu d'un mur d'images se
   lit comme un trou, pas comme un bouton.

   Ici : le défilement infini, et lui seul. La forme du mur vit
   dans home-grille.js, la répartition des affiches dans ses cases
   dans home-mur.js, et le choix de ce qui monte sur le mur dans
   home-choix.js.
   ============================================================ */
(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var app = document.getElementById("app");
  var G = window.ZinemaHomeGrille;
  var M = window.ZinemaHomeMur;

  /* Seize copies du cycle empilées, et l'on se tient toujours vers
     la huitième : le visiteur peut défiler longtemps dans les deux
     sens avant qu'on le ramène discrètement au centre. */
  var COPIES = 16;
  var JUMP = 8;

  function buildCanvas(items) {
    app.innerHTML =
      '<div class="home-canvas">' +
      '<div class="home-canvas__scroll"><div class="home-canvas__track"><div class="home-canvas__stage"></div></div></div>' +
      "</div>";

    var scrollEl = app.querySelector(".home-canvas__scroll");
    var trackEl = app.querySelector(".home-canvas__track");
    var stageEl = app.querySelector(".home-canvas__stage");

    /* La géométrie du moment. Elle est recalculée à chaque mise en
       page, et relue par le défilement : d'où cette variable
       partagée plutôt qu'un calcul répété. */
    var g = null;

    /* Écran d'arrivée : le mur s'ouvre sur le haut d'un cycle, donc
       sur le haut de la première colonne — la seule qui ne soit pas
       décalée. On recule d'un trait pour que l'affiche ne vienne
       pas se coller sous la barre de navigation : le mur commence
       par le même filet que celui qui sépare deux affiches, et le
       rythme du quadrillage est identique partout, bords compris.
       On part de la copie centrale, pour pouvoir défiler dans les
       deux sens. */
    function startTop() {
      return JUMP * g.cycle - g.ligne;
    }

    function layout() {
      g = G.grille(scrollEl.clientWidth || window.innerWidth);

      var hauteurTotale = g.cycle * COPIES + g.debord;
      trackEl.style.height = hauteurTotale + "px";
      stageEl.style.height = hauteurTotale + "px";

      var cases = G.casesDuCycle(g);
      var afficheDe = M.construire(items, g, JUMP);
      var ecran = scrollEl.clientHeight || window.innerHeight;

      var html = "";
      for (var copie = 0; copie < COPIES; copie++) {
        html += '<div class="home-canvas__copy" style="top:' + copie * g.cycle + "px;height:" + g.cycle + 'px">';
        for (var i = 0; i < cases.length; i++) {
          var c = cases[i];
          /* Chargement immédiat pour les seules cases visibles à
             l'arrivée : celles du haut de la copie centrale, et
             celles de la copie d'avant qui débordent sur elle. */
          var priority =
            (copie === JUMP && c.top < ecran) ||
            (copie === JUMP - 1 && c.top + c.height > g.cycle);
          html +=
            '<div class="home-canvas__slot" style="left:' + c.left +
            "px;top:" + c.top +
            "px;width:" + c.width +
            "px;height:" + c.height + 'px">' +
            G.caseHTML(root, afficheDe(c.colonne, c.rang, copie), priority) +
            "</div>";
        }
        html += "</div>";
      }
      stageEl.innerHTML = html;
    }

    layout();

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollEl.scrollTo({ top: startTop(), left: 0, behavior: "instant" });
      });
    });

    function recentre() {
      var c = g.cycle;
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
          var c = g.cycle;
          var y = scrollEl.scrollTop;
          var max = scrollEl.scrollHeight - scrollEl.clientHeight;
          if (y < c * 2 || y > max - c * 2) recentre();
          ticking = false;
        });
      },
      { passive: true }
    );

    /* Au redimensionnement, la grille change de forme : on la
       redessine, et l'on revient au point de départ plutôt que de
       retomber n'importe où dans un mur qui n'a plus les mêmes
       hauteurs. */
    var resizeTimer = null;
    var largeurConnue = scrollEl.clientWidth;
    window.addEventListener("resize", function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        /* Sur téléphone, la barre d'adresse qui se replie déclenche
           un « resize » sans que la largeur change : redessiner le
           mur y ferait sauter la lecture pour rien. */
        if (scrollEl.clientWidth === largeurConnue) return;
        largeurConnue = scrollEl.clientWidth;
        layout();
        scrollEl.scrollTo({ top: startTop(), left: 0, behavior: "instant" });
      }, 150);
    });
  }

  var D = window.ZinemaData;
  var R = window.ZinemaRender;
  var C = window.ZinemaHomeChoix;

  app.innerHTML = '<div class="home-canvas"></div>';

  Promise.all([D.getFilms(), D.getEvenements(), D.getScreenings()]).then(function (r) {
    var films = r[0], evenements = r[1], seances = r[2];

    if (D.estUneErreur(films)) {
      app.innerHTML = R.etatErreur();
      return;
    }

    var items = C.selection(
      films,
      D.estUneErreur(evenements) ? [] : evenements,
      D.estUneErreur(seances) ? [] : seances
    );

    /* Aucune affiche : le mur reste vide, sans phrase pour le dire. */
    if (!items.length) {
      app.innerHTML = "";
      return;
    }

    buildCanvas(items);
  });
})();
