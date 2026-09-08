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

  /* ---------------- Jamais deux fois la même affiche l'une sous l'autre
     Le mur est une boucle : sous la dernière rangée d'un cycle vient la
     première rangée du suivant. En choisissant l'affiche d'après le rang
     de la case DANS LE CYCLE, deux cases voisines verticalement pouvaient
     tomber sur la même affiche au raccord — c'est ce qu'on voyait avec
     cinq films seulement.

     Deux règles suffisent à l'empêcher :

     1. L'affiche se choisit d'après la POSITION VERTICALE de la case dans
        sa colonne, cycles compris. Deux cases l'une sous l'autre prennent
        alors deux affiches voisines dans la liste : jamais la même.

     2. La liste est allongée jusqu'à une longueur qui divise le saut du
        défilement infini (huit cycles). Le mur se répète donc exactement
        là où le défilement se recale, et le visiteur ne voit jamais une
        affiche changer sous ses yeux.
     ---------------------------------------------------------------- */

  /** Les longueurs de mur acceptables : elles doivent contenir toutes
      les affiches, et diviser le saut du défilement pour que la boucle
      reste invisible. */
  function longueursPossibles(nombre, parColonne) {
    var saut = JUMP * parColonne; // le saut, compté en rangées
    var possibles = [];
    for (var l = 1; l <= saut; l++) {
      if (saut % l === 0 && l >= nombre) possibles.push(l);
    }
    return possibles;
  }

  /* Compose une suite d'affiches en boucle où aucune ne se retrouve
     collée à elle-même. « Collée » se lit dans les deux sens : à un
     rang d'écart (l'une sous l'autre) et à « parColonne » rangs d'écart
     (l'une à côté de l'autre, la grille étant remplie colonne par
     colonne).

     On pose les affiches une par une, en prenant à chaque fois la moins
     utilisée qui ne fâche personne, et on revient sur ses pas quand on
     se bloque. Les murs font au plus vingt-quatre cases : la recherche
     est immédiate. Aucun tirage au sort — le mur doit être le même d'un
     affichage à l'autre. */
  function composerLaSuite(nombre, longueur, ecarts) {
    var suite = [];
    var compte = [];
    var i;
    for (i = 0; i < longueur; i++) suite.push(-1);
    for (i = 0; i < nombre; i++) compte.push(0);

    function fache(place, affiche) {
      for (var e = 0; e < ecarts.length; e++) {
        var d = ecarts[e];
        var avant = ((place - d) % longueur + longueur) % longueur;
        var apres = (place + d) % longueur;
        if (avant !== place && suite[avant] === affiche) return true;
        if (apres !== place && suite[apres] === affiche) return true;
      }
      return false;
    }

    function poser(place) {
      if (place === longueur) return true;
      var ordre = [];
      for (var a = 0; a < nombre; a++) ordre.push(a);
      ordre.sort(function (x, y) {
        return compte[x] - compte[y] || x - y;
      });
      for (var k = 0; k < ordre.length; k++) {
        var affiche = ordre[k];
        if (fache(place, affiche)) continue;
        suite[place] = affiche;
        compte[affiche] += 1;
        if (poser(place + 1)) return true;
        suite[place] = -1;
        compte[affiche] -= 1;
      }
      return false;
    }

    return poser(0) ? suite : null;
  }

  function construireLeMur(items, parColonne) {
    var nombre = items.length;
    if (nombre < 2) return items.slice();
    var longueurs = longueursPossibles(nombre, parColonne);
    /* On vise d'abord le mur idéal : ni voisine du dessus, ni voisine de
       côté. Deux cas ne l'admettent pas, et ce n'est pas faute d'avoir
       cherché — c'est arithmétique. Sur ordinateur, le mur a trois
       colonnes :

         · avec DEUX affiches, une rangée de trois cases en répète
           forcément une ;
         · avec TROIS, interdire les voisines des deux côtés revient à
           exiger que trois cases consécutives soient toujours
           différentes, ce qui force un motif qui se répète tous les
           trois rangs — or la longueur du mur doit diviser le saut du
           défilement (seize rangs), et aucun multiple de trois ne
           divise seize.

       Dans ces deux cas on garde la règle qui compte, celle qui saute
       aux yeux : jamais deux fois la même affiche l'une sous l'autre. */
    var exigences = [[1, parColonne], [1]];
    for (var e = 0; e < exigences.length; e++) {
      var horizontal = exigences[e].length > 1;
      for (var l = 0; l < longueurs.length; l++) {
        var longueur = longueurs[l];
        /* Si l'écart entre deux colonnes retombe pile sur un tour de
           mur, les deux colonnes lisent la même case : la voisine de
           côté serait forcément identique. Cette longueur-là ne peut
           pas tenir la promesse, on passe à la suivante. */
        if (horizontal && parColonne % longueur === 0) continue;
        var suite = composerLaSuite(nombre, longueur, exigences[e]);
        if (suite) {
          return suite.map(function (indice) {
            return items[indice];
          });
        }
      }
    }
    return items.slice();
  }

  function filmForSlot(mur, parColonne, copyIndex, posterIndex) {
    var colonne = Math.floor(posterIndex / parColonne);
    var rangee = posterIndex % parColonne;
    /* La position de la case sur son axe vertical, en rangées, décalée
       d'une colonne à l'autre pour que deux voisines de la même rangée
       ne portent pas la même affiche non plus. */
    var position = copyIndex * parColonne + rangee + colonne * parColonne;
    return mur[position % mur.length];
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

      var mur = items.length ? construireLeMur(items, c.perColumn) : [];

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
            content = G.caseHTML(root, filmForSlot(mur, c.perColumn, copyIdx, posterIdx), priority);
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

  /* Une affiche réellement déposée dans Sanity, par opposition à
     l'affiche typographique que le site dessine à partir du titre
     quand il n'y en a pas encore. */
  function isRealImage(image) {
    return window.ZinemaRender.hasRealImage(image);
  }

  /* Ce qui remonte sur l'accueil se décide tout seul, sans case à
     cocher dans le Studio :
       - les films à l'affiche d'abord, avant-premières ensuite,
         puis cycles et films annoncés ;
       - à statut égal, celui dont la prochaine séance est la plus
         proche passe devant ;
       - les événements en cours ou à venir qui ont un visuel.
     Publier un film ou un événement suffit donc à le voir apparaître. */
  var RANG_STATUT = { "a-laffiche": 0, "avant-premiere": 1, cycle: 2, prochainement: 3 };

  function prochaineSeanceParFilm(seances) {
    var parFilm = {};
    (seances || []).forEach(function (s) {
      if (!s.film || !s.film._id) return;
      var cle = s.film._id;
      var quand = s.date + " " + (s.time || "");
      if (!parFilm[cle] || quand < parFilm[cle]) parFilm[cle] = quand;
    });
    return parFilm;
  }

  function selectHomeItems(films, evenements, seances) {
    var prochaine = prochaineSeanceParFilm(seances);

    var filmItems = (films || [])
      .filter(function (f) {
        return f.status !== "passe";
      })
      .sort(function (a, b) {
        /* Les films dont l'affiche est déposée passent devant : le
           mur montre d'abord de vraies affiches, et complète avec
           les affiches typographiques du site pour les films dont
           l'affiche n'est pas encore arrivée. */
        var ia = isRealImage(a.poster) ? 0 : 1;
        var ib = isRealImage(b.poster) ? 0 : 1;
        if (ia !== ib) return ia - ib;
        var ra = RANG_STATUT[a.status];
        var rb = RANG_STATUT[b.status];
        ra = ra === undefined ? 9 : ra;
        rb = rb === undefined ? 9 : rb;
        if (ra !== rb) return ra - rb;
        var pa = prochaine[a._id] || "9999";
        var pb = prochaine[b._id] || "9999";
        if (pa !== pb) return pa < pb ? -1 : 1;
        return String(a.title).localeCompare(String(b.title), "fr");
      })
      .slice(0, 8)
      .map(function (f) {
        return {
          title: f.title,
          poster: f.poster,
          /* Repris pour l'affiche typographique, qui écrit le titre,
             la réalisation et l'année. */
          director: f.director,
          year: f.year,
          slug: f.slug,
          href: "film/?s=" + encodeURIComponent(f.slug),
        };
      });

    var eventItems = (evenements || [])
      .filter(function (e) {
        return isRealImage(e.image);
      })
      .slice(0, 3)
      .map(function (e) {
        return { title: e.title, poster: e.image, href: "evenements/" };
      });

    return filmItems.concat(eventItems);
  }

  var D = window.ZinemaData;
  var R = window.ZinemaRender;

  app.innerHTML = '<div class="home-canvas"></div>';

  Promise.all([D.getFilms(), D.getEvenements(), D.getScreenings(), D.getPage("home")]).then(function (r) {
    var films = r[0], evenements = r[1], seances = r[2], page = r[3];

    if (D.estUneErreur(films)) {
      app.innerHTML = R.etatErreur();
      return;
    }

    var items = selectHomeItems(
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
