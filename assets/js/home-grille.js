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

     Une case = une affiche, rien d'autre. Sa hauteur suit le format
     d'une affiche de cinéma : c'est ce rapport qui fixe caseHeight
     à partir de columnWidth, pour qu'aucune affiche ne soit rognée
     sur les côtés. Les valeurs sont en pixels de la grille de
     référence (designWidth), mise à l'échelle de l'écran ensuite.

     Règle à respecter si l'on retouche ces chiffres :
     perColumn × (caseHeight + gap) doit valoir exactement
     cycleHeight, sinon la boucle infinie saute au raccord. */

  /* Ordinateur : trois colonnes, deux rangées par cycle. */
  var desktop = {
    designWidth: 1200,
    cycleHeight: 946, // 2 × (441 + 32)
    gap: 32,
    columnLefts: [106, 446, 786],
    columnWidth: 308,
    caseHeight: 441, // 308 de large : le format d'une affiche
    perColumn: 2,
  };

  /* Mobile : deux colonnes, trois rangées par cycle, avec une
     marge blanche de chaque côté de l'écran. */
  var mobile = {
    designWidth: 400,
    cycleHeight: 780, // 3 × (244 + 16)
    gap: 16,
    columnLefts: [16, 208],
    columnWidth: 176,
    caseHeight: 244, // 176 de large : le même format d'affiche
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

  /* L'affiche seule. Le titre reste porté par l'attribut « alt » de
     l'image : invisible à l'œil, il reste lu par les lecteurs
     d'écran et par les moteurs de recherche. */
  function caseHTML(root, item, priority) {
    var R = global.ZinemaRender;
    return (
      '<a href="' + root + item.href + '" class="canvas-poster">' +
      '<div class="canvas-poster__image">' +
      R.posterHTML(item, { priority: priority }) +
      '<span class="canvas-poster__plus">+</span></div></a>'
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
