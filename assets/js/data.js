/* ============================================================
   Zinéma — accès au contenu

   Une seule source de vérité : Sanity. Ce qui est publié dans le
   Studio est exactement ce qui s'affiche, immédiatement, sans
   reconstruire ni redéployer le site.

   RÈGLE IMPORTANTE : il n'existe AUCUN contenu de secours dans ce
   fichier. Une rubrique vide dans Sanity donne une rubrique vide
   sur le site, avec un message clair — jamais un faux film, une
   fausse annonce ou une fausse adresse. C'est ce qui garantit que
   l'on voit toujours ce que l'on vient de publier, et rien d'autre.

   Chaque fonction ci-dessous répond :
     - un tableau / un objet  → le contenu publié ;
     - un tableau vide / null → Sanity a répondu, il n'y a rien ;
     - ZinemaData.ERREUR      → Sanity n'a pas pu être joint
                                (réseau coupé, CORS, panne).
   Les pages distinguent ces trois cas pour afficher le bon message.
   ============================================================ */
(function (global) {
  "use strict";

  /* Ces deux valeurs ne sont pas secrètes : elles sont visibles par
     tous les visiteurs, comme sur n'importe quel site. Voir SANITY.md. */
  var SANITY_PROJECT_ID = "vle63mzm";
  var SANITY_DATASET = "production";
  var SANITY_API_VERSION = "2024-06-01";

  /* ---------------- Billetterie en ligne ----------------
     true  = le site ouvre son panneau d'achat, le serveur calcule le
             prix, crée le paiement et envoie le billet par e-mail.
     false = repli : les boutons d'achat ouvrent le lien de paiement
             SumUp collé à la main dans le Studio.

     Ouverte le 2026-09-08, après avoir vérifié la chaîne entière
     par un vrai paiement : carte encaissée, commande enregistrée,
     billet reçu. Voir BILLETTERIE.md.

     Repasser à false suffit à refermer la caisse sans rien casser :
     les liens SumUp du Studio reprennent la main immédiatement. */
  var BILLETTERIE_EN_LIGNE = true;

  /* Marqueur renvoyé quand Sanity est injoignable. */
  var ERREUR = { __erreurReseau: true };
  function estUneErreur(valeur) {
    return valeur === ERREUR;
  }

  var API_BASE =
    "https://" + SANITY_PROJECT_ID + ".api.sanity.io/v" + SANITY_API_VERSION +
    "/data/query/" + SANITY_DATASET;

  function sanityFetch(query, params) {
    /* « perspective=published » : Sanity ne renvoie que les documents
       publiés. Sans ce mot, le site sert AUSSI les brouillons — le
       jeu de données est public en lecture, donc les brouillons le
       sont aussi. Un film à moitié rempli s'afficherait, et un film
       en cours de modification apparaîtrait deux fois : une fois
       publié, une fois en brouillon. C'est ce qui garantit la
       promesse faite dans SANITY.md — tant qu'on n'a pas cliqué sur
       « Publish », personne ne voit rien. */
    var url = API_BASE + "?perspective=published&query=" + encodeURIComponent(query);
    if (params) {
      Object.keys(params).forEach(function (key) {
        url += "&$" + key + "=" + encodeURIComponent(JSON.stringify(params[key]));
      });
    }
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Sanity a répondu " + res.status);
        return res.json();
      })
      .then(function (json) {
        return json.result;
      })
      .catch(function (err) {
        // Réseau coupé, CORS non autorisé, projet invalide : on le dit,
        // on n'invente pas de contenu à la place.
        if (global.console && console.warn) {
          console.warn("Zinéma — contenu indisponible :", err && err.message);
        }
        return ERREUR;
      });
  }

  /* Les requêtes appelées sur plusieurs pages ne partent qu'une fois. */
  var cache = {};
  function cachee(cle, executer) {
    if (!cache[cle]) cache[cle] = executer();
    return cache[cle];
  }

  /* La date du jour au format Sanity (AAAA-MM-JJ), heure locale. */
  function aujourdhui() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0")
    );
  }

  /* ---------------- Morceaux de requête réutilisés ---------------- */
  var CHAMPS_FILM =
    '_id,"slug":coalesce(slug.current,_id),title,originalTitle,director,year,country,duration,' +
    "language,subtitles,ageRating,genres,status,releaseDate,synopsis,poster,stillImages,trailerUrl," +
    'price,sumupCheckoutUrl,"review":review->{_id,quote,author,source,url}';

  var CHAMPS_SEANCE =
    "_id,date,time,room,versionNote,status,price,sumupCheckoutUrl," +
    '"film":film->{_id,"slug":coalesce(slug.current,_id),title,director,duration,language,subtitles,poster}';

  var CHAMPS_EVENEMENT =
    '_id,title,"slug":coalesce(slug.current,_id),category,dateDebut,dateFin,image,excerpt,body,' +
    'linkUrl,linkLabel,"films":films[]->{_id,"slug":coalesce(slug.current,_id),title,poster}';

  var CHAMPS_REGLAGES =
    "logo,shareImage,address,phone,phoneSecondary,email," +
    "openingHours,accessInfo,mapUrl,tarifPlein,tarifReduit,conditionsReduit,salles," +
    "socialLinks,seoDescription";

  /* ---------------- API publique ---------------- */
  var ZinemaData = {
    ERREUR: ERREUR,
    estUneErreur: estUneErreur,
    billetterieEnLigne: BILLETTERIE_EN_LIGNE,
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    aujourdhui: aujourdhui,

    /** Tous les films encore d'actualité, les « terminés » exclus. */
    getFilms: function () {
      return cachee("films", function () {
        return sanityFetch(
          '*[_type == "film" && status != "passe"] | order(title asc) {' + CHAMPS_FILM + "}"
        );
      });
    },

    /** Un film et ses séances à venir, par son adresse (slug). */
    getFilmBySlug: function (slug) {
      if (!slug) return Promise.resolve(null);
      /* On accepte l'adresse choisie dans le Studio comme
         l'identifiant interne : ainsi une fiche dont personne n'a
         rempli l'adresse reste parfaitement accessible. */
      return sanityFetch(
        '*[_type == "film" && (slug.current == $slug || _id == $slug)][0]{' + CHAMPS_FILM +
          ',"screenings": *[_type == "screening" && references(^._id) && date >= $today]' +
          " | order(date asc, time asc) {" + CHAMPS_SEANCE + "}}",
        { slug: slug, today: aujourdhui() }
      );
    },

    /** Les séances d'aujourd'hui et des jours suivants. */
    getScreenings: function () {
      return cachee("seances", function () {
        return sanityFetch(
          '*[_type == "screening" && date >= $today] | order(date asc, time asc) {' +
            CHAMPS_SEANCE + "}",
          { today: aujourdhui() }
        );
      });
    },

    /** Les événements en cours ou à venir (les passés s'archivent seuls). */
    getEvenements: function () {
      return cachee("evenements", function () {
        return sanityFetch(
          '*[_type == "evenement" && (!defined(dateFin) || dateFin >= $today)]' +
            " | order(dateDebut asc) {" + CHAMPS_EVENEMENT + "}",
          { today: aujourdhui() }
        );
      });
    },

    /** Les étapes de la frise de la page Histoire. */
    getHistory: function () {
      return cachee("histoire", function () {
        return sanityFetch(
          '*[_type == "historyEntry"] | order(order asc) {_id,year,title,body,image,order}'
        );
      });
    },

    /** Les réglages du cinéma : adresse, tarifs, horaires, réseaux, logo. */
    getReglages: function () {
      return cachee("reglages", function () {
        return sanityFetch('*[_type == "siteSettings"][0]{' + CHAMPS_REGLAGES + "}");
      });
    },

    /** Les formules d'abonnement et les coordonnées bancaires. */
    getAbonnements: function () {
      return cachee("abonnements", function () {
        return sanityFetch(
          '*[_type == "abonnements"][0]{intro,formules,beneficiaire,iban,ccp,banque,notePaiement}'
        );
      });
    },

    /* ---------------- Les pages du site ----------------
       Une fiche par page (Accueil, Films, Agenda, Événements,
       Histoire, Abonnements, Infos pratiques) : titre de l'onglet,
       introduction, message quand il n'y a rien, description pour
       Google. Les sept fiches arrivent en une seule requête, puis
       chaque page pioche la sienne. */
    getPages: function () {
      return cachee("pages", function () {
        return sanityFetch(
          '*[_type == "page"]{pageId,titre,intro,seoDescription}'
        ).then(function (liste) {
          if (estUneErreur(liste)) return liste;
          var parId = {};
          (liste || []).forEach(function (p) {
            if (p && p.pageId) parId[p.pageId] = p;
          });
          return parId;
        });
      });
    },

    /** La fiche d'une page précise, ou null si elle n'existe pas. */
    getPage: function (pageId) {
      return ZinemaData.getPages().then(function (pages) {
        if (estUneErreur(pages)) return null;
        return pages[pageId] || null;
      });
    },
  };

  global.ZinemaData = ZinemaData;
})(window);
