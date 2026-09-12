import { defineField, defineType } from "sanity";

import { ChampSeancesDuFilm } from "../plugins/planification/components/ChampSeancesDuFilm";

/* ============================================================
   Un film à l'affiche, à venir, ou terminé.

   Le formulaire n'a volontairement AUCUN onglet : tout se lit du
   haut vers le bas, dans l'ordre où l'on remplit une fiche de
   film. L'affiche est le deuxième champ, juste sous le titre —
   impossible de la manquer en créant un nouveau film. Les deux
   seuls réglages rarement utiles (adresse de la page, prix
   particulier) sont dans des encadrés, en bas.

   Aucun réglage de mise en page : le site place les affiches tout
   seul, il n'y a rien à « régler » pour que ce soit joli.
   ============================================================ */

export const film = defineType({
  name: "film",
  title: "Film",
  type: "document",
  fieldsets: [
    {
      name: "adresse",
      title: "Adresse de la page sur le site (facultatif)",
      options: { collapsible: true, collapsed: true },
    },
    {
      name: "billetterie",
      title: "Prix particulier — à ouvrir seulement en cas d'exception",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titre du film",
      type: "string",
      validation: (Rule) => Rule.required().error("Le titre est obligatoire."),
    }),

    /* L'affiche, tout de suite : c'est elle qui représente le film
       partout, et c'est la première chose qu'on a sous la main en
       créant une fiche. */
    defineField({
      name: "poster",
      title: "Affiche du film",
      type: "imageZinema",
      description:
        "Glissez l'affiche ici, ou cliquez pour choisir un fichier. Image verticale (format portrait), 800 px de large minimum. C'est LA seule affiche du film : elle s'affiche sur l'accueil, la page Films, la fiche du film et l'agenda. La remplacer ici la remplace partout, immédiatement.",
      validation: (Rule) =>
        Rule.required().error(
          "Un film sans affiche ne peut pas être publié : c'est elle qui le représente sur tout le site."
        ),
    }),

    defineField({
      name: "director",
      title: "Réalisation",
      type: "string",
      description: "Ex. Francesco Sossai. Plusieurs noms : séparez par « & ».",
      validation: (Rule) => Rule.required().error("Indiquez qui a réalisé le film."),
    }),
    defineField({
      name: "duration",
      title: "Durée en minutes",
      type: "number",
      description:
        "Uniquement le nombre, ex. 94. Important : c'est la durée qui permet au site de repérer tout seul deux films qui se chevaucheraient dans la même salle.",
      validation: (Rule) =>
        Rule.min(1)
          .max(600)
          .warning(
            "Sans durée, le site ne peut pas repérer deux films qui se chevaucheraient dans la même salle. À compléter dès que possible."
          ),
    }),
    defineField({
      name: "year",
      title: "Année de sortie",
      type: "number",
      validation: (Rule) =>
        Rule.min(1895)
          .max(new Date().getFullYear() + 3)
          .warning("Cette année semble inhabituelle — vérifiez la saisie."),
    }),
    defineField({
      name: "country",
      title: "Pays",
      type: "string",
      description: "Ex. Suisse, France, Italie. Coproduction : « Suisse / France ».",
    }),
    defineField({
      name: "originalTitle",
      title: "Titre original",
      type: "string",
      description: "Seulement si le film sort sous un autre titre chez nous.",
    }),
    defineField({
      name: "language",
      title: "Version",
      type: "string",
      description: "Ex. VO italien, VF, VO anglais.",
    }),
    defineField({
      name: "subtitles",
      title: "Sous-titres",
      type: "string",
      description: "Ex. st fr, st fr/all. Laissez vide s'il n'y en a pas.",
    }),
    defineField({
      name: "ageRating",
      title: "Âge légal / âge conseillé",
      type: "string",
      description: "Ex. 12/14 ans, ou « Tous publics ».",
    }),
    defineField({
      name: "genres",
      title: "Genres",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "Tapez un genre puis Entrée. Ex. Documentaire, Comédie, Jeune public.",
    }),
    defineField({
      name: "synopsis",
      title: "Synopsis",
      type: "text",
      rows: 6,
      description:
        "Le résumé affiché sur la fiche du film et sur la page Films. Deux à six phrases suffisent.",
      validation: (Rule) =>
        Rule.max(1200).warning(
          "Très long — au-delà de ~1200 signes le texte devient difficile à lire sur téléphone."
        ),
    }),

    defineField({
      name: "status",
      title: "Où en est ce film ?",
      type: "string",
      description:
        "Détermine dans quelle partie de la page Films il apparaît. Passez-le sur « Terminé » quand il quitte l'affiche : il sort des pages publiques mais reste consultable ici.",
      options: {
        list: [
          { title: "À l'affiche — visible en premier sur le site", value: "a-laffiche" },
          { title: "Avant-première", value: "avant-premiere" },
          { title: "Prochainement — pas encore de séance", value: "prochainement" },
          { title: "Cycle / ciné-club", value: "cycle" },
          { title: "Terminé — retiré de l'affiche", value: "passe" },
        ],
        layout: "radio",
      },
      initialValue: "a-laffiche",
      validation: (Rule) => Rule.required(),
    }),

    /* La date de sortie n'a de sens que pour un film annoncé : le
       champ n'apparaît donc que si « Prochainement » est coché, et
       disparaît dès que le film passe à l'affiche. Sur le site, elle
       remplace la case des séances par « Sortie — à partir du … ». */
    defineField({
      name: "releaseDate",
      title: "Date de sortie",
      type: "date",
      options: { dateFormat: "DD/MM/YYYY" },
      description:
        "Le jour où le film arrive chez nous. Sur le site, la fiche du film annonce alors « À partir du mercredi 12 mars » à la place des séances. Laissez vide si la date n'est pas encore connue : le site écrira simplement « Date à venir ».",
      hidden: ({ document }) => document?.status !== "prochainement",
      validation: (Rule) =>
        Rule.custom((valeur, contexte) => {
          const statut = (contexte.document as { status?: string } | undefined)?.status;
          if (statut !== "prochainement" || valeur) return true;
          return "Sans date, le site affichera « Date à venir » : indiquez-la dès qu'elle est connue.";
        }).warning(),
    }),

    /* Le bloc « Séances » n'enregistre rien dans le film : il affiche
       ses séances à venir, permet de les marquer complètes ou annulées,
       d'en supprimer, et d'en ajouter plusieurs d'un coup. */
    defineField({
      name: "seancesDuFilm",
      title: "Séances de ce film",
      description:
        "Les horaires auxquels ce film passe. Tout se règle ici, sans quitter la fiche.",
      type: "string",
      components: { input: ChampSeancesDuFilm },
    }),

    /* ---------------- La séance en présence de quelqu'un ----------------
       Rempli, ce champ suffit : le film s'annonce tout seul sur la
       page Événements, sans qu'on ait à créer un événement à côté.
       Vide, il ne se passe rien — c'est le champ lui-même qui dit
       « oui » ou « non », il n'y a pas de case à cocher qui pourrait
       le contredire. */
    defineField({
      name: "presence",
      title: "Séance en présence de…",
      type: "string",
      description:
        "Le nom de l'invité·e, écrit tel qu'il doit se lire après « En présence de ». Ex. « la réalisatrice Jeanne Dupont », « l'équipe du film », « Jean Dupont, monteur ». Le film apparaît alors tout seul sur la page Événements. Laissez vide s'il n'y a pas d'invité.",
    }),
    defineField({
      name: "presenceDate",
      title: "Jour de cette séance",
      type: "date",
      options: { dateFormat: "DD/MM/YYYY" },
      /* Inutile de demander un jour tant qu'il n'y a pas d'invité :
         le champ n'apparaît qu'une fois le nom écrit. */
      hidden: ({ document }) => !document?.presence,
      description:
        "Le jour où l'invité·e sera là, s'il ne vient que pour une séance. Laissez vide s'il est présent à toutes les séances du film : la page Événements annoncera alors la prochaine.",
    }),

    defineField({
      name: "stillImages",
      title: "Photos du film",
      type: "array",
      of: [{ type: "imageZinema" }],
      description:
        "Facultatif. Images horizontales tirées du film, affichées sous le synopsis sur la fiche. Glissez-les pour changer l'ordre.",
    }),
    defineField({
      name: "trailerUrl",
      title: "Bande-annonce",
      type: "url",
      description:
        "Collez l'adresse complète de la vidéo YouTube ou Vimeo (ex. https://www.youtube.com/watch?v=…). Un bouton « Voir la bande-annonce » apparaît alors sur la fiche.",
    }),
    defineField({
      name: "presseUrl",
      title: "Article de presse",
      type: "url",
      description:
        "Facultatif. Collez l'adresse de l'article : la fiche du film affiche alors une grande case « PRESSE », cliquable. Rien d'autre à remplir.",
    }),

    /* ---------------- Encadrés repliables ---------------- */
    defineField({
      name: "slug",
      title: "Adresse de la page du film",
      type: "slug",
      fieldset: "adresse",
      description:
        "Vous pouvez ignorer ce champ : le site sait fabriquer l'adresse tout seul. Cliquer sur « Generate » donne simplement une adresse plus jolie, construite à partir du titre. À ne plus modifier une fois le film en ligne, sinon les liens déjà partagés cesseraient de fonctionner.",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "price",
      title: "Prix particulier pour ce film",
      type: "string",
      fieldset: "billetterie",
      description:
        "Laissez vide dans 99 % des cas : le film prend alors les tarifs du cinéma définis dans « Réglages du cinéma → Tarifs & salles ». À remplir uniquement pour une séance à prix spécial (ciné-goûter, soirée de soutien…). Ex. « 10.- ».",
    }),
    defineField({
      name: "sumupCheckoutUrl",
      title: "Lien de paiement SumUp du film",
      type: "url",
      fieldset: "billetterie",
      description:
        "Utilisé pour toutes les séances de ce film qui n'ont pas leur propre lien. Laissez vide si la billetterie du site s'en charge.",
    }),
  ],
  orderings: [
    { title: "Titre de A à Z", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
    { title: "Année, du plus récent", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
  ],
  preview: {
    select: {
      title: "title",
      director: "director",
      year: "year",
      status: "status",
      releaseDate: "releaseDate",
      media: "poster",
    },
    prepare({ title, director, year, status, releaseDate, media }) {
      const etats: Record<string, string> = {
        "a-laffiche": "À l'affiche",
        "avant-premiere": "Avant-première",
        prochainement: "Prochainement",
        cycle: "Cycle / ciné-club",
        passe: "Terminé",
      };
      /* Un film annoncé se lit mieux avec sa date : dans la liste,
         « Prochainement — dès le 12/03/2026 » évite d'ouvrir la
         fiche pour savoir quand il arrive. */
      let etat = etats[status as string] || "";
      if (status === "prochainement" && typeof releaseDate === "string" && releaseDate) {
        const [annee, mois, jour] = releaseDate.split("-");
        if (annee && mois && jour) etat += ` — dès le ${jour}/${mois}/${annee}`;
      }
      return {
        title: title || "Film sans titre",
        subtitle: [etat, director, year].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
