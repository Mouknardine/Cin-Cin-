/* ============================================================
   Zinéma — en-tête + menu plein écran (identique sur chaque page,
   accueil compris : c'est le seul repère de navigation du site,
   il doit être au même endroit partout)

   Le logo reste toujours tout à gauche et ramène à l'accueil ;
   les six rubriques suivent, dans l'ordre du menu.
   Les couleurs des cases sont tirées au hasard (couleurs.js) :
   aucune rubrique n'a « sa » couleur attitrée.
   ============================================================ */
(function () {
  "use strict";

  /* `page` correspond au data-page du <body> (pour marquer la page courante). */
  var navLinks = [
    { href: "films/", label: "Films", num: "01", page: "films" },
    { href: "agenda/", label: "Agenda", num: "02", page: "agenda" },
    { href: "evenements/", label: "Événement", num: "03", page: "evenements" },
    { href: "histoire/", label: "Histoire", num: "04", page: "histoire" },
    { href: "membership/", label: "Membership", num: "05", page: "membership" },
    { href: "contact/", label: "Contact", num: "06", page: "contact" },
  ];

  /* Barre de navigation en cases (ordinateur uniquement, cachée en CSS
     sur mobile où le menu plein écran prend le relais). */
  function navBarHTML(root, currentPage) {
    var items = navLinks
      .map(function (link) {
        return (
          '<li class="nav-bar__item">' +
          '<a href="' + root + link.href + '" class="nav-bar__link ' + window.ZinemaCouleurs.classe() + '"' +
          (link.page === currentPage ? ' aria-current="page"' : "") +
          ">" + link.label + "</a></li>"
        );
      })
      .join("");
    return '<nav class="nav-bar" aria-label="Navigation principale"><ul class="nav-bar__list">' + items + "</ul></nav>";
  }

  /* Le titre de l'onglet du navigateur et la description qui
     apparaît dans Google se règlent page par page dans le Studio
     (« Pages du site »). Les valeurs écrites dans le fichier HTML
     servent de point de départ : tant qu'un champ est vide dans
     Sanity, on ne touche à rien. */
  function poserMeta(attribut, nom, contenu) {
    if (!contenu) return;
    var meta = document.head.querySelector("meta[" + attribut + '="' + nom + '"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attribut, nom);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", contenu);
  }

  function poserTitreEtDescription(pageId) {
    var D = window.ZinemaData;
    var R = window.ZinemaRender;
    if (!D || !R || !pageId) return;
    Promise.all([D.getPage(pageId), D.getReglages()]).then(function (r) {
      var page = r[0];
      var reglages = D.estUneErreur(r[1]) ? null : r[1];

      if (page && page.titre) {
        document.title = page.titre;
        poserMeta("property", "og:title", page.titre);
      }
      if (page && page.seoDescription) {
        poserMeta("name", "description", page.seoDescription);
        poserMeta("property", "og:description", page.seoDescription);
      }

      /* L'image qui s'affiche quand quelqu'un partage l'adresse du
         cinéma sur WhatsApp, Facebook ou Instagram — réglée dans
         « Réglages du cinéma → Identité ». */
      var partage = R.sanityImageUrl(reglages && reglages.shareImage, 1200);
      if (partage) {
        poserMeta("property", "og:image", partage);
        poserMeta("name", "twitter:card", "summary_large_image");
      }
      poserMeta("property", "og:type", "website");
      /* L'adresse exacte de la page ouverte : sur une fiche de film,
         elle porte le film (…/film/?s=…), ce que le fichier HTML seul
         ne peut pas savoir. */
      var adresse = window.location.href.split("#")[0];
      poserMeta("property", "og:url", adresse);
      /* Le canonical suit la page réellement ouverte. Sur une fiche de
         film il porte le film ; sans cela toutes les fiches se
         déclareraient identiques et Google n'en garderait qu'une. */
      var canonique = document.head.querySelector('link[rel="canonical"]');
      if (!canonique) {
        canonique = document.createElement("link");
        canonique.setAttribute("rel", "canonical");
        document.head.appendChild(canonique);
      }
      canonique.setAttribute("href", adresse);
    });
  }

  /* Pose le logo une seule fois, quand on sait lequel afficher :
     celui déposé dans Sanity, sinon celui livré avec le site. */
  function poserLogo(img, root) {
    var D = window.ZinemaData;
    var R = window.ZinemaRender;
    if (!D || !R) return;
    D.getReglages().then(function (reglages) {
      var logo = !D.estUneErreur(reglages) && reglages ? reglages.logo : null;
      var src = R.sanityImageUrl(logo, 440) || root + "assets/img/zinema-logo.png";
      img.alt = (logo && logo.alt) || "Zinéma";
      img.src = src;
      img.style.visibility = "visible";
    });
  }

  function init() {
    var root = document.body.dataset.root || "";

    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML =
      /* Le logo se règle dans « Réglages du cinéma → Identité ».
         L'emplacement est réservé aux bonnes dimensions et l'image
         n'est posée qu'une fois : on ne voit donc jamais un logo
         remplacé par un autre sous les yeux du visiteur, et la
         page ne saute pas. */
      '<a href="' + root + '" class="site-header__logo" aria-label="Zinéma — accueil">' +
      '<img alt="Zinéma" width="220" height="54" style="visibility:hidden">' +
      "</a>" +
      navBarHTML(root, document.body.dataset.page) +
      /* Pas de mot « Menu » à côté du bouton : le carré et ses deux
         barres suffisent. L'intitulé reste porté par aria-label,
         pour les lecteurs d'écran. */
      '<button type="button" class="menu-toggle" aria-expanded="false" aria-label="Ouvrir le menu">' +
      '<span class="menu-toggle__box">' +
      '<span class="menu-toggle__bar menu-toggle__bar--1"></span>' +
      '<span class="menu-toggle__bar menu-toggle__bar--2"></span>' +
      "</span></button>";

    poserLogo(header.querySelector(".site-header__logo img"), root);
    poserTitreEtDescription(document.body.dataset.page);

    var nav = document.createElement("nav");
    nav.className = "main-nav";
    var itemsHTML = navLinks
      .map(function (link, i) {
        return (
          '<li class="main-nav__item" style="transition-delay:' + (0.08 + i * 0.05) + 's">' +
          '<a href="' + root + link.href + '" class="main-nav__link font-display">' +
          '<span class="main-nav__link-label">' + link.label + "</span>" +
          '<span class="main-nav__link-num">' + link.num + "</span>" +
          "</a></li>"
        );
      })
      .join("");
    nav.innerHTML =
      '<ul class="main-nav__list">' + itemsHTML + "</ul>" +
      '<div class="main-nav__footer font-display">' +
      "<span>Zinéma — Lausanne, salle de cinéma fondée en juin 2001</span>" +
      '<a href="' + root + 'agenda/" class="underline-hover">Voir les séances de la semaine →</a>' +
      "</div>";

    document.body.insertBefore(nav, document.body.firstChild);
    document.body.insertBefore(header, document.body.firstChild);

    var toggle = header.querySelector(".menu-toggle");
    var open = false;
    function setOpen(next) {
      open = next;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      nav.classList.toggle("is-open", open);
      document.documentElement.style.overflow = open ? "hidden" : "";
    }
    toggle.addEventListener("click", function () {
      setOpen(!open);
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
