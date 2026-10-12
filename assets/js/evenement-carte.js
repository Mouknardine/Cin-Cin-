/* ============================================================
   Zinéma — le flyer d'un événement, qui se retourne d'un clic :
   le visuel devant, les informations derrière. C'est la vignette
   de la rangée de l'événement (evenement-rangee.js).

     recto                      verso (après un clic)
     ┌──────────────┐           ┌──────────────┐
     │              │           │ Le texte     │
     │    FLYER     │   ───▶    │ complet,     │
     │   entier     │           │ mis en forme │
     │              │           │ LIENS        │
     └──────────────┘           └──────────────┘

   Demandes du cinéma : la case prend la forme exacte du flyer, et
   l'information est cachée derrière (8 octobre 2026) ; ni « + » ni
   « × » : un clic suffit, et une taille modeste, dans une rangée
   comme un film, plutôt qu'un flyer étiré sur toute la largeur de
   l'écran (12 octobre 2026).

   Les proportions du flyer se lisent dans le nom du fichier que
   Sanity donne à chaque image (« image-…-2048x1478-jpg »), sans
   requête de plus. Un clic (ou Entrée, Espace) retourne la carte ;
   un second clic, ou Échap, la remet à l'endroit. Le côté caché
   est « inert » : ses liens ne reçoivent pas le focus et les
   lecteurs d'écran ne le lisent pas.
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;
  var C = global.ZinemaCouleurs;
  var Detail = global.ZinemaEvenementDetail;

  /* Le format d'une affiche de cinéma (largeur / hauteur), le même
     que --format-affiche dans style.css. */
  var FORMAT_AFFICHE = 1 / 1.41;

  /* Largeur / hauteur de l'image déposée dans le Studio, ou le
     format d'affiche si on ne peut pas la lire. */
  function proportions(image) {
    var ref = (R.hasRealImage(image) && (image.asset._ref || image.asset._id)) || "";
    var m = ref.match(/-(\d+)x(\d+)-\w+$/);
    if (!m || +m[1] === 0 || +m[2] === 0) return FORMAT_AFFICHE;
    return +m[1] / +m[2];
  }

  function rectoHTML(a, src) {
    var tailles = [400, 800, 1200]
      .map(function (l) { return R.escapeHtml(R.sanityImageUrl(a.image, l)) + " " + l + "w"; })
      .join(", ");
    return (
      '<img src="' + R.escapeHtml(src) + '" srcset="' + tailles +
      '" sizes="(min-width: 900px) 26rem, 100vw" alt="' + R.altDeLImage(a.image, a.title) +
      '" loading="lazy" decoding="async">'
    );
  }

  /** La carte, ou "" si l'événement n'a pas de visuel. */
  function html(a, index) {
    var src = R.sanityImageUrl(a.image, 800);
    if (!src) return "";
    var id = "carte-" + index;
    return (
      '<div class="m-carte ' + C.classe() + '" style="--r:' + proportions(a.image).toFixed(4) + '">' +
      '<div class="m-carte__pivot">' +
      '<button type="button" class="m-carte__face m-carte__recto" aria-expanded="false" ' +
      'aria-controls="' + id + '">' + rectoHTML(a, src) +
      '<span class="visually-hidden">, voir les informations</span></button>' +
      '<div class="m-carte__face m-carte__verso" id="' + id + '" tabindex="-1" inert>' +
      Detail.texteHTML(a) + Detail.liensHTML(a) +
      "</div></div></div>"
    );
  }

  function retourner(carte, ouverte) {
    var recto = carte.querySelector(".m-carte__recto");
    var verso = carte.querySelector(".m-carte__verso");
    carte.classList.toggle("est-retournee", ouverte);
    recto.setAttribute("aria-expanded", String(ouverte));
    recto.inert = ouverte;
    verso.inert = !ouverte;
    /* Le focus suit la face visible : sans cela, il resterait sur
       un bouton devenu invisible. */
    (ouverte ? verso : recto).focus({ preventScroll: true });
  }

  /* Un seul écouteur pour toutes les cartes de la page. Un lien du
     verso reste un lien : il ne retourne pas la carte. */
  function activer(conteneur) {
    conteneur.addEventListener("click", function (e) {
      var carte = e.target.closest(".m-carte");
      if (!carte || e.target.closest("a")) return;
      retourner(carte, !carte.classList.contains("est-retournee"));
    });
    conteneur.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var carte = e.target.closest(".m-carte.est-retournee");
      if (carte) retourner(carte, false);
    });
  }

  global.ZinemaEvenementCarte = {
    html: html,
    activer: activer,
  };
})(window);
