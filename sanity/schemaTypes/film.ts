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
      description: "Ex. Paolo Virzì. Plusieurs noms : séparez par « & ».",
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
      name: "review",
      title: "Critique de presse à mettre en avant",
      type: "reference",
      to: [{ type: "review" }],
      description:
        "Facultatif. Une citation de presse s'affichera sur la fiche du film. Créez-la ici avec « Create new », ou d'abord dans « Critiques presse ».",
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
      media: "poster",
    },
    prepare({ title, director, year, status, media }) {
      const etats: Record<string, string> = {
        "a-laffiche": "À l'affiche",
        "avant-premiere": "Avant-première",
        prochainement: "Prochainement",
        cycle: "Cycle / ciné-club",
        passe: "Terminé",
      };
      return {
        title: title || "Film sans titre",
        subtitle: [etats[status as string], director, year].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
