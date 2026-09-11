/* ============================================================
   Zinéma — les quatre couleurs Mondrian (rouge, jaune, bleu,
   noir) tirées au hasard.

   Aucune couleur n'a de signification : une case n'est pas
   « bleue parce que c'est un lien ». À chaque affichage, chaque
   case reçoit une couleur au hasard — le site n'est jamais deux
   fois identique, comme un tableau qu'on repeindrait.

   Seule exception dans tout le site : le bouton d'achat, qui
   reste vert en permanence (voir --vert dans style.css).

   Le tirage passe par un « paquet » mélangé : les couleurs sont
   épuisées avant d'être remélangées, et deux cases voisines ne
   tombent jamais sur la même. L'ensemble reste donc équilibré,
   sans paquet de trois rouges d'affilée.
   ============================================================ */
(function (global) {
  "use strict";

  var COULEURS = ["rouge", "jaune", "bleu", "noir"];
  /* Les mêmes, sans le noir : pour les cases qui doivent rester
     distinctes d'une case noire voisine — les rangées de filtres,
     collées sous la barre de navigation dont la case de la page
     courante est noire. */
  var COULEURS_VIVES = ["rouge", "jaune", "bleu"];

  function melanger(liste) {
    var copie = liste.slice();
    for (var i = copie.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copie[i];
      copie[i] = copie[j];
      copie[j] = t;
    }
    return copie;
  }

  /* Un tireur = un paquet mélangé qui se réalimente tout seul.
     Chaque liste de couleurs a le sien : les deux tirages restent
     équilibrés chacun de leur côté. */
  function tireur(liste) {
    var paquet = [];
    var derniere = null;

    function remplirPaquet() {
      paquet = melanger(liste);
      /* Si le nouveau paquet commence par la couleur qui vient
         d'être servie, on décale d'un cran : jamais deux voisines
         identiques. */
      if (paquet.length > 1 && paquet[0] === derniere) {
        paquet.push(paquet.shift());
      }
    }

    return function () {
      if (paquet.length === 0) remplirPaquet();
      derniere = paquet.shift();
      return derniere;
    };
  }

  /* Nom de la couleur suivante ("rouge", "jaune", "bleu" ou "noir"). */
  var suivante = tireur(COULEURS);
  /* Idem, mais jamais "noir". */
  var suivanteVive = tireur(COULEURS_VIVES);

  /* Classes CSS à poser sur une case : `m-teinte c-rouge`.
     `c-…` définit --case-fond / --case-texte / --case-accent ;
     `m-teinte` fait que la case se remplit de cette couleur au
     survol (voir style.css). */
  function classe() {
    return "m-teinte c-" + suivante();
  }

  /* La même chose, en excluant le noir du tirage. */
  function classeVive() {
    return "m-teinte c-" + suivanteVive();
  }

  /* Une case qui garde sa couleur mais ne se remplit pas au survol.
     Pour les cases dont le contenu réagit déjà au pointeur (les
     pastilles de séances passent au vert) : deux réactions
     superposées brouilleraient le geste. La couleur est quand même
     tirée, pour ne pas décaler le tirage des cases suivantes. */
  function classeSansSurvol() {
    return "c-" + suivante();
  }

  /* Le même hasard, ouvert à autre chose que les couleurs : une
     liste de tailles de cases, par exemple. On obtient un tireur
     indépendant, avec les mêmes garanties — tout est servi avant
     d'être remélangé, jamais deux fois de suite la même valeur. */
  function tirage(liste) {
    return tireur(liste);
  }

  global.ZinemaCouleurs = {
    couleurs: COULEURS,
    suivante: suivante,
    tirage: tirage,
    classe: classe,
    classeVive: classeVive,
    classeSansSurvol: classeSansSurvol,
  };
})(window);
