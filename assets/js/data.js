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

  /* ---------------- L'ordre du programme ----------------
     Une journée se lit VAGUE PAR VAGUE. Une vague, c'est le tour de
     séances qui part à peu près en même temps — au plus une par
     salle. On lit toute la vague de 19 h, salle par salle, puis la
     vague suivante.

     À l'intérieur d'une vague, les séances suivent l'ordre du
     programme papier : Salle 1, Salle 2, puis le Hall-Bar.

     Pourquoi une vague, et pas l'heure exacte ? Parce qu'un tour de
     séances ne part pas toujours à la même minute dans les deux
     salles : le vendredi, la Salle 1 enchaîne à 21:15, le temps que
     finisse le long film de 19 h, quand la Salle 2 part à 21:00.
     Trié à la minute près, le vendredi se lisait Salle 1, Salle 2,
     puis Salle 2, Salle 1 — l'inverse de tous les autres jours.

     Sanity ne sait pas ranger ainsi : c'est donc fait ici, une seule
     fois, pour toutes les pages du site. La règle est celle de
     sanity/salles.ts, qui reste la source unique des noms de salles
     et de leur ordre ; verifications/ordre-des-seances.mjs compare
     les deux copies pour qu'elles ne puissent plus diverger.

     Une salle inconnue — un nom saisi à la main, une salle ajoutée
     là-bas mais pas ici — n'est jamais perdue : elle se range
     simplement après les autres, par ordre alphabétique. */
  var ORDRE_SALLES = ["Salle 1", "Salle 2", "Hall-Bar"];

  /* Écart maximal entre la première séance d'une vague et les
     suivantes : une demi-heure, le décalage que l'on se permet entre
     deux salles. Au-delà, ce n'est plus le même tour de séances — une
     matinée et une soirée ne se lisent pas ensemble. */
  var ECART_MEME_VAGUE_MIN = 30;

  function rangSalle(nom) {
    var rang = ORDRE_SALLES.indexOf(String(nom || ""));
    return rang === -1 ? ORDRE_SALLES.length : rang;
  }

  /* « 21:15 » → 1275, le nombre de minutes depuis minuit.
     Null si l'heure est illisible ou absente. */
  function heureEnMinutes(heure) {
    var lu = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(heure == null ? "" : heure));
    if (!lu) return null;
    return Number(lu[1]) * 60 + Number(lu[2]);
  }

  /* L'ordre à la minute près : la date, puis l'heure, puis la salle. */
  function comparerParHeure(a, b) {
    var parDate = String(a.date || "").localeCompare(String(b.date || ""));
    if (parDate !== 0) return parDate;
    /* Les heures se comparent en minutes, pas en texte : « 9:30 »
       écrit sans son zéro passerait sinon après « 21:00 ». Une heure
       illisible se range en fin de journée plutôt que de jeter la
       liste entière par terre. */
    var minutesA = heureEnMinutes(a.time);
    var minutesB = heureEnMinutes(b.time);
    if (minutesA === null) minutesA = Number.MAX_SAFE_INTEGER;
    if (minutesB === null) minutesB = Number.MAX_SAFE_INTEGER;
    if (minutesA !== minutesB) return minutesA - minutesB;
    var rangA = rangSalle(a.room);
    var rangB = rangSalle(b.room);
    if (rangA !== rangB) return rangA - rangB;
    /* Deux salles hors liste : l'ordre alphabétique, pour que
       l'affichage reste le même d'un chargement à l'autre. */
    return String(a.room || "").localeCompare(String(b.room || ""));
  }

  /* Range des séances dans l'ordre du programme : les vagues l'une
     après l'autre, et dans chaque vague Salle 1, Salle 2, Hall-Bar.
     La liste reçue n'est jamais modifiée. Les séances peuvent couvrir
     plusieurs jours : une vague ne franchit jamais un changement de
     date. */
  function ordonnerSeances(seances) {
    var parHeure = seances.slice().sort(comparerParHeure);
    var vagues = [];
    var vague = null;
    var dateDeLaVague = "";
    var debutDeLaVague = null;
    var sallesDeLaVague = [];

    parHeure.forEach(function (seance) {
      var minutes = heureEnMinutes(seance.time);
      var salle = String(seance.room || "");
      /* La séance rejoint la vague en cours si c'est le même jour, si
         sa salle n'y joue pas déjà, et si elle part dans la demi-heure
         qui suit l'ouverture de la vague. Une heure illisible ne
         rejoint jamais rien : on ne sait pas où elle tombe. */
      var memeVague =
        vague !== null &&
        minutes !== null &&
        debutDeLaVague !== null &&
        String(seance.date || "") === dateDeLaVague &&
        minutes - debutDeLaVague <= ECART_MEME_VAGUE_MIN &&
        sallesDeLaVague.indexOf(salle) === -1;

      if (memeVague) {
        vague.push(seance);
        sallesDeLaVague.push(salle);
      } else {
        vague = [seance];
        vagues.push(vague);
        dateDeLaVague = String(seance.date || "");
        debutDeLaVague = minutes;
        sallesDeLaVague = [salle];
      }
    });

    var rangees = [];
    vagues.forEach(function (groupe) {
      groupe.sort(function (a, b) {
        return rangSalle(a.room) - rangSalle(b.room) || comparerParHeure(a, b);
      });
      rangees = rangees.concat(groupe);
    });
    return rangees;
  }

  /* Range une liste de séances sans jamais faire tomber la page : une
     réponse d'erreur ou une valeur inattendue est renvoyée telle
     quelle, aux pages de l'interpréter. */
  function trierSeances(seances) {
    if (!Array.isArray(seances)) return seances;
    return ordonnerSeances(seances);
  }

  /* ---------------- Morceaux de requête réutilisés ---------------- */

  /* Le jour de sa sortie, un film annoncé passe à l'affiche tout
     seul : personne n'a à rouvrir sa fiche le mercredi matin. Dès que
     sa date de sortie est atteinte, le site le traite partout comme
     « À l'affiche » — il quitte la page Événements, rejoint la
     rubrique À l'affiche de la page Films et monte sur l'accueil.
     Sans date de sortie, c'est le Studio qui décide. Les requêtes qui
     utilisent CHAMPS_FILM passent donc toutes le paramètre $today. */
  var FILM_SORTI = 'status == "prochainement" && defined(releaseDate) && releaseDate <= $today';
  var STATUT_DU_JOUR = '"status":select(' + FILM_SORTI + ' => "a-laffiche", status)';

  var CHAMPS_FILM =
    '_id,"slug":coalesce(slug.current,_id),title,originalTitle,director,year,country,duration,' +
    "language,subtitles,ageRating,typeDeFilm,genres," + STATUT_DU_JOUR +
    ",releaseDate,synopsis,poster,stillImages,trailerUrl," +
    "presence,presenceDate," +
    'price,sumupCheckoutUrl,presseUrl';

  var CHAMPS_SEANCE =
    "_id,date,time,room,versionNote,status,price,sumupCheckoutUrl," +
    '"film":film->{_id,"slug":coalesce(slug.current,_id),title,director,duration,language,subtitles,poster}';

  var CHAMPS_EVENEMENT =
    '_id,title,"slug":coalesce(slug.current,_id),category,dateDebut,dateFin,image,excerpt,body,' +
    'linkUrl,linkLabel,"films":films[]->{_id,"slug":coalesce(slug.current,_id),title,poster}';

  var CHAMPS_REGLAGES =
    "shareImage,address,phone,phoneSecondary,email," +
    "openingHours,accessInfo,mapUrl,tarifPlein,tarifReduit,conditionsReduit,salles," +
    '"remerciements": remerciements[]{nom,mention,url},' +
    "socialLinks,seoDescription";

  /* ---------------- API publique ---------------- */
  var ZinemaData = {
    ERREUR: ERREUR,
    estUneErreur: estUneErreur,
    billetterieEnLigne: BILLETTERIE_EN_LIGNE,
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    aujourdhui: aujourdhui,
    /* L'ordre du programme : les vagues de séances l'une après
       l'autre, et dans chaque vague Salle 1, Salle 2, Hall-Bar.
       C'est la SEULE porte d'entrée : les pages qui regroupent les
       séances elles-mêmes (l'agenda, jour par jour) la rappellent sur
       chaque groupe, et rangent donc exactement comme ici. */
    trierSeances: trierSeances,

    /** Tous les films encore d'actualité, les « terminés » exclus. */
    getFilms: function () {
      return cachee("films", function () {
        return sanityFetch(
          '*[_type == "film" && status != "passe"] | order(title asc) {' + CHAMPS_FILM + "}",
          { today: aujourdhui() }
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
      ).then(function (film) {
        if (film && !estUneErreur(film)) film.screenings = trierSeances(film.screenings);
        return film;
      });
    },

    /** Les séances d'aujourd'hui et des jours suivants. */
    getScreenings: function () {
      return cachee("seances", function () {
        return sanityFetch(
          '*[_type == "screening" && date >= $today] | order(date asc, time asc) {' +
            CHAMPS_SEANCE + "}",
          { today: aujourdhui() }
        ).then(trierSeances);
      });
    },

    /** Les films que la page Événements annonce d'elle-même : ceux
        qui sortent prochainement (le jour de leur sortie, ils
        quittent la page tout seuls), et ceux qui passent en présence
        de quelqu'un. Un film peut être les deux : il n'est alors annoncé
        qu'une fois, la requête ne le renvoyant qu'une fois.

        Chacun repart avec sa prochaine séance non annulée, pour
        pouvoir dire QUAND venir — sans elle, « en présence de la
        réalisatrice » n'apprend rien d'utile. */
    getFilmsAnnonces: function () {
      return cachee("films-annonces", function () {
        return sanityFetch(
          '*[_type == "film" && status != "passe" && ' +
            '((status == "prochainement" && !(' + FILM_SORTI + ')) || ' +
            '(defined(presence) && presence != ""))]{' + CHAMPS_FILM +
            ',"prochaineSeance": *[_type == "screening" && references(^._id) && ' +
            'date >= $today && status != "annule"] | order(date asc, time asc)[0]{date,time}}',
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
    /** La page Histoire : la phrase d'accueil et les étapes de la
        frise, dans une seule fiche. */
    getHistoire: function () {
      return cachee("histoire", function () {
        return sanityFetch(
          '*[_type == "histoire"][0]{intro,etapes[]{year,title,body,image}}'
        );
      });
    },

    /** Les réglages du cinéma : adresse, tarifs, horaires, réseaux. */
    getReglages: function () {
      return cachee("reglages", function () {
        return sanityFetch('*[_type == "siteSettings"][0]{' + CHAMPS_REGLAGES + "}");
      });
    },

    /** La page Location : les espaces à louer et leurs conditions. */
    getLocation: function () {
      return cachee("location", function () {
        return sanityFetch(
          '*[_type == "location"][0]{intro,occasions,conditions,' +
            '"espaces": espaces[]{nom,places,description,equipements,tarif,image}}'
        );
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
  };

  global.ZinemaData = ZinemaData;
})(window);
