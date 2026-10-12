/* ============================================================
   Zinéma — le « Texte complet » d'un événement, tel que le cinéma
   l'a mis en forme dans le Studio : gras, italique, souligné,
   barré, titres, listes à puces ou numérotées, liens.

   Sanity le stocke en « blocs » (un bloc par paragraphe). Tout ce
   qui vient du Studio est échappé avant d'être écrit ; un lien
   n'est gardé que s'il mène vers le web, un e-mail ou un numéro
   de téléphone — jamais vers du « javascript: ».

   Utilisé sur la page Événements (evenement-rangee.js) et sur le
   détail d'un événement (evenement-detail.js).
   ============================================================ */
(function (global) {
  "use strict";

  var R = global.ZinemaRender;

  /* Les décorations du Studio et leur balise HTML. */
  var BALISES = {
    strong: "strong",
    em: "em",
    underline: "u",
    "strike-through": "s",
    code: "code",
  };

  var LIEN_SUR = /^(https?:|mailto:|tel:)/i;

  /* Une adresse saisie sans « https:// » (« raphaelverona.com »)
     reste cliquable. */
  function adresseDuLien(href) {
    var h = typeof href === "string" ? href.trim() : "";
    if (!h) return "";
    if (LIEN_SUR.test(h)) return h;
    return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(h) ? "https://" + h : "";
  }

  function lienHTML(contenu, definition) {
    var href = adresseDuLien(definition && definition.href);
    if (!href) return contenu;
    return (
      '<a href="' + R.escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' +
      contenu + "</a>"
    );
  }

  /* Un morceau de texte, avec ses décorations et son lien. Les
     retours à la ligne (Maj + Entrée) sont gardés. */
  function morceauHTML(enfant, definitions) {
    var html = R.escapeHtml((enfant && enfant.text) || "").replace(/\n/g, "<br>");
    (enfant.marks || []).forEach(function (marque) {
      if (BALISES[marque]) {
        html = "<" + BALISES[marque] + ">" + html + "</" + BALISES[marque] + ">";
      } else if (definitions[marque] && definitions[marque]._type === "link") {
        html = lienHTML(html, definitions[marque]);
      }
    });
    return html;
  }

  function contenuDuBloc(bloc) {
    var definitions = {};
    (bloc.markDefs || []).forEach(function (d) {
      if (d && d._key) definitions[d._key] = d;
    });
    /* Un retour à la ligne laissé en fin de paragraphe n'ajouterait
       qu'un vide. */
    return (bloc.children || [])
      .map(function (enfant) { return enfant ? morceauHTML(enfant, definitions) : ""; })
      .join("")
      .replace(/(<br>)+((<\/[a-z]+>)*)$/, "$2");
  }

  function estVide(bloc) {
    return !(bloc.children || []).some(function (e) {
      return e && typeof e.text === "string" && e.text.trim();
    });
  }

  /* Un paragraphe ou un titre. Les titres du Studio (« Heading 1 »
     à « Heading 6 ») deviennent tous un intertitre : la carte a
     déjà son grand titre. */
  function paragrapheHTML(bloc) {
    var contenu = contenuDuBloc(bloc);
    if (/^h[1-6]$/.test(bloc.style)) return '<h3 class="texte-riche__titre">' + contenu + "</h3>";
    if (bloc.style === "blockquote") return "<blockquote>" + contenu + "</blockquote>";
    return "<p>" + contenu + "</p>";
  }

  /* Les éléments de liste qui se suivent forment une seule liste ;
     un niveau plus profond ouvre une sous-liste. */
  function listesHTML(blocs, debut) {
    var niveau = blocs[debut].level || 1;
    var balise = blocs[debut].listItem === "number" ? "ol" : "ul";
    var html = "<" + balise + ">";
    var i = debut;
    while (i < blocs.length && blocs[i].listItem && (blocs[i].level || 1) >= niveau) {
      if ((blocs[i].level || 1) > niveau) {
        var sous = listesHTML(blocs, i);
        html = html.replace(/<\/li>$/, sous.html + "</li>");
        i = sous.fin;
        continue;
      }
      html += "<li>" + contenuDuBloc(blocs[i]) + "</li>";
      i += 1;
    }
    return { html: html + "</" + balise + ">", fin: i };
  }

  /** Le texte complet en HTML, ou "" s'il n'y a rien à lire. */
  function html(blocs) {
    if (!Array.isArray(blocs)) return "";
    var utiles = blocs.filter(function (b) {
      return b && b._type === "block" && !estVide(b);
    });
    var sortie = "";
    var i = 0;
    while (i < utiles.length) {
      if (utiles[i].listItem) {
        var liste = listesHTML(utiles, i);
        sortie += liste.html;
        i = liste.fin;
      } else {
        sortie += paragrapheHTML(utiles[i]);
        i += 1;
      }
    }
    return sortie ? '<div class="texte-riche">' + sortie + "</div>" : "";
  }

  global.ZinemaTexteRiche = { html: html };
})(window);
