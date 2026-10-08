/* ============================================================
   Zinéma — un événement en « carte » qui se retourne, sur la
   page Événements.

   Le cinéma a demandé le 8 octobre 2026 : « il faudrait que la
   case prenne la forme exacte du flyer, en paysage ou en portrait,
   et que l'info soit cachée derrière : on la découvre en cliquant
   dessus ».

     recto                      verso (après un clic)
     ┌──────────────┐           ┌──────────────┐
     │              │           │ TYPE · DATE  │
     │   AFFICHE    │   ───▶    │ LE TITRE     │
     │   entière    │           │ Le texte…    │
     │              │           │ EN SAVOIR +  │
     └──────────────┘           └──────────────┘

   La case a EXACTEMENT les proportions de l'affiche : on les lit
   dans le nom du fichier que Sanity donne à chaque image
   (« image-…-1240x1754-jpg »), sans requête de plus. Sans visuel,
   la carte prend le format d'une affiche de cinéma, titre écrit.

   Un clic (ou Entrée, Espace) retourne la carte ; un second clic,
   ou Échap, la remet à l'endroit. Le côté caché est « inert » :
   ses liens ne reçoivent pas le focus et les lecteurs d'écran ne
   le lisent pas.
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

  function rectoHTML(a, index) {
    var src = R.sanityImageUrl(a.image, 1000);
    if (!src) {
      return '<span class="m-carte__titre-seul">' + R.escapeHtml(a.title) + "</span>";
    }
    /* Une affiche seule sur sa rangée occupe toute la largeur de
       l'écran : le navigateur choisit la taille qu'il lui faut. */
    var tailles = [600, 1000, 1600, 2400]
      .map(function (l) { return R.escapeHtml(R.sanityImageUrl(a.image, l)) + " " + l + "w"; })
      .join(", ");
    return (
      '<img src="' + R.escapeHtml(src) + '" srcset="' + tailles +
      '" sizes="100vw" alt="' + R.altDeLImage(a.image, a.title) +
      '" loading="' + (index === 0 ? "eager" : "lazy") + '" decoding="async">'
    );
  }

  /* « Tout lire » mène au détail (texte complet, films reliés),
     seulement s'il y a plus à lire que ce que dit le verso. */
  function liensHTML(a) {
    var racine = document.body.dataset.root || "";
    var liens = "";
    if (a.linkUrl) {
      liens +=
        '<a class="m-carte__lien" href="' + R.escapeHtml(a.linkUrl) +
        '" target="_blank" rel="noopener noreferrer">' +
        R.escapeHtml(a.linkLabel || "En savoir plus") + "</a>";
    }
    var plusALire = (Array.isArray(a.body) && a.body.length) || (a.films && a.films.length);
    if (plusALire) {
      liens +=
        '<a class="m-carte__lien" href="' + racine + "evenements/?e=" +
        encodeURIComponent(a.slug) + '">Tout lire</a>';
    }
    return liens ? '<p class="m-carte__liens">' + liens + "</p>" : "";
  }

  function versoHTML(a) {
    var type = Detail.categorie(a);
    return (
      '<p class="m-cell__label">' +
      R.escapeHtml([type, Detail.periode(a)].filter(Boolean).join(" · ")) + "</p>" +
      '<h2 class="m-carte__titre">' + R.escapeHtml(a.title) + "</h2>" +
      (a.excerpt ? '<p class="m-carte__texte">' + R.escapeHtml(a.excerpt) + "</p>" : "") +
      liensHTML(a)
    );
  }

  /* La carte entière. Le recto est un bouton : c'est lui qu'on
     active pour découvrir l'information. Le verso garde ses
     propres liens ; un clic ailleurs sur lui remet la carte à
     l'endroit. */
  function html(a, index) {
    var r = proportions(a.image);
    var id = "carte-" + index;
    return (
      '<div class="m-carte ' + C.classe() + '" style="--r:' + r.toFixed(4) + '">' +
      '<div class="m-carte__pivot">' +
      '<button type="button" class="m-carte__face m-carte__recto" aria-expanded="false" ' +
      'aria-controls="' + id + '">' + rectoHTML(a, index) +
      '<span class="m-carte__coin" aria-hidden="true">+</span>' +
      '<span class="visually-hidden">, voir les informations</span></button>' +
      '<div class="m-carte__face m-carte__verso" id="' + id + '" tabindex="-1" inert>' +
      versoHTML(a) + '<span class="m-carte__coin" aria-hidden="true">×</span>' +
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

  /* Un seul écouteur pour toutes les cartes de la page. */
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
    proportions: proportions,
  };
})(window);
