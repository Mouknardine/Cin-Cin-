/* ============================================================
   Zinéma — en-tête + menu plein écran (identique sur chaque page)
   ============================================================ */
(function () {
  "use strict";

  /* `page` correspond au data-page du <body> (pour marquer la page courante),
     `color` est la couleur primaire de la case au survol sur ordinateur. */
  var navLinks = [
    { href: "films/", label: "Films", num: "01", page: "films", color: "blue" },
    { href: "agenda/", label: "Agenda", num: "02", page: "agenda", color: "red" },
    { href: "histoire/", label: "Histoire", num: "03", page: "histoire", color: "jaune" },
    { href: "annonces/", label: "Annonces", num: "04", page: "annonces", color: "blue" },
    { href: "infos-pratiques/", label: "Infos pratiques", num: "05", page: "infos-pratiques", color: "red" },
  ];

  /* Barre de navigation en cases (ordinateur uniquement, cachée en CSS
     sur mobile où le menu plein écran prend le relais). */
  function navBarHTML(root, currentPage) {
    var items = navLinks
      .map(function (link) {
        return (
          '<li class="nav-bar__item">' +
          '<a href="' + root + link.href + '" class="nav-bar__link nav-bar__link--' + link.color + '"' +
          (link.page === currentPage ? ' aria-current="page"' : "") +
          ">" + link.label + "</a></li>"
        );
      })
      .join("");
    return '<nav class="nav-bar" aria-label="Navigation principale"><ul class="nav-bar__list">' + items + "</ul></nav>";
  }

  function init() {
    var root = document.body.dataset.root || "";
    var isHome = document.body.dataset.page === "home";

    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML =
      '<a href="' + root + '" class="site-header__logo" aria-label="Zinéma — accueil">' +
      '<img src="' + root + 'assets/img/zinema-logo.png" alt="Zinéma" width="220" height="54">' +
      "</a>" +
      navBarHTML(root, document.body.dataset.page) +
      '<button type="button" class="menu-toggle" aria-expanded="false" aria-label="Ouvrir le menu">' +
      '<span class="menu-toggle__label">Menu</span>' +
      '<span class="menu-toggle__box">' +
      '<span class="menu-toggle__bar menu-toggle__bar--1"></span>' +
      '<span class="menu-toggle__bar menu-toggle__bar--2"></span>' +
      "</span></button>";

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
      "<span>Zinéma — Lausanne, cinéma indépendant depuis 2001</span>" +
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
      toggle.querySelector(".menu-toggle__label").textContent = open ? "Fermer" : "Menu";
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

    if (isHome) {
      header.classList.remove("site-header--inner");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
