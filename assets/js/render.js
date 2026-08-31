/* ============================================================
   Zinéma — fonctions d'affichage partagées entre les pages
   ============================================================ */
(function (global) {
  "use strict";

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function hashString(input) {
    var hash = 0;
    for (var i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  var statusLabels = {
    "a-laffiche": "À l'affiche",
    "avant-premiere": "Avant-première",
    prochainement: "Prochainement",
    cycle: "Cycle",
    passe: "Passé",
  };
  function statusLabel(status) {
    return statusLabels[status] || status;
  }

  /* Les filtres de la page Films, dans l'ordre voulu. Libellés plus
     courts que les statuts complets : ils tiennent sur une rangée. */
  var filtresFilms = [
    { statut: "a-laffiche", label: "À l'affiche" },
    { statut: "avant-premiere", label: "Première" },
    { statut: "prochainement", label: "Prochainement" },
    { statut: "cycle", label: "Cycles" },
  ];

  /* ---------------- Tarifs ----------------
     Les prix ne sont plus écrits dans le code : ils viennent des
     « Réglages du cinéma » dans Sanity, et sont donc modifiables
     sans toucher au site. Une séance ou un film peut toujours
     imposer son propre prix (ciné-goûter, soirée spéciale) : il
     prend alors le pas sur les tarifs habituels. */
  function montant(valeur) {
    if (typeof valeur !== "number" || !isFinite(valeur)) return null;
    return valeur % 1 === 0 ? valeur + ".-" : valeur.toFixed(2);
  }
  function tarifsResume(reglages) {
    var plein = montant(reglages && reglages.tarifPlein);
    var reduit = montant(reglages && reglages.tarifReduit);
    if (plein && reduit) return plein + " / " + reduit + " réduit";
    return plein || reduit || "";
  }
  function prixLabel(film, seance, reglages) {
    return (
      (seance && seance.price) ||
      (film && film.price) ||
      tarifsResume(reglages)
    );
  }

  /* ---------------- Dates, en français, sans dépendance ---------------- */
  var DOW_LONG = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var DOW_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  var MONTH_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  function parseISODate(dateStr) {
    return new Date(dateStr + "T00:00:00");
  }
  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function isToday(date) {
    return isSameDay(date, new Date());
  }
  function isTomorrow(date) {
    var t = new Date();
    t.setDate(t.getDate() + 1);
    return isSameDay(date, t);
  }
  function formatDayHeading(dateStr) {
    var date = parseISODate(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    return DOW_LONG[date.getDay()] + " " + date.getDate() + " " + MONTH_LONG[date.getMonth()];
  }
  function formatLongDate(dateStr) {
    var date = parseISODate(dateStr);
    return date.getDate() + " " + MONTH_LONG[date.getMonth()] + " " + date.getFullYear();
  }
  function formatDowShort(dateStr) {
    var date = parseISODate(dateStr);
    return DOW_SHORT[date.getDay()].toUpperCase();
  }

  /* ---------------- Bande-annonce ---------------- */
  function toEmbedUrl(url) {
    if (!url) return null;
    try {
      var u = new URL(url);
      if (u.hostname.indexOf("youtube.com") !== -1) {
        var id = u.searchParams.get("v");
        if (id) return "https://www.youtube-nocookie.com/embed/" + id;
        if (u.pathname.indexOf("/embed/") === 0) return url;
        var parts = u.pathname.split("/");
        var shortId = parts[parts.length - 1];
        if (shortId) return "https://www.youtube-nocookie.com/embed/" + shortId;
      }
      if (u.hostname.indexOf("youtu.be") !== -1) {
        var ytId = u.pathname.replace("/", "");
        if (ytId) return "https://www.youtube-nocookie.com/embed/" + ytId;
      }
      if (u.hostname.indexOf("vimeo.com") !== -1) {
        var segs = u.pathname.split("/").filter(Boolean);
        var vId = segs[segs.length - 1];
        if (vId) return "https://player.vimeo.com/video/" + vId;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  /* ---------------- Image Sanity ---------------- */
  function hasRealImage(img) {
    return Boolean(img && img.asset && (img.asset._ref || img.asset._id));
  }
  /* Il n'existe plus d'image « locale » de secours : une image vient
     de Sanity, ou n'existe pas. C'est ce qui garantit qu'on voit
     toujours l'image que l'on vient de déposer, et jamais l'ancienne. */
  function sanityImageUrl(img, width) {
    if (!hasRealImage(img) || !global.ZinemaData.projectId) return null;
    var ref = img.asset._ref || img.asset._id || "";
    var m = ref.match(/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/);
    if (!m) return null;
    var id = m[1], w = m[2], h = m[3], format = m[4];
    var base = "https://cdn.sanity.io/images/" + global.ZinemaData.projectId + "/" + global.ZinemaData.dataset + "/" + id + "-" + w + "x" + h + "." + format;
    return base + "?w=" + (width || 1200) + "&fit=crop&auto=format";
  }

  /* ---------------- Affiches ---------------- */
  function generatedPosterHTML(title, director, year, seed) {
    var variant = hashString(seed) % 5;
    var t = escapeHtml(title), d = escapeHtml(director || ""), y = escapeHtml(year || "");
    if (variant === 0) {
      return (
        '<div class="generated-poster generated-poster--0">' +
        '<div class="gp-row"><span class="gp-year">' + y + '</span><span class="gp-title">' + t + '</span><span></span></div>' +
        '<div class="gp-director">' + d + '</div></div>'
      );
    }
    if (variant === 1) {
      return (
        '<div class="generated-poster generated-poster--1">' +
        '<div class="gp-top"><span>' + d + '</span><span>' + y + '</span></div>' +
        '<div class="gp-mid"><span class="stroke-text">' + t + '</span></div>' +
        '<div class="gp-bar"></div></div>'
      );
    }
    if (variant === 2) {
      return (
        '<div class="generated-poster generated-poster--2">' +
        '<div class="gp-clip"></div>' +
        '<div class="gp-top">' + y + ' — ' + d + '</div>' +
        '<div class="gp-title">' + t + '</div></div>'
      );
    }
    if (variant === 3) {
      return (
        '<div class="generated-poster generated-poster--3">' +
        '<div class="gp-title">' + t + '</div>' +
        '<div class="gp-bottom"><span class="gp-director">' + d + '</span><span class="gp-year">' + y + '</span></div></div>'
      );
    }
    return (
      '<div class="generated-poster generated-poster--4">' +
      '<div class="gp-frame"><div class="gp-spacer"></div>' +
      '<div class="gp-title">' + t + '</div>' +
      '<div class="gp-bottom"><span>' + d + '</span><span>' + y + '</span></div></div></div>'
    );
  }

  /* Le texte alternatif saisi dans Sanity ; à défaut, le titre. */
  function altDeLImage(img, secours) {
    return escapeHtml((img && img.alt) || secours || "");
  }

  function posterHTML(film, opts) {
    opts = opts || {};
    var src = sanityImageUrl(film.poster, 1200);
    if (src) {
      var loading = opts.priority ? "eager" : "lazy";
      return (
        '<div class="poster"><img src="' + src +
        '" alt="' + altDeLImage(film.poster, "Affiche de " + film.title) +
        '" loading="' + loading + '"></div>'
      );
    }
    /* Pas d'affiche déposée : une affiche typographique, construite à
       partir du titre. Elle disparaît dès qu'une vraie affiche est
       ajoutée dans le Studio. */
    return generatedPosterHTML(film.title, film.director, film.year, film.slug);
  }

  /* ---------------- États d'une page ----------------
     Trois situations, trois messages honnêtes — jamais de contenu
     inventé pour combler un vide. */
  function etatChargement(quoi) {
    return (
      '<p class="etat etat--chargement" role="status">Chargement ' +
      escapeHtml(quoi || "du contenu") + "…</p>"
    );
  }
  function etatVide(message) {
    return '<p class="etat etat--vide">' + escapeHtml(message) + "</p>";
  }
  function etatErreur() {
    return (
      '<p class="etat etat--erreur" role="alert">Le contenu du site n\'a pas pu être chargé. ' +
      "Vérifiez votre connexion et rechargez la page.</p>"
    );
  }

  global.ZinemaRender = {
    escapeHtml: escapeHtml,
    hashString: hashString,
    statusLabel: statusLabel,
    filtresFilms: filtresFilms,
    prixLabel: prixLabel,
    tarifsResume: tarifsResume,
    montant: montant,
    altDeLImage: altDeLImage,
    etatChargement: etatChargement,
    etatVide: etatVide,
    etatErreur: etatErreur,
    formatDayHeading: formatDayHeading,
    formatLongDate: formatLongDate,
    formatDowShort: formatDowShort,
    isToday: isToday,
    parseISODate: parseISODate,
    toEmbedUrl: toEmbedUrl,
    hasRealImage: hasRealImage,
    sanityImageUrl: sanityImageUrl,
    posterHTML: posterHTML,
    generatedPosterHTML: generatedPosterHTML,
  };
})(window);
