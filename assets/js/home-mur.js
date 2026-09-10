/* ============================================================
   Zinéma — accueil : quelle affiche dans quelle case.

   Le mur est une boucle : sous la dernière case d'un cycle vient
   la première du cycle suivant, et le défilement se recale
   régulièrement d'un nombre entier de cycles. Deux promesses à
   tenir pour que rien de tout cela ne se voie :

   1. Jamais deux fois la même affiche l'une sous l'autre. Chaque
      colonne reçoit sa propre suite d'affiches, posée une par une
      en revenant sur ses pas quand ça bloque. Aucun tirage au
      sort : le mur doit être le même d'un affichage à l'autre.

   2. La suite d'une colonne se répète exactement là où le
      défilement se recale, sinon une affiche changerait sous les
      yeux du visiteur. Sa longueur doit donc diviser « saut ×
      nombre de cases de la colonne ».

   Reste le voisinage de côté. Les colonnes n'ayant ni la même
   hauteur de case ni le même décalage, il n'existe plus de
   « rangée » : deux affiches se regardent quand elles se
   chevauchent en hauteur, et cela vaut aussi à deux ou trois
   colonnes de distance — une affiche répétée en travers de
   l'écran saute autant aux yeux qu'une voisine immédiate. Chaque
   colonne choisit donc la longueur de suite et le point de départ
   qui la répètent le moins face aux autres.
   ============================================================ */
(function (global) {
  "use strict";

  /** Les longueurs de suite qu'une colonne peut prendre : elles
      doivent diviser « saut × cases » pour refermer la boucle, et
      contenir toutes les affiches. Les plus courtes d'abord :
      chaque affiche revient alors le plus tôt possible, et le mur
      ne devient pas une longue liste sans rythme. */
  function longueursPossibles(nombre, cases, saut) {
    var total = saut * cases;
    var liste = [];
    for (var l = 1; l <= total; l++) {
      if (total % l === 0 && l >= nombre) liste.push(l);
    }
    return liste.length ? liste : [total];
  }

  /* Pose les affiches une par une, en prenant à chaque fois la
     moins utilisée qui ne se retrouve pas collée à elle-même, et
     revient sur ses pas en cas d'impasse. Les suites font au plus
     quarante cases : la recherche est immédiate. */
  function composerLaSuite(nombre, longueur) {
    var suite = [];
    var compte = [];
    var i;
    for (i = 0; i < longueur; i++) suite.push(-1);
    for (i = 0; i < nombre; i++) compte.push(0);

    function colleeAElleMeme(place, affiche) {
      var avant = (place - 1 + longueur) % longueur;
      var apres = (place + 1) % longueur;
      if (avant !== place && suite[avant] === affiche) return true;
      if (apres !== place && suite[apres] === affiche) return true;
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
        if (colleeAElleMeme(place, affiche)) continue;
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

  /** Les cases d'une colonne sur toute la période du mur, avec le
      haut et le bas de chacune : de quoi savoir lesquelles se
      chevauchent d'une colonne à l'autre. */
  function casesDeLaColonne(col, saut) {
    var liste = [];
    var total = col.cases * saut;
    for (var p = 0; p < total; p++) {
      var haut = col.decalage + p * col.pas;
      liste.push({ rang: p, haut: haut, bas: haut + col.height });
    }
    return liste;
  }

  /** Les cases des autres colonnes qui se retrouvent à la même
      hauteur qu'une des miennes. Le poids dit à quel point elles
      se regardent : deux cases qui se chevauchent entièrement
      comptent double de deux cases qui se frôlent, et une colonne
      lointaine compte moins que la voisine immédiate. */
  function faceAFace(colonne, mesCases, posees) {
    var liste = [];
    posees.forEach(function (autre) {
      var distance = Math.abs(colonne - autre.rang);
      if (!distance) return;
      mesCases.forEach(function (a) {
        autre.cases.forEach(function (b) {
          var recouvrement = Math.min(a.bas, b.bas) - Math.max(a.haut, b.haut);
          if (recouvrement <= 0) return;
          var part = recouvrement / Math.min(a.bas - a.haut, b.bas - b.haut);
          liste.push({
            moi: a.rang,
            autre: autre,
            sien: b.rang,
            poids: part / distance,
          });
        });
      });
    });
    return liste;
  }

  /** Ce que porte la case d'une colonne déjà posée. */
  function afficheDeLaCase(entree, rang) {
    return entree.suite[(rang + entree.depart) % entree.suite.length];
  }

  /** Le départ qui répète le moins les colonnes déjà posées à la
      même hauteur. À égalité, le plus petit : le mur reste le même
      d'un affichage à l'autre. */
  function meilleurDepart(suite, regards) {
    var longueur = suite.length;
    var meilleur = 0;
    var meilleurScore = Infinity;

    if (!regards.length) return { depart: 0, score: 0 };

    for (var d = 0; d < longueur; d++) {
      var score = 0;
      for (var i = 0; i < regards.length; i++) {
        var r = regards[i];
        if (suite[(r.moi + d) % longueur] === afficheDeLaCase(r.autre, r.sien)) score += r.poids;
      }
      if (score < meilleurScore - 0.0001) {
        meilleurScore = score;
        meilleur = d;
        if (score === 0) break;
      }
    }
    return { depart: meilleur, score: meilleurScore };
  }

  /* Construit le mur et renvoie de quoi lire chaque case :
     donne-moi la colonne, le rang de la case dans le cycle et le
     numéro de la copie, je te rends l'affiche. */
  function construire(items, g, saut) {
    var nombre = items.length;

    if (nombre < 2) {
      return function () {
        return items[0];
      };
    }

    /* Suite de dernier recours, quand aucune longueur n'admet de
       composition. */
    function suiteDeSecours(longueur) {
      var suite = [];
      for (var i = 0; i < longueur; i++) suite.push(i % nombre);
      return suite;
    }

    var colonnes = g.colonnes.map(function (col, rang) {
      return { col: col, rang: rang, cases: casesDeLaColonne(col, saut), suite: null, depart: 0 };
    });

    /* On règle chaque colonne à son tour, en la comparant à toutes
       celles qui sont déjà posées. Deuxième tour : chacune se
       reprend en voyant enfin ses deux côtés — c'est là que
       disparaissent les répétitions de part et d'autre du mur. */
    function reglerLaColonne(entree, posees) {
      var regards = faceAFace(entree.rang, entree.cases, posees);
      var meilleure = null;
      var longueurs = longueursPossibles(nombre, entree.col.cases, saut);
      for (var k = 0; k < longueurs.length; k++) {
        /* Toutes les longueurs n'admettent pas de suite : avec deux
           affiches, une suite de trois cases en boucle en répète
           forcément une. On passe simplement à la suivante. */
        var suite = composerLaSuite(nombre, longueurs[k]);
        if (!suite) continue;
        var essai = meilleurDepart(suite, regards);
        if (!meilleure || essai.score < meilleure.score - 0.0001) {
          meilleure = { suite: suite, depart: essai.depart, score: essai.score };
          if (essai.score === 0) break;
        }
      }
      if (!meilleure) meilleure = { suite: suiteDeSecours(longueurs[0]), depart: 0 };
      entree.suite = meilleure.suite;
      entree.depart = meilleure.depart;
    }

    colonnes.forEach(function (entree, i) {
      reglerLaColonne(entree, colonnes.slice(0, i));
    });
    colonnes.forEach(function (entree, i) {
      reglerLaColonne(
        entree,
        colonnes.filter(function (autre, j) {
          return j !== i;
        })
      );
    });

    return function (colonne, rang, copie) {
      var e = colonnes[colonne];
      if (!e) return items[0];
      return items[afficheDeLaCase(e, copie * e.col.cases + rang)];
    };
  }

  global.ZinemaHomeMur = { construire: construire };
})(window);
