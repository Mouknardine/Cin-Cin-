/* ============================================================
   Zinéma — accueil : la forme du mur d'affiches.

   Ce fichier ne décrit QUE la géométrie du mur : la largeur des
   colonnes, la taille des cases, leur décalage. Le choix des
   affiches vit dans home-mur.js, le défilement infini dans
   home.js.

   Le mur suit la même règle que le reste du site : le trait qui
   sépare deux affiches est LE trait du site (--ligne, 4 pixels),
   et non une large bande noire. L'accueil se lit donc comme la
   page Films, en plus grand.

   Ce qui fait le Mondrian : les colonnes n'ont pas la même
   largeur, et chacune découpe le mur en un nombre de cases
   différent. Comme toutes les affiches gardent le format du site
   (1 sur 1,41), une colonne large porte de grandes affiches, une
   colonne étroite en porte davantage, plus petites. Aucune rangée
   ne s'aligne d'une colonne à l'autre. Un décalage vertical
   propre à chaque colonne achève de casser le quadrillage.

   La règle à ne pas casser : dans un cycle, chaque colonne compte
   exactement « cases » affiches, donc son pas vaut cycle / cases.
   C'est ce qui permet au mur de se répéter à l'infini sans que le
   raccord se voie, quelles que soient les largeurs.
   ============================================================ */
(function (global) {
  "use strict";

  /* Le trait du site. Même valeur que --ligne dans style.css :
     ces deux chiffres doivent rester d'accord. */
  var LIGNE = 4;

  /* Le format d'affiche du site (--format-affiche) : une case fait
     1,41 fois plus haut que large. */
  var FORMAT = 1.41;

  /* Combien de colonnes selon la largeur de l'écran, et combien
     d'affiches chacune porte dans un cycle. Deux nombres de cases
     qui alternent suffisent à décaler toutes les rangées ; un
     troisième nombre rendrait les colonnes trop inégales. */
  var PALIERS = [
    { min: 0, cases: [3, 4] },
    { min: 768, cases: [3, 4, 3] },
    { min: 1200, cases: [3, 4, 3, 4] },
    { min: 1800, cases: [4, 5, 4, 5, 4] },
  ];

  /* Le décalage vertical de chaque colonne, en fraction de son
     propre pas. La première reste calée sur le haut du mur : à
     l'arrivée sur le site, une affiche au moins se pose entière
     juste sous la barre de navigation, et l'œil a un point
     d'accroche. Les suivantes glissent. */
  var DECALAGES = [0, 0.44, 0.16, 0.62, 0.3];

  function palierPour(largeur) {
    var choix = PALIERS[0];
    for (var i = 0; i < PALIERS.length; i++) {
      if (largeur >= PALIERS[i].min) choix = PALIERS[i];
    }
    return choix;
  }

  /* La géométrie du mur pour une largeur d'écran donnée.

     La hauteur du cycle se déduit des contraintes, elle ne se
     choisit pas : chaque colonne c porte n(c) affiches de hauteur
     cycle / n(c) − ligne, donc de largeur (cycle / n(c) − ligne)
     / 1,41 ; et la somme des largeurs plus les traits doit faire
     exactement la largeur de l'écran. On isole « cycle ». */
  function grille(largeur) {
    var cases = palierPour(largeur).cases;
    var nbColonnes = cases.length;
    var utile = largeur - (nbColonnes + 1) * LIGNE;

    var sommeInverses = 0;
    cases.forEach(function (n) {
      sommeInverses += 1 / n;
    });
    var cycle = (FORMAT * utile + nbColonnes * LIGNE) / sommeInverses;

    /* Les bords se calculent en virgule flottante puis s'arrondissent
       au pixel : sans cela, un liséré noir d'un demi-pixel traînerait
       entre deux colonnes. La dernière colonne se cale sur le bord
       droit de l'écran. */
    var colonnes = [];
    var bord = LIGNE;
    for (var c = 0; c < nbColonnes; c++) {
      var n = cases[c];
      var pas = cycle / n;
      var hauteur = pas - LIGNE;
      var bordSuivant = bord + hauteur / FORMAT;
      var gauche = Math.round(bord);
      var droite = c === nbColonnes - 1 ? Math.round(largeur - LIGNE) : Math.round(bordSuivant);
      colonnes.push({
        left: gauche,
        width: Math.max(1, droite - gauche),
        height: hauteur,
        cases: n,
        pas: pas,
        decalage: DECALAGES[c % DECALAGES.length] * pas,
      });
      bord = bordSuivant + LIGNE;
    }

    var debord = 0;
    colonnes.forEach(function (col) {
      if (col.decalage > debord) debord = col.decalage;
    });

    return { cycle: cycle, colonnes: colonnes, ligne: LIGNE, debord: debord };
  }

  /* Les cases d'un cycle, prêtes à être posées. Une case qui
     dépasse en bas du cycle n'est pas un problème : la copie
     suivante porte exactement le même trou en haut de cette
     colonne, les deux s'emboîtent à un trait près. */
  function casesDuCycle(g) {
    var liste = [];
    g.colonnes.forEach(function (col, c) {
      for (var i = 0; i < col.cases; i++) {
        liste.push({
          colonne: c,
          rang: i,
          left: col.left,
          width: col.width,
          top: col.decalage + i * col.pas,
          height: col.height,
        });
      }
    });
    return liste;
  }

  /* L'affiche seule, rien par-dessus. Le titre reste porté par
     l'attribut « alt » de l'image : invisible à l'œil, il reste lu
     par les lecteurs d'écran et par les moteurs de recherche. Au
     survol, l'affiche grossit légèrement dans son cadre : c'est le
     seul signe qu'elle est cliquable, et il suffit. */
  function caseHTML(root, item, priority) {
    var R = global.ZinemaRender;
    return (
      '<a href="' + root + item.href + '" class="canvas-poster">' +
      '<div class="canvas-poster__image">' +
      R.posterHTML(item, { priority: priority }) +
      "</div></a>"
    );
  }

  global.ZinemaHomeGrille = {
    grille: grille,
    casesDuCycle: casesDuCycle,
    caseHTML: caseHTML,
  };
})(window);
