/* ============================================================
   Minimum — page Radio : un petit bureau d'ordinateur.

   Idée empruntée à soso radio (des fenêtres, un lecteur, une
   barre des tâches), dessinée avec la grammaire du Zinéma :
   trait noir de 4 px, cases sur papier, barres de titre dans
   les couleurs Mondrian tirées au hasard, rose fluo sur START.

   Sur ordinateur, les fenêtres se déplacent (on les attrape par
   leur barre de titre), se réduisent (_) et se ferment (×) ; la
   barre du bas les rouvre. Sur téléphone elles s'empilent.
   Le fond d'écran est la vraie salle rouge du Minimum.
   ============================================================ */
(function () {
  "use strict";
  var M = window.Minimum;
  var D = M.D, C = D.config, K = M.K, esc = M.esc, R = M.root;
  var NOMS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  function fenetre(id, titre, corps, pos) {
    return '<section class="fen" id="fen-' + id + '" data-id="' + id + '" style="--x:' + pos[0] + ";--y:" + pos[1] + ";--l:" + pos[2] + '" aria-label="' + esc(titre) + '">' +
      '<header class="fen__barre ' + K.classeVive() + '"><span class="fen__titre">' + esc(titre) + "</span>" +
      '<button type="button" class="fen__bouton" data-act="reduire" aria-label="Réduire">_</button>' +
      '<button type="button" class="fen__bouton" data-act="fermer" aria-label="Fermer">×</button></header>' +
      '<div class="fen__corps">' + corps + "</div></section>";
  }

  M.pages.radio = function (app) {
    var a = M.antenne();
    var pistes = D.pistes;
    var grille = D.emissions.slice().sort(function (x, y) { return x.jour - y.jour || (x.heure < y.heure ? -1 : 1); });

    var lecteur =
      '<div class="lec__ecran"><div class="lec__titre"><span id="lec-titre">' + esc(pistes[0].titre) + '</span><small id="lec-artiste">' + esc(pistes[0].artiste) + "</small></div>" +
      '<div class="lec__eq" id="lec-eq" aria-hidden="true">' + new Array(16 + 1).join("<i></i>") + "</div></div>" +
      '<div class="lec__live ' + K.classe() + '">' + M.voyant(a) + "<span>" + (a.emission ? esc(a.emission.titre) : esc(C.radioNom)) + "</span></div>" +
      '<div class="lec__ctrl"><button type="button" class="lec__b ' + K.classe() + '" data-c="prec" aria-label="Précédent">⏮</button>' +
      '<button type="button" class="lec__b lec__b--play ' + K.classe() + '" data-c="play" id="lec-play" aria-label="Lecture">▶</button>' +
      '<button type="button" class="lec__b ' + K.classe() + '" data-c="suiv" aria-label="Suivant">⏭</button>' +
      '<div class="lec__vol"><button type="button" class="lec__b ' + K.classe() + '" data-c="moins" aria-label="Moins fort">−</button><span id="lec-vol"></span>' +
      '<button type="button" class="lec__b ' + K.classe() + '" data-c="plus" aria-label="Plus fort">+</button></div></div>' +
      '<ol class="lec__liste" id="lec-liste">' + pistes.map(function (p, i) {
        return '<li><button type="button" class="lec__piste ' + K.classe() + '" data-i="' + i + '"><b>' + (i + 1) + "</b><span>" + esc(p.titre) + "<small>" + esc(p.artiste) + "</small></span></button></li>";
      }).join("") + "</ol>" +
      '<p class="lec__statut" id="lec-statut"></p>';

    var grilleHTML = '<div class="m-seances-liste">' + grille.map(function (e) {
      return '<div class="m-seance"><div class="m-seance__heure ' + K.classe() + '" style="flex-basis:7rem">' + NOMS[e.jour].slice(0, 3) + ".</div>" +
        '<div class="m-seance__heure ' + K.classe() + '" style="flex-basis:5rem">' + M.heureAffichee(e.heure) + "</div>" +
        '<div class="m-seance__infos ' + K.classe() + '"><span class="m-seance__titre">' + esc(e.titre) + '</span><span class="m-seance__sous">' + esc(e.texte) + "</span></div></div>";
    }).join("") + "</div>";

    var apropos = '<div class="m-cell"><p><b>' + esc(C.radioNom) + "</b> — la radio du Minimum, à Neuchâtel. De la musique, des invité·e·s, des films racontés à voix haute, en direct de la salle et de La Case à Chocs.</p>" +
      "<p>Elle est écoutable ici, et sa grille revient chaque semaine aux mêmes heures.</p></div>";

    var mail = '<form class="fen__form" id="form-mail" novalidate><div class="m-champ"><label for="rm-mail">Courriel</label><input id="rm-mail" type="email" required autocomplete="email" placeholder="vous@exemple.ch"></div>' +
      '<button type="submit" class="m-action ' + K.classe() + '" style="width:100%">Recevoir le programme</button><p class="m-etat" id="rm-etat" role="status"></p></form>';

    var icones = [["lecteur", "♪", "Musique"], ["grille", "▦", "Grille"], ["apropos", "i", "À propos"], ["mail", "@", "Programme"]];

    app.innerHTML =
      '<div class="mondrian"><div class="bureau" id="bureau" style="--fond:url(' + new URL(R + 'assets/img/salle.jpg', location.href).href + ')">' +
      '<nav class="bureau__icones" aria-label="Fenêtres">' + icones.map(function (i) {
        return '<button type="button" class="icone ' + K.classe() + '" data-ouvre="' + i[0] + '"><span class="icone__glyphe">' + i[1] + '</span><span class="icone__nom">' + i[2] + "</span></button>";
      }).join("") + "</nav>" +
      fenetre("lecteur", "Lecteur — " + C.radioNom, lecteur, ["10rem", "1rem", "24rem"]) +
      fenetre("grille", "La grille de la semaine", grilleHTML, ["36rem", "1rem", "30rem"]) +
      fenetre("apropos", "À propos", apropos, ["14rem", "5rem", "22rem"]) +
      fenetre("mail", "Programme par courriel", mail, ["40rem", "7rem", "22rem"]) +
      '<div class="barre-taches"><button type="button" class="barre-taches__start" id="start">Start</button>' +
      '<div class="barre-taches__onglets" id="onglets"></div><span class="barre-taches__heure" id="horloge"></span></div></div></div>';

    var bureau = document.getElementById("bureau");
    var fens = bureau.querySelectorAll(".fen");
    var z = 10;
    var etat = {}; /* id → "ouvert" | "reduit" | "ferme" */

    function majOnglets() {
      document.getElementById("onglets").innerHTML = Array.prototype.map.call(fens, function (f) {
        var id = f.dataset.id;
        if (etat[id] === "ferme") return "";
        return '<button type="button" class="onglet ' + (etat[id] === "ouvert" ? "is-actif" : "") + '" data-id="' + id + '">' + esc(f.querySelector(".fen__titre").textContent.split(" — ")[0]) + "</button>";
      }).join("");
    }
    function regle(id, e) {
      var f = document.getElementById("fen-" + id);
      etat[id] = e;
      f.classList.toggle("is-reduite", e === "reduit");
      f.hidden = e === "ferme";
      if (e === "ouvert") { f.style.zIndex = ++z; }
      majOnglets();
    }
    Array.prototype.forEach.call(fens, function (f) { etat[f.dataset.id] = "ouvert"; f.style.zIndex = ++z; });
    /* Sur téléphone, seul le lecteur est ouvert au départ : le reste s'ouvre d'un toucher. */
    if (window.matchMedia("(max-width: 899px)").matches) ["grille", "apropos", "mail"].forEach(function (i) { etat[i] = "ferme"; document.getElementById("fen-" + i).hidden = true; });
    /* Au départ : le lecteur et la grille. Le reste attend dans la barre du bas. */
    if (window.matchMedia("(min-width: 900px)").matches) ["apropos", "mail"].forEach(function (i) { etat[i] = "reduit"; document.getElementById("fen-" + i).classList.add("is-reduite"); });
    majOnglets();

    bureau.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var f = b.closest(".fen");
      if (b.dataset.act && f) { regle(f.dataset.id, b.dataset.act === "fermer" ? "ferme" : "reduit"); return; }
      if (b.dataset.ouvre) { regle(b.dataset.ouvre, "ouvert"); return; }
      if (b.classList.contains("onglet")) { var id = b.dataset.id; regle(id, etat[id] === "ouvert" ? "reduit" : "ouvert"); return; }
      if (b.id === "start") { Array.prototype.forEach.call(fens, function (x) { if (etat[x.dataset.id] !== "ouvert") regle(x.dataset.id, "ouvert"); }); }
    });
    bureau.addEventListener("pointerdown", function (e) { var f = e.target.closest(".fen"); if (f && etat[f.dataset.id] === "ouvert") f.style.zIndex = ++z; });

    /* ---- Déplacement (ordinateur) ---- */
    var drag = null;
    bureau.addEventListener("pointerdown", function (e) {
      var barre = e.target.closest(".fen__barre");
      if (!barre || e.target.closest("button") || !window.matchMedia("(min-width: 900px)").matches) return;
      var f = barre.parentNode, r = f.getBoundingClientRect(), br = bureau.getBoundingClientRect();
      drag = { f: f, dx: e.clientX - r.left, dy: e.clientY - r.top, br: br };
      f.style.zIndex = ++z; barre.setPointerCapture(e.pointerId); e.preventDefault();
    });
    bureau.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var x = e.clientX - drag.br.left - drag.dx, y = e.clientY - drag.br.top - drag.dy;
      x = Math.max(0, Math.min(x, drag.br.width - 120)); y = Math.max(0, Math.min(y, drag.br.height - 100));
      drag.f.style.setProperty("--x", x + "px"); drag.f.style.setProperty("--y", y + "px");
    });
    bureau.addEventListener("pointerup", function () { drag = null; });

    /* ---- Horloge ---- */
    var h = document.getElementById("horloge");
    function tic() { var n = new Date(); h.textContent = ("0" + n.getHours()).slice(-2) + ":" + ("0" + n.getMinutes()).slice(-2); }
    tic(); setInterval(tic, 15000);

    /* ---- Lecteur ---- */
    var audio = new Audio(); audio.preload = "none";
    var cur = 0, vol = 6, jouant = false;
    var eq = document.getElementById("lec-eq").children;
    var play = document.getElementById("lec-play");
    var statut = document.getElementById("lec-statut");
    function barreVol() { var s = ""; for (var i = 0; i < 10; i++) s += i < vol ? "■" : "□"; document.getElementById("lec-vol").textContent = s; audio.volume = vol / 10; }
    function piste() { return pistes[cur]; }
    function maj() {
      document.getElementById("lec-titre").textContent = piste().titre;
      document.getElementById("lec-artiste").textContent = piste().artiste;
      Array.prototype.forEach.call(document.querySelectorAll(".lec__piste"), function (b, i) { b.classList.toggle("is-actif", i === cur); });
      play.textContent = jouant ? "❚❚" : "▶";
      document.getElementById("lec-eq").classList.toggle("is-jeu", jouant);
      var dispo = !!(piste().url || C.radioFlux);
      statut.textContent = (jouant ? "Lecture" : "Pause") + " — piste " + (cur + 1) + " sur " + pistes.length + (dispo ? "" : " — bientôt en ligne");
    }
    function lance(i) {
      cur = (i + pistes.length) % pistes.length;
      var src = piste().url || C.radioFlux;
      if (!src) { jouant = false; maj(); return; }
      audio.src = src; audio.play().then(function () { jouant = true; maj(); }).catch(function () { jouant = false; maj(); });
    }
    audio.addEventListener("ended", function () { lance(cur + 1); });
    document.getElementById("fen-lecteur").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.i) { lance(+b.dataset.i); }
      else if (b.dataset.c === "play") { if (jouant) { audio.pause(); jouant = false; maj(); } else lance(cur); }
      else if (b.dataset.c === "prec") lance(cur - 1);
      else if (b.dataset.c === "suiv") lance(cur + 1);
      else if (b.dataset.c === "moins") { vol = Math.max(0, vol - 1); barreVol(); }
      else if (b.dataset.c === "plus") { vol = Math.min(10, vol + 1); barreVol(); }
    });
    for (var i = 0; i < eq.length; i++) eq[i].style.setProperty("--d", (i * 0.09) + "s");
    barreVol(); maj();

    /* ---- Programme par courriel ---- */
    document.getElementById("form-mail").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = document.getElementById("rm-mail").value;
      var et = document.getElementById("rm-etat");
      if (!/.+@.+\..+/.test(v)) { et.textContent = "Merci d'indiquer un courriel valide."; return; }
      location.href = "mailto:" + C.courriel + "?subject=" + encodeURIComponent("Recevoir le programme") + "&body=" + encodeURIComponent("Merci d'ajouter cette adresse à la liste : " + v);
      et.textContent = "Votre messagerie s'ouvre : il ne reste qu'à envoyer.";
    });
  };
})();
