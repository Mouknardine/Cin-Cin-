/* ============================================================
   Minimum — le contenu de chaque page, en tableaux Mondrian
   (comme le Zinéma). Aucune page n'a de bandeau décoratif : un
   tableau de cases, séparées par le même trait de 4 px.
   ============================================================ */
(function () {
  "use strict";
  var M = window.Minimum;
  var D = M.D;
  var C = D.config;
  var K = M.K;
  var esc = M.esc;
  var P = M.pages;
  var R = M.root;

  function tete(etiquette, titre, sous) {
    return '<div class="m-titre"><p class="m-cell__label">' + esc(etiquette) + "</p><h1>" + esc(titre) + "</h1>" +
      (sous ? '<p class="m-sous">' + esc(sous) + "</p>" : "") + "</div>";
  }
  function vide(t) { return '<p class="m-vide">' + esc(t) + "</p>"; }
  function cellule(label, valeur, extra) {
    return '<div class="m-cell ' + K.classe() + (extra ? " " + extra : "") + '"><span class="m-cell__label">' + esc(label) + '</span><span class="m-cell__value">' + valeur + "</span></div>";
  }
  function carteFilm(f, i) {
    return '<a class="m-film" href="' + R + "film/?id=" + esc(f.id) + '">' +
      '<div class="m-film__affiche">' + M.affiche(f, i > 3) + "</div>" +
      '<div class="m-cell m-film__entete ' + K.classe() + '"><span class="m-film__titre">' + esc(f.titre) + "</span>" +
      '<span class="m-film__infos">' + esc(f.realisateur) + "</span></div>" +
      '<div class="m-cell m-film__plus ' + K.classe() + '"><span class="m-film__infos">' + esc(f.genre) + " · " + esc(f.pays) + " · " + f.annee + " · " + f.duree + " min · " + esc(f.langue) + "</span></div></a>";
  }
  function celluleSuite(href, label, nom) {
    return '<a class="m-film m-film--plus" href="' + href + '"><div class="m-cell ' + K.classe() + '"><span class="m-cell__label">' + label + '</span><span class="m-monde__nom">' + nom + " →</span></div></a>";
  }
  function defile() {
    var mots = ["Cinéma", "Radio", "Club", "Minimum", "Neuchâtel"];
    var un = mots.map(function (m) { return "<span>" + m + "</span>"; }).join("");
    return '<div class="m-bande"><div class="m-defile" aria-hidden="true"><div class="m-defile__piste">' + un + un + un + un + un + un + "</div></div></div>";
  }

  /* ------------------------- Accueil ------------------------- */
  P.home = function (app) {
    var sem = M.semaine();
    var jourIdx = 0, prog = [];
    for (; jourIdx < 7; jourIdx++) { prog = M.programmeDuJour(sem[jourIdx]); if (prog.length) break; }
    var d = sem[Math.min(jourIdx, 6)];
    var cine = M.programmeDuJour(d, "cinema");
    var vedette = cine.length ? M.filmParId(cine[0].href.split("id=")[1]) : D.films[0];
    var prochaines = cine.length ? cine : [];
    var a = M.antenne();
    var prochainClub = null, pj = 0;
    for (; pj < 7 && !prochainClub; pj++) { var s = M.programmeDuJour(sem[pj], "club"); if (s.length) prochainClub = { d: sem[pj], i: pj, s: s[0] }; }

    var cinema =
      '<a class="m-monde m-monde--cinema ' + K.classe() + '" href="' + R + 'cinema/">' +
      '<div><p class="m-monde__label">Cinéma · ' + esc(M.labelJour(d, jourIdx)) + '</p><p class="m-monde__nom">Cinéma</p></div>' +
      '<div class="m-monde__affiche">' + M.affiche(vedette) + "</div>" +
      '<p class="m-monde__texte">' + esc(vedette.titre) + (cine.length ? " — " + M.heureAffichee(cine[0].heure) : "") + "</p></a>";
    var radio =
      '<a class="m-monde ' + K.classe() + '" href="' + R + 'radio/">' +
      '<div><p class="m-monde__label">' + M.voyant(a) + '</p><p class="m-monde__nom">Radio</p></div>' +
      '<p class="m-monde__texte">' + (a.emission ? (a.direct ? "" : esc(a.quand) + " " + M.heureAffichee(a.emission.heure) + " — ") + esc(a.emission.titre) : "Bientôt à l'antenne.") + "</p></a>";
    var club =
      '<a class="m-monde ' + K.classe() + '" href="' + R + 'club/">' +
      '<div><p class="m-monde__label">Club</p><p class="m-monde__nom">Club</p></div>' +
      '<p class="m-monde__texte">' + (prochainClub ? esc(M.labelJour(prochainClub.d, prochainClub.i)) + " " + M.heureAffichee(prochainClub.s.heure) + " — " + esc(prochainClub.s.titre) : "Prochaine soirée bientôt annoncée.") + "</p></a>";

    app.innerHTML =
      '<div class="mondrian">' +
      '<h1 class="visually-hidden">Cinéma Minimum — cinéma, radio et club à Neuchâtel</h1>' +
      '<div class="m-trois">' + cinema + radio + club + "</div>" +
      defile() +
      '<div class="m-titre"><p class="m-cell__label">Au programme</p><h2>' + esc(M.labelJour(d, jourIdx)) + "</h2><p class=\"m-sous\">" + esc(M.dateLongue(d)) + "</p></div>" +
      (prog.length ? M.liste(prog) : vide("Rien au programme pour l'instant.")) +
      '<a class="m-action ' + K.classe() + '" href="' + R + 'agenda/">Toute la semaine</a>' +
      '<div class="m-titre"><p class="m-cell__label">Cinéma</p><h2>À l\'affiche</h2></div>' +
      '<div class="m-films">' + D.films.map(function (f, i) { return carteFilm(f, i); }).join("") + celluleSuite(R + "cinema/", "Cinéma", "Tous les films") + "</div>" +
      "</div>";
  };

  /* ------------------------- Cinéma -------------------------- */
  P.cinema = function (app) {
    app.innerHTML =
      '<div class="mondrian">' +
      tete("Cinéma", "À l'affiche", "Salle Anaïs Emery, à La Case à Chocs. Films en version originale sous-titrée français (VOSTFR) ou en français (VF).") +
      '<div class="m-films">' + D.films.map(function (f, i) { return carteFilm(f, i); }).join("") + celluleSuite(R + "agenda/?type=cinema", "Cinéma", "Toutes les séances") + "</div>" +
      '<div class="m-titre"><p class="m-cell__label">Billets</p><h2>Tarifs</h2></div>' +
      '<div class="m-bande">' + D.tarifs.map(function (t) {
        return '<div class="m-cell ' + K.classe() + '"><span class="m-cell__label">' + esc(t.nom) + '</span><span class="m-cell__value">CHF ' + esc(t.prix) + "</span>" + (t.note ? "<span>" + esc(t.note) + "</span>" : "") + "</div>";
      }).join("") + "</div>" +
      '<div class="m-bande"><div class="m-cell ' + K.classe() + '"><span class="m-cell__label">Réservation</span><span class="m-cell__value">' + esc(C.billets) + '</span></div>' +
      '<div class="m-cell ' + K.classe() + '"><span class="m-cell__label">Paiement</span><span class="m-cell__value">' + esc(C.paiement) + "</span></div></div></div>";
  };

  /* --------------------------- Film -------------------------- */
  P.film = function (app) {
    var f = M.filmParId(new URLSearchParams(location.search).get("id"));
    if (!f) {
      app.innerHTML = '<div class="mondrian">' + tete("Cinéma", "Film introuvable", "Il a peut-être quitté l'affiche.") +
        '<a class="m-action ' + K.classe() + '" href="' + R + 'cinema/">Voir les films</a></div>';
      return;
    }
    document.title = f.titre + " — Cinéma Minimum";
    var auj = new Date(); auj.setHours(0, 0, 0, 0);
    var lignes = f.seances.filter(function (x) { return new Date(x[0] + "T12:00:00") >= auj; }).map(function (x) {
      var d = new Date(x[0] + "T12:00:00");
      return '<div class="m-seance"><div class="m-seance__heure ' + K.classe() + '" style="flex-basis:auto;padding-inline:1.5rem">' + esc(M.dateLongue(d)) + "</div>" +
        '<div class="m-seance__heure ' + K.classe() + '">' + M.heureAffichee(x[1]) + "</div>" +
        '<div class="m-seance__infos ' + K.classe() + '"><span class="m-seance__sous">' + esc(f.langue) + "</span></div></div>";
    }).join("");
    app.innerHTML =
      '<div class="mondrian">' +
      '<div class="m-fiche"><div class="m-fiche__affiche">' + M.affiche(f) + "</div>" +
      '<div class="m-fiche__colonne">' +
      tete(f.genre, f.titre, "de " + f.realisateur) +
      (f.mention ? '<div class="m-cell ' + K.classe() + '"><span class="m-cell__value">' + esc(f.mention) + "</span></div>" : "") +
      '<div class="m-bande">' +
      cellule("Pays", esc(f.pays)) + cellule("Année", f.annee) + cellule("Durée", f.duree + " min") + cellule("Version", esc(f.langue)) + cellule("Âge", esc(f.age)) + "</div>" +
      '<div class="m-cell"><span class="m-cell__label">Synopsis</span><p>' + esc(f.synopsis) + "</p></div>" +
      '<div class="m-bande">' +
      (f.bandeAnnonce ? '<a class="m-cell m-ba ' + K.classe() + '" href="' + esc(f.bandeAnnonce) + '" target="_blank" rel="noopener noreferrer">Bande-annonce ↗</a>' : "") +
      (f.lien ? '<a class="m-cell m-ba ' + K.classe() + '" href="' + esc(f.lien) + '" target="_blank" rel="noopener noreferrer">En savoir plus ↗</a>' : "") + "</div>" +
      "</div></div>" +
      '<div class="m-titre"><p class="m-cell__label">Séances</p><h2>À venir</h2></div>' +
      (lignes ? '<div class="m-seances-liste">' + lignes + "</div>" : vide("Plus de séance annoncée pour ce film.")) +
      '<div class="m-bande"><div class="m-cell ' + K.classe() + '"><span class="m-cell__label">Billets</span><span class="m-cell__value">' + esc(C.billets) + " " + esc(C.paiement) + "</span></div></div>" +
      '<a class="m-action ' + K.classe() + '" href="' + R + 'cinema/">← Tous les films</a></div>';
  };

  /* ---------------------------- Club ------------------------- */
  P.club = function (app) {
    var sem = M.semaine(), items = [];
    sem.forEach(function (d, i) { M.programmeDuJour(d, "club").forEach(function (p) { items.push({ d: d, i: i, p: p }); }); });
    app.innerHTML =
      '<div class="mondrian">' +
      tete("Club", "Les nuits", "Musique, lumière, sueur. Après le film, après la radio.") +
      '<div class="m-titre"><p class="m-cell__label">Cette semaine</p><h2>Prochaines soirées</h2></div>' +
      (items.length ? '<div class="m-seances-liste">' + items.map(function (x) {
        return '<div class="m-seance"><div class="m-seance__heure ' + K.classe() + '" style="flex-basis:12rem">' + esc(M.labelJour(x.d, x.i)) + " " + M.dateCourte(x.d) + "</div>" +
          '<div class="m-seance__heure ' + K.classe() + '">' + M.heureAffichee(x.p.heure) + "</div>" +
          '<div class="m-seance__infos ' + K.classe() + '"><span class="m-seance__titre">' + esc(x.p.titre) + '</span><span class="m-seance__sous">' + esc(x.p.sous) + "</span></div></div>";
      }).join("") + "</div>" : vide("Pas de soirée cette semaine. La prochaine sera annoncée ici.")) +
      '<div class="m-bande">' + cellule("Entrée", esc(C.clubEntree)) + cellule("Ouverture des portes", esc(C.clubPorte)) + cellule("Adresse", C.adresse.map(esc).join("<br>")) + "</div>" +
      '<div class="m-cell ' + K.classe() + '"><span class="m-cell__label">Ici, on se tient bien</span><p>' + esc(C.clubRegles) + "</p></div>" +
      "</div>";
  };

  /* -------------------------- Agenda ------------------------- */
  P.agenda = function (app) {
    var sem = M.semaine();
    var jour = 0, type = "tout";
    var q = new URLSearchParams(location.search);
    if (q.get("jour") !== null && +q.get("jour") >= 0 && +q.get("jour") < 7) jour = +q.get("jour");
    if (["cinema", "radio", "club"].indexOf(q.get("type")) >= 0) type = q.get("type");

    app.innerHTML = '<div class="mondrian"><div class="m-filtres" id="types"></div><div class="m-filtres" id="jours"></div>' +
      '<p class="m-jour-actif" id="titreJour"></p><div id="programme"></div></div>';
    var types = document.getElementById("types"), jours = document.getElementById("jours");
    types.innerHTML = [["tout", "Tout"], ["cinema", "Cinéma"], ["radio", "Radio"], ["club", "Club"]].map(function (t) {
      return '<button type="button" class="m-filtre ' + K.classeVive() + '" data-t="' + t[0] + '">' + t[1] + "</button>";
    }).join("");
    jours.innerHTML = sem.map(function (d, i) {
      return '<button type="button" class="m-filtre m-filtre--jour ' + K.classeVive() + '" data-i="' + i + '"><span class="m-jour__dow">' + esc(M.labelJour(d, i)) + '</span><span class="m-jour__num">' + M.dateCourte(d) + "</span></button>";
    }).join("");

    function montre() {
      Array.prototype.forEach.call(types.children, function (b) { b.classList.toggle("is-active", b.dataset.t === type); });
      Array.prototype.forEach.call(jours.children, function (b) { b.classList.toggle("is-active", +b.dataset.i === jour); });
      document.getElementById("titreJour").textContent = M.dateLongue(sem[jour]);
      var p = M.programmeDuJour(sem[jour], type);
      document.getElementById("programme").innerHTML = p.length ? M.liste(p) : vide("Rien au programme ce jour-là.");
    }
    types.addEventListener("click", function (e) { var b = e.target.closest(".m-filtre"); if (b) { type = b.dataset.t; montre(); } });
    jours.addEventListener("click", function (e) { var b = e.target.closest(".m-filtre"); if (b) { jour = +b.dataset.i; montre(); } });
    montre();
  };

  /* ------------------------- Location ------------------------ */
  P.location = function (app) {
    app.innerHTML =
      '<div class="mondrian">' + tete("Location", "Louer la salle", D.location.texte) +
      '<div class="m-bande"><img class="m-budgette" src="' + R + 'assets/img/budgette.jpg" alt="Budgette — Rent your own Private Cinema" width="606" height="341">' +
      '<img class="m-budgette" src="' + R + 'assets/img/salle.jpg" alt="La salle rouge du Minimum" width="603" height="401"></div>' +
      '<form id="formLoc" novalidate><div class="m-bande">' +
      '<div class="m-champ"><label for="f-nom">Nom</label><input id="f-nom" name="nom" required autocomplete="name"></div>' +
      '<div class="m-champ"><label for="f-mail">Courriel</label><input id="f-mail" name="courriel" type="email" required autocomplete="email"></div></div>' +
      '<div class="m-bande"><div class="m-champ"><label for="f-date">Date souhaitée</label><input id="f-date" name="date" type="date"></div>' +
      '<div class="m-champ"><label for="f-nb">Nombre de personnes (6 à 40)</label><input id="f-nb" name="nb" type="number" min="6" max="40" inputmode="numeric"></div></div>' +
      '<div class="m-champ"><label for="f-msg">Le film de votre choix</label><textarea id="f-msg" name="msg" rows="5"></textarea></div>' +
      '<button class="m-action ' + K.classe() + '" type="submit" style="width:100%">Envoyer la demande</button>' +
      '<p class="m-etat" role="status" id="etat"></p></form></div>';
    var f = document.getElementById("formLoc");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = new FormData(f);
      if (!v.get("nom") || !/.+@.+\..+/.test(v.get("courriel") || "")) {
        document.getElementById("etat").textContent = "Merci d'indiquer votre nom et un courriel valide.";
        return;
      }
      var corps = "Nom : " + v.get("nom") + "\nCourriel : " + v.get("courriel") + "\nDate : " + (v.get("date") || "—") + "\nPersonnes : " + (v.get("nb") || "—") + "\n\n" + (v.get("msg") || "");
      location.href = "mailto:" + C.courriel + "?subject=" + encodeURIComponent("Demande de projection privée") + "&body=" + encodeURIComponent(corps);
      document.getElementById("etat").textContent = "Votre messagerie s'ouvre : il ne reste qu'à envoyer.";
    });
  };

  /* --------------------------- Infos ------------------------- */
  P.infos = function (app) {
    var c = [
      cellule("Adresse", C.adresse.map(esc).join("<br>")),
      cellule("Lieu", esc(C.lieu) + "<br>" + esc(C.salle)),
      '<a class="m-cell ' + K.classe() + '" href="tel:' + esc(C.telephone.replace(/\s/g, "")) + '"><span class="m-cell__label">Cinéma</span><span class="m-cell__value">' + esc(C.telephone) + "</span></a>",
      '<a class="m-cell ' + K.classe() + '" href="tel:' + esc(C.telephoneBureau.replace(/\s/g, "")) + '"><span class="m-cell__label">Bureau</span><span class="m-cell__value">' + esc(C.telephoneBureau) + "</span></a>",
      '<a class="m-cell ' + K.classe() + '" href="mailto:' + esc(C.courriel) + '"><span class="m-cell__label">Courriel</span><span class="m-cell__value">' + esc(C.courriel) + "</span></a>",
      '<a class="m-cell ' + K.classe() + '" href="https://www.zinema.ch" target="_blank" rel="noopener noreferrer"><span class="m-cell__label">Même équipe</span><span class="m-cell__value">Zinéma, Lausanne ↗</span></a>',
    ];
    app.innerHTML = '<div class="mondrian">' + tete("Infos", "Venir, écrire, appeler") +
      '<div class="m-bande">' + c.join("") + "</div>" +
      '<div class="m-bande"><div class="m-cell ' + K.classe() + '"><span class="m-cell__label">Billets</span><span class="m-cell__value">' + esc(C.billets) + '</span></div>' +
      '<div class="m-cell ' + K.classe() + '"><span class="m-cell__label">Paiement</span><span class="m-cell__value">' + esc(C.paiement) + "</span></div></div>" +
      '<img class="m-salle" src="' + R + 'assets/img/salle.jpg" alt="La salle rouge du Cinéma Minimum" width="603" height="401"></div>';
  };
})();
