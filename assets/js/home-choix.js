/* ============================================================
   Zinéma — accueil : ce qui monte sur le mur.

   Rien à cocher dans le Studio : publier un film ou un événement
   suffit à le voir apparaître. Ce fichier ne fait que trier et
   mettre en forme ; la géométrie du mur vit dans home-grille.js,
   la répartition dans home-mur.js et le défilement dans home.js.
   ============================================================ */
(function (global) {
  "use strict";

  /* Une affiche réellement déposée dans Sanity, par opposition à
     l'affiche typographique que le site dessine à partir du titre
     quand il n'y en a pas encore. */
  function isRealImage(image) {
    return window.ZinemaRender.hasRealImage(image);
  }

  /* Ce qui remonte sur l'accueil se décide tout seul, sans case à
     cocher dans le Studio :
       - les films à l'affiche d'abord, avant-premières ensuite,
         puis cycles et films annoncés ;
       - à statut égal, celui dont la prochaine séance est la plus
         proche passe devant ;
       - les événements en cours ou à venir qui ont un visuel.
     Publier un film ou un événement suffit donc à le voir apparaître. */
  var RANG_STATUT = { "a-laffiche": 0, "avant-premiere": 1, cycle: 2, prochainement: 3 };

  function prochaineSeanceParFilm(seances) {
    var parFilm = {};
    (seances || []).forEach(function (s) {
      if (!s.film || !s.film._id) return;
      var cle = s.film._id;
      var quand = s.date + " " + (s.time || "");
      if (!parFilm[cle] || quand < parFilm[cle]) parFilm[cle] = quand;
    });
    return parFilm;
  }

  function selection(films, evenements, seances) {
    var prochaine = prochaineSeanceParFilm(seances);

    var filmItems = (films || [])
      .filter(function (f) {
        return f.status !== "passe";
      })
      .sort(function (a, b) {
        /* Les films dont l'affiche est déposée passent devant : le
           mur montre d'abord de vraies affiches, et complète avec
           les affiches typographiques du site pour les films dont
           l'affiche n'est pas encore arrivée. */
        var ia = isRealImage(a.poster) ? 0 : 1;
        var ib = isRealImage(b.poster) ? 0 : 1;
        if (ia !== ib) return ia - ib;
        var ra = RANG_STATUT[a.status];
        var rb = RANG_STATUT[b.status];
        ra = ra === undefined ? 9 : ra;
        rb = rb === undefined ? 9 : rb;
        if (ra !== rb) return ra - rb;
        var pa = prochaine[a._id] || "9999";
        var pb = prochaine[b._id] || "9999";
        if (pa !== pb) return pa < pb ? -1 : 1;
        return String(a.title).localeCompare(String(b.title), "fr");
      })
      .slice(0, 10)
      .map(function (f) {
        return {
          title: f.title,
          poster: f.poster,
          /* Repris pour l'affiche typographique, qui écrit le titre,
             la réalisation et l'année. */
          director: f.director,
          year: f.year,
          slug: f.slug,
          href: "film/?s=" + encodeURIComponent(f.slug),
        };
      });

    var eventItems = (evenements || [])
      .filter(function (e) {
        return isRealImage(e.image);
      })
      .slice(0, 3)
      .map(function (e) {
        return { title: e.title, poster: e.image, href: "evenements/" };
      });

    return filmItems.concat(eventItems);
  }

  global.ZinemaHomeChoix = { selection: selection };
})(window);
