/* ============================================================
   Zinéma — la durée et la version d'un film, écrites de la même
   façon sur la liste des films (films.js) et sur la fiche d'un
   film (film.js).

   Demande du cinéma (12 octobre 2026) : « 94' » plutôt que
   « 94 min », et « VOstFR » d'un seul tenant, pour que la ligne de
   repères tienne sur une ligne au lieu de se couper au milieu de
   la version.
   ============================================================ */
(function (global) {
  "use strict";

  function texte(valeur) {
    return typeof valeur === "string" ? valeur.trim() : "";
  }

  /** « 94' », ou "" sans durée valable. */
  function duree(minutes) {
    var n = Number(minutes);
    return isFinite(n) && n > 0 ? Math.round(n) + "'" : "";
  }

  /** « VOstFR » : des sous-titres abrégés (« stFR », « st fr »)
      se collent à une version en sigle (« VO », « VF »). Écrits en
      toutes lettres (« sous-titrée français »), ou après une version
      en mots (« VO italien »), ils restent séparés d'une espace. */
  function version(langue, sousTitres) {
    var v = texte(langue);
    var st = texte(sousTitres);
    if (!st) return v;
    if (!v) return st;
    var sigle = !/\s/.test(v);
    var abrege = /^st(\b|[a-z])/i.test(st);
    return sigle && abrege ? v + st.replace(/\s+/g, "") : v + " " + st;
  }

  global.ZinemaReperesFilm = { duree: duree, version: version };
})(window);
