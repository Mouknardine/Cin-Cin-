/* ============================================================
   Zinéma — apparition douce des blocs au scroll (équivalent
   simple, sans dépendance, de l'ancienne animation React).
   Ajouter la classe "reveal" à un élément (+ éventuellement
   data-delay="0.1" en secondes) : ce module se charge du reste.
   Se relance à chaque appel pour couvrir le contenu injecté
   dynamiquement après un chargement Sanity.
   ============================================================ */
(function (global) {
  "use strict";

  var observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "-10% 0px -10% 0px", threshold: 0 }
        )
      : null;

  function observeReveals(root) {
    var scope = root || document;
    var els = scope.querySelectorAll(".reveal:not(.is-visible)");
    els.forEach(function (el) {
      var delay = el.getAttribute("data-delay");
      if (delay) el.style.transitionDelay = delay + "s";
      if (observer) {
        observer.observe(el);
      } else {
        el.classList.add("is-visible");
      }
    });
  }

  global.ZinemaReveal = { observe: observeReveals };
})(window);
