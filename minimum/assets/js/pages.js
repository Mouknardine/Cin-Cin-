/* ============================================================
   Minimum — le contenu de chaque page.
   ============================================================ */
(function () {
  "use strict";
  var M = window.Minimum;
  var D = M.D;
  var C = D.config;
  var esc = M.esc;
  var P = M.pages;

  function titre(t, sous) {
    return '<header class="titre"><h1>' + esc(t) + "<span>.</span></h1>" + (sous ? "<p>" + esc(sous) + "</p>" : "") + "</header>";
  }

  /* ------------------------- Accueil ------------------------- */
  P.home = function (app) {
    var sem = M.semaine();
    var auj = M.seancesDuJour(sem[0]);
    var prochains = [];
    for (var i = 0; i < sem.length && prochains.length < 1; i++) {
      var s = M.seancesDuJour(sem[i]);
      if (s.length) prochains.push({ d: sem[i], i: i, s: s });
    }
    var jour = prochains[0];

    var ce = jour
      ? '<ul class="tickets">' + jour.s.map(function (s) { return M.ligneSeance(s, jour.d); }).join("") + "</ul>"
      : '<p class="vide">Pas de séance au programme pour l\'instant.</p>';
    var quand = jour ? (jour.i === 0 ? "Ce soir" : M.labelJour(jour.d, jour.i)) : "Programme";

    var vedette = (jour ? jour.s[0].film : D.films[0]);
    var mini = D.films.map(function (f) {
      return '<a class="carte" href="' + M.root + "film/?id=" + esc(f.id) + '">' + M.affiche(f) +
        '<span class="carte__legende"><b>' + esc(f.titre) + "</b>" + esc(f.realisateur) + "</span></a>";
    }).join("");

    app.innerHTML =
      '<section class="hero">' +
      '<div class="hero__texte">' +
      '<p class="etiquette">Cinéma d\'art et d\'essai</p>' +
      '<h1 class="hero__mot"><span class="visually-hidden">' + esc(C.nomLong) + " — </span>Un écran.<br>Pas <em>plus.</em></h1>" +
      '<p class="hero__slogan">' + esc(C.slogan) + "</p>" +
      '<div class="hero__actions"><a class="bouton bouton--grand" href="' + M.root + 'programme/">Voir le programme</a>' +
      '<a class="bouton bouton--creux bouton--grand" href="' + M.root + 'infos/">Venir</a></div>' +
      "</div>" +
      '<div class="hero__scene" aria-hidden="false"><span class="soleil"></span>' +
      '<a class="hero__affiche" href="' + M.root + "film/?id=" + esc(vedette.id) + '">' + M.affiche(vedette) + "</a>" +
      '<span class="pastille">' + esc(quand) + "<br>à l'écran</span></div></section>" +

      '<section class="section"><div class="section__tete"><h2>' + esc(quand) + "<span>.</span></h2>" +
      (jour ? "<p>" + esc(M.dateLongue(jour.d)) + "</p>" : "") + "</div>" + ce + "</section>" +

      '<section class="manifeste"><p class="manifeste__texte rev">Moins de salles, moins de bruit, moins de pub. <em>Plus de films.</em></p>' +
      '<ul class="ronds">' +
      '<li class="rond rond--orange rev"><b>1</b><span>écran</span></li>' +
      '<li class="rond rond--creux rev"><b>VO</b><span>sous-titrée</span></li>' +
      '<li class="rond rond--paper rev"><b>0</b><span>pub</span></li></ul></section>' +

      '<section class="section section--bord"><div class="section__tete"><h2>À l\'affiche<span>.</span></h2><a class="lien" href="' + M.root + 'films/">Tous les films →</a></div>' +
      '<div class="rail">' + mini + "</div></section>" +

      '<section class="section"><div class="section__tete"><h2>Rendez-vous<span>.</span></h2></div>' +
      '<ul class="arches">' + D.rendezVous.map(function (r, i) {
        return '<li class="arche rev"><span>0' + (i + 1) + "</span><h3>" + esc(r.titre) + "</h3><p>" + esc(r.texte) + "</p></li>";
      }).join("") + "</ul></section>";
  };

  /* ------------------------ Programme ------------------------ */
  P.programme = function (app) {
    var sem = M.semaine();
    var actif = 0;
    var h = new URLSearchParams(location.search).get("jour");
    if (h !== null && +h >= 0 && +h < 7) actif = +h;

    app.innerHTML = titre("Programme", "Les sept prochains jours.") +
      '<div class="jours" role="tablist"></div><div class="section" id="jour"></div>';
    var onglets = app.querySelector(".jours");
    var zone = app.querySelector("#jour");

    onglets.innerHTML = sem.map(function (d, i) {
      var n = M.seancesDuJour(d).length;
      return '<button type="button" role="tab" class="jour" data-i="' + i + '">' +
        "<b>" + esc(M.labelJour(d, i)) + "</b><span>" + d.getDate() + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "</span>" +
        "<i>" + n + (n > 1 ? " séances" : " séance") + "</i></button>";
    }).join("");

    function montre(i) {
      var d = sem[i];
      var s = M.seancesDuJour(d);
      Array.prototype.forEach.call(onglets.children, function (b, k) {
        b.setAttribute("aria-selected", k === i ? "true" : "false");
      });
      zone.innerHTML = '<div class="section__tete"><h2>' + esc(M.JOURS[d.getDay()].replace(/^./, function (c) { return c.toUpperCase(); })) +
        "<span>.</span></h2><p>" + esc(M.dateLongue(d)) + "</p></div>" +
        (s.length
          ? '<ul class="tickets">' + s.map(function (x) { return M.ligneSeance(x, d); }).join("") + "</ul>"
          : '<p class="vide">Le Minimum est fermé ce jour-là. À demain.</p>');
    }
    onglets.addEventListener("click", function (e) {
      var b = e.target.closest(".jour");
      if (b) montre(+b.dataset.i);
    });
    montre(actif);
  };

  /* -------------------------- Films -------------------------- */
  P.films = function (app) {
    app.innerHTML = titre("Films", "Tout ce qui passe au Minimum.") +
      '<div class="galerie">' + D.films.map(function (f) {
        return '<a class="carte rev" href="' + M.root + "film/?id=" + esc(f.id) + '">' + M.affiche(f) +
          '<span class="carte__legende"><b>' + esc(f.titre) + "</b>" + esc(f.realisateur) + ", " + f.annee + "</span></a>";
      }).join("") + "</div>";
  };

  /* --------------------------- Film -------------------------- */
  P.film = function (app) {
    var f = M.filmParId(new URLSearchParams(location.search).get("id"));
    if (!f) {
      app.innerHTML = titre("Film introuvable", "Il a peut-être quitté l'affiche.") +
        '<div class="section"><a class="bouton" href="' + M.root + 'films/">Voir tous les films</a></div>';
      return;
    }
    document.title = f.titre + " — " + C.nomLong;
    var sem = M.semaine();
    var seances = [];
    sem.forEach(function (d, i) {
      (f.seances[d.getDay() === 0 ? 7 : d.getDay()] || []).forEach(function (h) { seances.push({ d: d, i: i, h: h }); });
    });
    app.innerHTML =
      '<article class="fiche">' +
      '<div class="fiche__aff">' + M.affiche(f) + "</div>" +
      '<div class="fiche__texte">' +
      '<p class="fiche__meta">' + esc(f.pays) + " · " + f.annee + " · " + f.duree + " min" + (f.age ? " · " + esc(f.age) : "") + "</p>" +
      "<h1>" + esc(f.titre) + "</h1>" +
      '<p class="fiche__real">de ' + esc(f.realisateur) + "</p>" +
      '<p class="fiche__langue">' + esc(f.langue) + "</p>" +
      '<p class="fiche__synopsis">' + esc(f.synopsis) + "</p>" +
      (f.bandeAnnonce ? '<a class="lien fiche__ba" href="' + esc(f.bandeAnnonce) + '" target="_blank" rel="noopener noreferrer">Voir la bande-annonce ↗</a>' : "") +
      "</div></article>" +
      '<section class="section"><div class="section__tete"><h2>Séances<span>.</span></h2></div>' +
      (seances.length
        ? '<ul class="tickets">' + seances.map(function (s) {
            return '<li class="ticket"><div class="ticket__haut"><span class="ticket__jour">' + esc(M.labelJour(s.d, s.i)) + " " + s.d.getDate() + "." + ("0" + (s.d.getMonth() + 1)).slice(-2) +
              '</span><span class="ticket__heure">' + M.heureAffichee(s.h) + '</span><span class="ticket__meta">' + esc(f.langue) +
              '</span></div><div class="ticket__talon"><a class="bouton" href="' + esc(M.lienReserver(f, s.d, s.h)) + '">Réserver</a></div></li>';
          }).join("") + "</ul>"
        : '<p class="vide">Pas de séance cette semaine.</p>') +
      "</section>" +
      '<div class="section section--fin"><a class="lien" href="' + M.root + 'films/">← Tous les films</a></div>';
  };

  /* -------------------------- Tarifs ------------------------- */
  P.tarifs = function (app) {
    app.innerHTML = titre("Tarifs", "Simples, comme le reste.") +
      '<ul class="tarifs">' + D.tarifs.map(function (t) {
        return '<li class="tarif rev"><b class="tarif__prix">' + esc(t.prix) + '</b><div><h3>' + esc(t.nom) + "</h3>" + (t.note ? "<p>" + esc(t.note) + "</p>" : "") + "</div></li>";
      }).join("") + "</ul>" +
      '<section class="section"><div class="section__tete"><h2>Réserver<span>.</span></h2></div>' +
      '<p class="texte">Réservez votre place pour une séance depuis le programme, ou écrivez-nous : ' +
      '<a class="souligne" href="mailto:' + esc(C.courriel) + '">' + esc(C.courriel) + "</a>.</p></section>";
  };

  /* ------------------------- Location ------------------------ */
  P.location = function (app) {
    app.innerHTML = titre("Location", "Une salle pour vous.") +
      '<section class="section"><p class="texte texte--grand">' + esc(D.location.texte) + "</p></section>" +
      '<section class="section"><div class="section__tete"><h2>Votre demande<span>.</span></h2></div>' +
      '<form class="form" id="formLoc" novalidate>' +
      '<label>Nom<input name="nom" required autocomplete="name"></label>' +
      '<label>Courriel<input name="courriel" type="email" required autocomplete="email"></label>' +
      '<label>Date souhaitée<input name="date" type="date"></label>' +
      '<label>Nombre de personnes<input name="nb" type="number" min="1" inputmode="numeric"></label>' +
      '<label class="form__large">Votre projet<textarea name="msg" rows="5"></textarea></label>' +
      '<button class="bouton bouton--grand" type="submit">Envoyer la demande</button>' +
      '<p class="form__etat" role="status"></p></form></section>';
    var f = app.querySelector("#formLoc");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = new FormData(f);
      if (!v.get("nom") || !/.+@.+\..+/.test(v.get("courriel") || "")) {
        f.querySelector(".form__etat").textContent = "Merci d'indiquer votre nom et un courriel valide.";
        return;
      }
      var corps = "Nom : " + v.get("nom") + "\nCourriel : " + v.get("courriel") + "\nDate : " + (v.get("date") || "—") +
        "\nPersonnes : " + (v.get("nb") || "—") + "\n\n" + (v.get("msg") || "");
      location.href = "mailto:" + C.courriel + "?subject=" + encodeURIComponent("Demande de location") + "&body=" + encodeURIComponent(corps);
      f.querySelector(".form__etat").textContent = "Votre messagerie s'ouvre : il ne reste qu'à envoyer.";
    });
  };

  /* --------------------------- Infos ------------------------- */
  P.infos = function (app) {
    var cases = [
      ["Adresse", C.adresse.map(esc).join("<br>")],
      ["Ouverture", esc(C.ouverture)],
      ["Accès", esc(C.acces)],
      ["Courriel", '<a class="souligne" href="mailto:' + esc(C.courriel) + '">' + esc(C.courriel) + "</a>"],
    ];
    if (C.telephone) cases.push(["Téléphone", '<a class="souligne" href="tel:' + esc(C.telephone.replace(/\s/g, "")) + '">' + esc(C.telephone) + "</a>"]);
    cases.push(["La salle d'à côté", 'Même équipe, même passion : <a class="souligne" href="https://www.zinema.ch" target="_blank" rel="noopener noreferrer">le Zinéma</a>.']);
    app.innerHTML = titre("Infos", "Venir, écrire, appeler.") +
      '<ul class="infos">' + cases.map(function (c) {
        return '<li class="info rev"><h3>' + c[0] + "</h3><p>" + c[1] + "</p></li>";
      }).join("") + "</ul>";
  };
})();
