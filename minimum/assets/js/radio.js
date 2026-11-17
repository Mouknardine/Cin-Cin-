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


  /* ---------- Fonds d'écran : tous générés (aucune image à charger), plus la salle ---------- */
  var FONDS = [
    { id: "salle", nom: "La salle", css: "url(SALLE) center / cover" },
    { id: "noir", nom: "Noir", css: "#100f0c" },
    { id: "bleu", nom: "Bleu", css: "#2f49c2" },
    { id: "rouge", nom: "Rouge", css: "#c22a1d" },
    { id: "rose", nom: "Rose fluo", css: "#ff00a0" },
    { id: "mondrian", nom: "Mondrian", css: "linear-gradient(#c22a1d,#c22a1d) 0 0 / 34% 52% no-repeat, linear-gradient(#f7c600,#f7c600) 100% 0 / 26% 24% no-repeat, linear-gradient(#2f49c2,#2f49c2) 100% 100% / 36% 36% no-repeat, linear-gradient(#100f0c,#100f0c) 34% 0 / 1.1% 100% no-repeat, linear-gradient(#100f0c,#100f0c) 0 52% / 74% 1.6% no-repeat, linear-gradient(#100f0c,#100f0c) 74% 0 / 1.1% 100% no-repeat, linear-gradient(#100f0c,#100f0c) 74% 24% / 26% 1.6% no-repeat, #ededed" },
    { id: "brume", nom: "Brume", css: "radial-gradient(60% 55% at 18% 28%, #ff4d1a, transparent 70%), radial-gradient(55% 60% at 82% 22%, #2f49c2, transparent 70%), radial-gradient(60% 60% at 62% 92%, #ff00a0, transparent 70%), #100f0c" },
    { id: "aube", nom: "Aube", css: "radial-gradient(60% 60% at 15% 20%, #ffd3b8, transparent 70%), radial-gradient(55% 55% at 85% 30%, #cdd6ff, transparent 70%), radial-gradient(60% 60% at 50% 95%, #ffc6e4, transparent 70%), #f4efe9" },
    { id: "trame", nom: "Trame", css: "radial-gradient(#100f0c 21%, transparent 23%) 0 0 / 16px 16px, #ff4d1a" },
    { id: "nuit", nom: "Nuit", css: "radial-gradient(70% 70% at 50% 120%, #2f49c2, transparent 70%), radial-gradient(50% 50% at 20% 10%, #3b2a7a, transparent 70%), #0a0a12" },
  ];
  var CLE = "minimum-fond";
  function lireFond() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
  function ecrireFond(v) { try { localStorage.setItem(CLE, v); } catch (e) {} }

  function fenetre(id, titre, corps, pos) {
    return '<section class="fen" id="fen-' + id + '" data-id="' + id + '" style="--x:' + pos[0] + ";--y:" + pos[1] + ";--l:" + pos[2] + '" aria-label="' + esc(titre) + '">' +
      '<header class="fen__barre"><span class="fen__titre">' + esc(titre) + "</span>" +
      '<button type="button" class="fen__bouton" data-act="reduire" aria-label="Réduire">_</button>' +
      '<button type="button" class="fen__bouton" data-act="fermer" aria-label="Fermer">×</button></header>' +
      '<div class="fen__corps">' + corps + "</div></section>";
  }


  /* ============================================================
     RADIO SUR TÉLÉPHONE — pas de faux bureau : un vrai lecteur.
     Un grand écran (le fond choisi), le titre en cours, une barre de
     progression, un gros bouton lecture, puis trois onglets :
     Musique · Grille · Infos.
     ============================================================ */
  function ico(d) { return '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">' + d + "</svg>"; }
  var I_PLAY = ico('<path d="M7 4l13 8-13 8z"/>'), I_PAUSE = ico('<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>');
  var I_PREC = ico('<path d="M5 4h3v16H5zM20 4v16L9 12z"/>'), I_SUIV = ico('<path d="M16 4h3v16h-3zM4 4l11 8L4 20z"/>');

  function radioMobile(app) {
    var a = M.antenne();
    var pistes = D.pistes;
    var grille = D.emissions.slice().sort(function (x, y) { return x.jour - y.jour || (x.heure < y.heure ? -1 : 1); });
    var onglet = "musique";

    app.innerHTML =
      '<div class="mondrian">' +
      '<section class="rm-hero" id="rm-hero" aria-label="À l\'écoute">' +
      '<div class="rm-hero__haut"><span class="rm-voyant">' + M.voyant(a) + (a.emission ? " · " + esc(a.emission.titre) : "") + "</span>" +
      '<button type="button" class="rm-fond" id="rm-fond" aria-label="Changer le fond d\'écran">Fond</button></div>' +
      '<div class="rm-now"><p class="rm-now__label">À l\'écoute</p><h1 class="rm-now__titre" id="rm-titre"></h1><p class="rm-now__artiste" id="rm-artiste"></p></div>' +
      '<div class="rm-eq" id="rm-eq" aria-hidden="true">' + new Array(24 + 1).join("<i></i>") + "</div></section>" +
      '<div class="rm-prog" id="rm-prog" role="slider" tabindex="0" aria-label="Position dans le morceau" aria-valuemin="0" aria-valuemax="100"><i id="rm-prog-i"></i></div>' +
      '<div class="rm-temps"><span id="rm-t0">0:00</span><span id="rm-t1">0:00</span></div>' +
      '<div class="rm-ctrl"><button type="button" class="rm-b ' + K.classe() + '" data-c="prec" aria-label="Précédent">' + I_PREC + "</button>" +
      '<button type="button" class="rm-b rm-b--play ' + K.classe() + '" data-c="play" id="rm-play" aria-label="Lecture">' + I_PLAY + "</button>" +
      '<button type="button" class="rm-b ' + K.classe() + '" data-c="suiv" aria-label="Suivant">' + I_SUIV + "</button></div>" +
      '<div class="m-filtres rm-tabs" id="rm-tabs">' + [["musique", "Musique"], ["grille", "Grille"], ["infos", "Infos"]].map(function (t) {
        return '<button type="button" class="m-filtre ' + K.classeVive() + '" data-t="' + t[0] + '">' + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div id="rm-panneau"></div></div>';

    /* ---- Fond : on le change d'un toucher (même réglage que sur ordinateur) ---- */
    var hero = document.getElementById("rm-hero");
    var salleUrl = new URL(R + "assets/img/salle.jpg", location.href).href;
    var iFond = Math.max(0, FONDS.map(function (f) { return f.id; }).indexOf(lireFond() || "salle"));
    function poseFond() {
      hero.style.background = "linear-gradient(180deg, rgba(16,15,12,0.55), rgba(16,15,12,0.12) 45%, rgba(16,15,12,0.78)), " + FONDS[iFond].css.replace("SALLE", salleUrl);
      hero.style.backgroundSize = "cover"; hero.style.backgroundPosition = "center";
    }
    poseFond();
    document.getElementById("rm-fond").addEventListener("click", function () { iFond = (iFond + 1) % FONDS.length; poseFond(); ecrireFond(FONDS[iFond].id); });

    /* ---- Lecteur ---- */
    var audio = new Audio(); audio.preload = "metadata";
    var cur = 0, jouant = false;
    var play = document.getElementById("rm-play"), eq = document.getElementById("rm-eq");
    function src(p) { var u = p.url || C.radioFlux || ""; return u && !/^https?:|^\/\//.test(u) ? R + u : u; }
    function temps(t) { if (!isFinite(t)) return "0:00"; return Math.floor(t / 60) + ":" + ("0" + Math.floor(t % 60)).slice(-2); }
    function maj() {
      var p = pistes[cur];
      document.getElementById("rm-titre").textContent = p.titre;
      document.getElementById("rm-artiste").textContent = p.artiste;
      play.innerHTML = jouant ? I_PAUSE : I_PLAY; play.setAttribute("aria-label", jouant ? "Pause" : "Lecture");
      eq.classList.toggle("is-jeu", jouant);
      document.getElementById("rm-t0").textContent = temps(audio.currentTime);
      document.getElementById("rm-t1").textContent = src(p) ? temps(audio.duration) : "bientôt";
      var r = audio.duration ? audio.currentTime / audio.duration : 0;
      document.getElementById("rm-prog-i").style.width = (r * 100) + "%";
      document.getElementById("rm-prog").setAttribute("aria-valuenow", Math.round(r * 100));
      Array.prototype.forEach.call(document.querySelectorAll(".rm-piste"), function (b, i) { b.classList.toggle("is-actif", i === cur); });
    }
    function lance(i) {
      cur = (i + pistes.length) % pistes.length;
      var u = src(pistes[cur]);
      if (!u) { audio.pause(); jouant = false; maj(); return; }
      audio.src = u; audio.play().then(function () { jouant = true; maj(); }).catch(function () { jouant = false; maj(); }); maj();
    }
    audio.addEventListener("timeupdate", maj); audio.addEventListener("loadedmetadata", maj);
    audio.addEventListener("ended", function () { lance(cur + 1); });
    audio.addEventListener("pause", function () { if (!audio.ended) { jouant = false; maj(); } });
    audio.addEventListener("play", function () { jouant = true; maj(); });
    var pret = src(pistes[0]); if (pret) audio.src = pret;
    app.querySelector(".rm-ctrl").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.c === "play") { if (jouant) audio.pause(); else if (audio.src && audio.currentTime > 0 && !audio.ended) audio.play(); else lance(cur); }
      else if (b.dataset.c === "prec") lance(cur - 1); else lance(cur + 1);
    });
    var prog = document.getElementById("rm-prog");
    function cherche(x) { var r = prog.getBoundingClientRect(); if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * audio.duration; }
    prog.addEventListener("click", function (e) { cherche(e.clientX); });
    prog.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") audio.currentTime += 10; if (e.key === "ArrowLeft") audio.currentTime -= 10; });
    for (var i = 0; i < eq.children.length; i++) eq.children[i].style.setProperty("--d", (i * 0.07) + "s");

    /* ---- Onglets ---- */
    var panneau = document.getElementById("rm-panneau"), tabs = document.getElementById("rm-tabs");
    function montre() {
      Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle("is-active", b.dataset.t === onglet); });
      if (onglet === "musique") {
        panneau.innerHTML = '<ol class="rm-liste">' + pistes.map(function (p, i) {
          return '<li><button type="button" class="rm-piste ' + K.classe() + '" data-i="' + i + '"><b>' + (i + 1) + "</b><span>" + esc(p.titre) + "<small>" + esc(p.artiste) + "</small></span></button></li>";
        }).join("") + "</ol>";
      } else if (onglet === "grille") {
        panneau.innerHTML = '<div class="m-seances-liste">' + grille.map(function (e) {
          return '<div class="m-seance"><div class="m-seance__heure m-seance__heure--jour ' + K.classe() + '"><span>' + NOMS[e.jour].slice(0, 3) + ".</span><b>" + M.heureAffichee(e.heure) + "</b></div>" +
            '<div class="m-seance__infos ' + K.classe() + '"><span class="m-seance__titre">' + esc(e.titre) + '</span><span class="m-seance__sous">' + esc(e.texte) + "</span></div></div>";
        }).join("") + "</div>";
      } else {
        panneau.innerHTML =
          '<div class="m-cell"><p><b>' + esc(C.radioNom) + "</b> — la radio du Minimum, à Neuchâtel. De la musique, des invité·e·s, des films racontés à voix haute, en direct de la salle et de La Case à Chocs.</p>" +
          "<p>Sa grille revient chaque semaine aux mêmes heures.</p>" +
          '<p class="credit">Morceaux d\'exemple : Kevin MacLeod (<a class="souligne" href="https://incompetech.com" target="_blank" rel="noopener noreferrer">incompetech.com</a>), licence <a class="souligne" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.</p></div>' +
          '<form id="rm-form" novalidate><div class="m-champ"><label for="rm-mail">Recevoir le programme par courriel</label><input id="rm-mail" type="email" autocomplete="email" placeholder="vous@exemple.ch"></div>' +
          '<button type="submit" class="m-action ' + K.classe() + '" style="width:100%">Recevoir le programme</button><p class="m-etat" id="rm-etat" role="status"></p></form>';
        document.getElementById("rm-form").addEventListener("submit", function (e) {
          e.preventDefault();
          var v = document.getElementById("rm-mail").value, et = document.getElementById("rm-etat");
          if (!/.+@.+\..+/.test(v)) { et.textContent = "Merci d'indiquer un courriel valide."; return; }
          location.href = "mailto:" + C.courriel + "?subject=" + encodeURIComponent("Recevoir le programme") + "&body=" + encodeURIComponent("Merci d'ajouter cette adresse à la liste : " + v);
          et.textContent = "Votre messagerie s'ouvre : il ne reste qu'à envoyer.";
        });
      }
      maj();
    }
    tabs.addEventListener("click", function (e) { var b = e.target.closest(".m-filtre"); if (b) { onglet = b.dataset.t; montre(); } });
    panneau.addEventListener("click", function (e) { var b = e.target.closest(".rm-piste"); if (b) lance(+b.dataset.i); });
    montre();
  }

  M.pages.radio = function (app) {
    if (window.matchMedia("(max-width: 899px)").matches) { radioMobile(app); return; }
    /* Si l'écran franchit le seuil (rotation, redimensionnement), on recharge la bonne version. */
    window.matchMedia("(max-width: 899px)").addEventListener("change", function () { location.reload(); });
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
      return '<div class="m-seance"><div class="m-seance__heure m-seance__heure--jour ' + K.classe() + '"><span>' + NOMS[e.jour].slice(0, 3) + ".</span><b>" + M.heureAffichee(e.heure) + "</b></div>" +
        '<div class="m-seance__infos ' + K.classe() + '"><span class="m-seance__titre">' + esc(e.titre) + '</span><span class="m-seance__sous">' + esc(e.texte) + "</span></div></div>";
    }).join("") + "</div>";

    var apropos = '<div class="m-cell"><p><b>' + esc(C.radioNom) + "</b> — la radio du Minimum, à Neuchâtel. De la musique, des invité·e·s, des films racontés à voix haute, en direct de la salle et de La Case à Chocs.</p>" +
      "<p>Elle est écoutable ici, et sa grille revient chaque semaine aux mêmes heures.</p>" +
      '<p class="credit">Morceaux d\'exemple : Kevin MacLeod (<a class="souligne" href="https://incompetech.com" target="_blank" rel="noopener noreferrer">incompetech.com</a>), licence <a class="souligne" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.</p></div>';

    var mail = '<form class="fen__form" id="form-mail" novalidate><div class="m-champ"><label for="rm-mail">Courriel</label><input id="rm-mail" type="email" required autocomplete="email" placeholder="vous@exemple.ch"></div>' +
      '<button type="submit" class="m-action ' + K.classe() + '" style="width:100%">Recevoir le programme</button><p class="m-etat" id="rm-etat" role="status"></p></form>';

    var reglages = '<div class="m-cell"><span class="m-cell__label">Fond d\'écran</span></div><div class="fonds" id="fonds">' +
      FONDS.map(function (f) { return '<button type="button" class="fond" data-fond="' + f.id + '" aria-label="' + esc(f.nom) + '" title="' + esc(f.nom) + '"><i style="background:' + f.css.replace("SALLE", new URL(R + "assets/img/salle.jpg", location.href).href) + '"></i><span>' + esc(f.nom) + "</span></button>"; }).join("") + "</div>" +
      '<label class="m-action fond__import ' + K.classe() + '" style="cursor:pointer">Importer mon image<input type="file" accept="image/*" id="fond-fichier" hidden></label>';

    /* Icônes dessinées au même trait (2,5 px, angles droits) : une famille cohérente. */
    function svg(d) { return '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">' + d + "</svg>"; }
    var icones = [
      ["lecteur", svg('<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'), "Musique"],
      ["grille", svg('<rect x="3" y="4" width="18" height="17"/><path d="M3 9h18M8 2v4M16 2v4M8 14h2M14 14h2M8 18h2"/>'), "Grille"],
      ["apropos", svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'), "À propos"],
      ["mail", svg('<rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/>'), "Courriel"],
      ["reglages", svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/>'), "Réglages"],
    ];

    app.innerHTML =
      '<div class="mondrian"><div class="bureau" id="bureau">' +
      '<nav class="bureau__icones" aria-label="Fenêtres">' + icones.map(function (i) {
        return '<button type="button" class="icone ' + K.classe() + '" data-ouvre="' + i[0] + '"><span class="icone__glyphe">' + i[1] + '</span><span class="icone__nom">' + i[2] + "</span></button>";
      }).join("") + "</nav>" +
      fenetre("lecteur", "Lecteur — " + C.radioNom, lecteur, ["12rem", "1rem", "26rem"]) +
      fenetre("grille", "La grille de la semaine", grilleHTML, ["38rem", "2rem", "30rem"]) +
      fenetre("apropos", "À propos", apropos, ["16rem", "6rem", "22rem"]) +
      fenetre("mail", "Programme par courriel", mail, ["42rem", "8rem", "22rem"]) +
      fenetre("reglages", "Réglages", reglages, ["40rem", "3rem", "28rem"]) +
      '<div class="barre-taches"><button type="button" class="barre-taches__start" id="start">Start</button>' +
      '<div class="barre-taches__onglets" id="onglets"></div><span class="barre-taches__heure" id="horloge"></span></div></div></div>';

    var bureau = document.getElementById("bureau");
    var fens = bureau.querySelectorAll(".fen");
    var z = 10;
    var etat = {}; /* id → "ouvert" | "reduit" | "ferme" */

    function majOnglets() {
      Array.prototype.forEach.call(document.querySelectorAll(".icone[data-ouvre]"), function (b) { b.classList.toggle("is-ouvert", etat[b.dataset.ouvre] === "ouvert"); });
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
    /* Au départ : seulement le lecteur — rien d'autre à l'écran. Le reste s'ouvre par les icônes. */
    var grand = window.matchMedia("(min-width: 900px)").matches;
    ["grille", "apropos", "mail", "reglages"].forEach(function (i) {
      if (i === "reglages" || grand) { etat[i] = "ferme"; document.getElementById("fen-" + i).hidden = true; }
    });
    majOnglets();

    /* ---- Fond d'écran ---- */
    var salleUrl = new URL(R + "assets/img/salle.jpg", location.href).href;
    function poseFond(id) {
      var f = FONDS.filter(function (x) { return x.id === id; })[0] || FONDS[0];
      bureau.style.background = f.css.replace("SALLE", salleUrl);
      Array.prototype.forEach.call(document.querySelectorAll(".fond"), function (b) { b.classList.toggle("is-actif", b.dataset.fond === f.id); });
      bureau.classList.toggle("is-clair", f.id === "mondrian" || f.id === "aube");
    }
    poseFond(lireFond() || "salle");
    document.getElementById("fonds").addEventListener("click", function (e) {
      var b = e.target.closest(".fond"); if (!b) return;
      poseFond(b.dataset.fond); ecrireFond(b.dataset.fond);
    });
    document.getElementById("fond-fichier").addEventListener("change", function (e) {
      var fic = e.target.files && e.target.files[0]; if (!fic) return;
      var url = URL.createObjectURL(fic);
      bureau.style.background = "url(" + url + ") center / cover";
      Array.prototype.forEach.call(document.querySelectorAll(".fond"), function (b) { b.classList.remove("is-actif"); });
    });

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

    /* ---- Lecteur : de simples fichiers audio ---- */
    var audio = new Audio(); audio.preload = "metadata";
    var cur = 0, vol = 6, jouant = false;
    var eq = document.getElementById("lec-eq").children;
    var play = document.getElementById("lec-play");
    var statut = document.getElementById("lec-statut");

    function piste() { return pistes[cur]; }
    function src(p) { var u = p.url || C.radioFlux || ""; return u && !/^https?:|^\/\//.test(u) ? R + u : u; }
    function temps(t) { if (!isFinite(t)) return "0:00"; var m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ":" + ("0" + s).slice(-2); }
    function barreVol() {
      var s = ""; for (var i = 0; i < 10; i++) s += i < vol ? "■" : "□";
      document.getElementById("lec-vol").textContent = s; audio.volume = vol / 10;
    }
    function maj() {
      document.getElementById("lec-titre").textContent = piste().titre;
      document.getElementById("lec-artiste").textContent = piste().artiste;
      Array.prototype.forEach.call(document.querySelectorAll(".lec__piste"), function (b, i) { b.classList.toggle("is-actif", i === cur); });
      play.textContent = jouant ? "❚❚" : "▶";
      document.getElementById("lec-eq").classList.toggle("is-jeu", jouant);
      var dispo = !!src(piste());
      statut.textContent = !dispo ? "Piste " + (cur + 1) + " sur " + pistes.length + " — bientôt en ligne"
        : (jouant ? "Lecture" : "Pause") + " — " + temps(audio.currentTime) + " / " + temps(audio.duration) + " · piste " + (cur + 1) + "/" + pistes.length;
    }
    function lance(i) {
      cur = (i + pistes.length) % pistes.length;
      var u = src(piste());
      if (!u) { audio.pause(); jouant = false; maj(); return; }
      audio.src = u; audio.play().then(function () { jouant = true; maj(); }).catch(function () { jouant = false; maj(); });
      maj();
    }
    audio.addEventListener("ended", function () { lance(cur + 1); });
    audio.addEventListener("timeupdate", maj);
    audio.addEventListener("loadedmetadata", maj);
    audio.addEventListener("pause", function () { if (!audio.ended) { jouant = false; maj(); } });
    audio.addEventListener("play", function () { jouant = true; maj(); });
    var pret = src(pistes[0]); if (pret) audio.src = pret;
    document.getElementById("fen-lecteur").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.i) lance(+b.dataset.i);
      else if (b.dataset.c === "play") { if (jouant) audio.pause(); else if (audio.src && !audio.ended && audio.currentTime > 0) audio.play(); else lance(cur); }
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
