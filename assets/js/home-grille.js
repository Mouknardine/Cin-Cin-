/* ============================================================
   Zinéma — accueil : la grille du mur d'affiches.

   Ce fichier ne décrit QUE la forme du mur : où se posent les
   cases, quelle taille elles font, et à quoi ressemble une case.
   Le défilement infini, lui, vit dans home.js.
   ============================================================ */
(function (global) {
  "use strict";

  /* Le mur est une grille de cases identiques, séparées par de
     larges espaces blancs (gap) : chaque affiche respire et se lit
     d'un coup d'œil. Les colonnes sont alignées entre elles — à
     l'arrivée, la première rangée se pose entière juste sous la
     barre de navigation, aucune affiche n'est coupée en haut de
     l'écran.

     Une case = l'affiche, puis la bande du titre en dessous. La
     bande a une hauteur fixe (voir .canvas-poster__title) : toutes
     les affiches ont donc exactement la même hauteur, qu'un titre
     tienne sur une ligne ou sur deux. Les valeurs sont en pixels
     de la grille de référence (designWidth), mise à l'échelle de
     l'écran ensuite.

     Règle à respecter si l'on retouche ces chiffres :
     perColumn × (caseHeight + gap) doit valoir exactement
     cycleHeight, sinon la boucle infinie saute au raccord. */

  /* Ordinateur : trois colonnes, deux rangées par cycle. */
  var desktop = {
    designWidth: 1200,
    cycleHeight: 1054,
    gap: 32,
    columnLefts: [106, 446, 786],
    columnWidth: 308,
    caseHeight: 495,
    perColumn: 2,
  };

  /* Mobile : deux colonnes, trois rangées par cycle, avec une
     marge blanche de chaque côté de l'écran. */
  var mobile = {
    designWidth: 400,
    cycleHeight: 942,
    gap: 16,
    columnLefts: [16, 208],
    columnWidth: 176,
    caseHeight: 298,
    perColumn: 3,
  };

  /* Colonnes → cases positionnées : chaque case est suivie d'un
     espace blanc (gap), le dernier faisant le raccord de boucle. */
  function buildSlots(config) {
    var slots = [];
    var pas = config.caseHeight + config.gap;
    config.columnLefts.forEach(function (left) {
      for (var i = 0; i < config.perColumn; i++) {
        slots.push({ left: left, top: i * pas, width: config.columnWidth, height: config.caseHeight });
      }
    });
    return slots;
  }
  desktop.slots = buildSlots(desktop);
  mobile.slots = buildSlots(mobile);

  /* Chaque affiche porte le titre du film juste en dessous, en
     permanence : on sait ce qu'on regarde sans avoir à survoler —
     et sur mobile, où l'on ne survole rien, c'est la seule façon
     de le savoir. */
  function caseHTML(root, item, priority) {
    var R = global.ZinemaRender;
    return (
      '<a href="' + root + item.href + '" class="canvas-poster">' +
      '<div class="canvas-poster__image">' +
      R.posterHTML(item, { priority: priority }) +
      '<span class="canvas-poster__plus">+</span></div>' +
      '<div class="canvas-poster__title">' + R.escapeHtml(item.title) + "</div></a>"
    );
  }

  /* Case de secours quand aucun film n'a d'affiche : le mur reste
     plein, il ne s'ouvre jamais sur du vide. */
  function caseVideHTML() {
    return '<div class="canvas-block"></div>';
  }

  global.ZinemaHomeGrille = {
    desktop: desktop,
    mobile: mobile,
    caseHTML: caseHTML,
    caseVideHTML: caseVideHTML,
  };
})(window);
