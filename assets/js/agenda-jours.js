/* ============================================================
   Zinéma — les jours de l'agenda : les séances, et les cases sans
   film posées dans la grille du Studio — « Vacances », « Projection
   privée » (demande du cinéma, 18 novembre 2026).

   Un jour sans séance, mais marqué, apparaît quand même : c'est tout
   l'intérêt. L'agenda dit qu'il n'y a pas de film ce jour-là, au lieu
   de sauter la date sans explication.

     - un genre qui ferme toute la journée (« Vacances ») s'annonce
       une seule fois, en tête du jour, sans heure ni salle — même si
       plusieurs cases du jour en portent l'étiquette ;
     - les autres (« Projection privée ») prennent leur place parmi
       les séances, à leur heure et dans leur salle, rangées comme
       elles.

   Ce fichier ne dessine rien : il range. Il se vérifie sans
   navigateur (verifications/cases-sans-film.mjs).
   ============================================================ */
(function (global) {
  "use strict";

  /* Les genres qui ferment toute la journée. La même liste existe côté
     Studio (sanity/casesSansFilm.ts) : la vérification compare les deux. */
  var TOUT_LE_JOUR = ["Vacances"];

  function prendToutLeJour(libelle) {
    return TOUT_LE_JOUR.indexOf(libelle) !== -1;
  }

  /* seances : les séances publiées, au format du site (date, time, room…).
     cases   : les cases sans film publiées (date, time, room, libelle).
     trier   : l'ordre du programme (ZinemaData.trierSeances).

     Renvoie les jours dans l'ordre des dates :
       { date, journee: ["Vacances"], screenings: [séances et cases à leur heure] }
     Une case à son heure porte sansFilm: true. */
  function composerLesJours(seances, cases, trier) {
    var parDate = {};
    function jour(date) {
      if (!parDate[date]) parDate[date] = { journee: [], screenings: [] };
      return parDate[date];
    }

    (Array.isArray(seances) ? seances : []).forEach(function (seance) {
      if (seance && seance.date) jour(seance.date).screenings.push(seance);
    });

    (Array.isArray(cases) ? cases : []).forEach(function (marque) {
      if (!marque || !marque.date || typeof marque.libelle !== "string" || !marque.libelle) return;
      var duJour = jour(marque.date);
      if (prendToutLeJour(marque.libelle)) {
        if (duJour.journee.indexOf(marque.libelle) === -1) duJour.journee.push(marque.libelle);
        return;
      }
      duJour.screenings.push({
        sansFilm: true,
        libelle: marque.libelle,
        date: marque.date,
        time: marque.time,
        room: marque.room,
      });
    });

    return Object.keys(parDate)
      .sort()
      .map(function (date) {
        return {
          date: date,
          journee: parDate[date].journee,
          screenings: trier(parDate[date].screenings),
        };
      });
  }

  global.ZinemaAgendaJours = {
    TOUT_LE_JOUR: TOUT_LE_JOUR,
    composerLesJours: composerLesJours,
  };
})(window);
