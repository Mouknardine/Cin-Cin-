import { defineField, defineType } from "sanity";

/* ============================================================
   Un événement : cycle, brunch, ciné-club, séance spéciale,
   festival, ou simple information à faire passer.

   Les dates font tout le travail : tant que l'événement est en
   cours ou à venir, il s'affiche sur la page Événements et peut
   remonter sur l'accueil. Une fois la date de fin passée, il
   s'archive tout seul — rien à décocher, rien à supprimer.
   ============================================================ */

const AUJOURDHUI = () => new Date().toISOString().slice(0, 10);

export const evenement = defineType({
  name: "evenement",
  title: "Événement",
  type: "document",
  /* Comme pour les films : pas d'onglets, et le visuel juste sous
     le titre — on ne peut pas le rater en créant un événement. */
  fieldsets: [
    {
      name: "adresse",
      title: "Adresse de la page sur le site (facultatif)",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titre de l'événement",
      type: "string",
      description: "Ex. « Cycle Cinéastes suisses oubliées », « Brunch du dimanche ».",
      validation: (Rule) => Rule.required().error("Donnez un titre à l'événement."),
    }),
    defineField({
      name: "image",
      title: "Visuel de l'événement",
      type: "imageZinema",
      description:
        "L'image qui représente l'événement sur la page Événements, et sur l'accueil pendant toute sa durée. Format libre ; une image large (paysage) rend le mieux. Sans image, l'événement s'affiche en texte seul — c'est très bien aussi.",
    }),

    defineField({
      name: "category",
      title: "Type d'événement",
      type: "string",
      options: {
        list: [
          { title: "Cycle / rétrospective", value: "cycle" },
          { title: "Ciné-club", value: "cine-club" },
          { title: "Brunch", value: "brunch" },
          { title: "Séance spéciale (rencontre, avant-première…)", value: "seance-speciale" },
          { title: "Festival", value: "festival" },
          { title: "Information du cinéma", value: "info" },
        ],
      },
      initialValue: "seance-speciale",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "dateDebut",
      title: "Premier jour",
      type: "date",
      options: { dateFormat: "dddd D MMMM YYYY" },
      description:
        "Le jour où l'événement commence. C'est à partir de cette date qu'il apparaît sur le site.",
      initialValue: AUJOURDHUI,
      validation: (Rule) => Rule.required().error("Indiquez le premier jour."),
    }),
    defineField({
      name: "dateFin",
      title: "Dernier jour",
      type: "date",
      options: { dateFormat: "dddd D MMMM YYYY" },
      description:
        "Le jour où l'événement se termine. Passé ce jour, il quitte automatiquement les pages publiques. Pour un événement d'un seul jour, remettez la même date qu'au-dessus. Laissez vide pour une information sans fin prévue.",
      validation: (Rule) =>
        Rule.custom((fin, contexte) => {
          const debut = (contexte.document as { dateDebut?: string } | undefined)?.dateDebut;
          if (!fin || !debut) return true;
          return fin >= debut
            ? true
            : "Le dernier jour ne peut pas être avant le premier jour.";
        }),
    }),
    defineField({
      name: "excerpt",
      title: "Résumé en deux ou trois phrases",
      type: "text",
      rows: 3,
      description:
        "Le texte court affiché dans la liste des événements. C'est souvent tout ce que les gens liront : allez à l'essentiel (quoi, quand, combien).",
      validation: (Rule) =>
        Rule.required()
          .max(400)
          .error("Un résumé court est obligatoire (400 signes maximum)."),
    }),
    defineField({
      name: "body",
      title: "Texte complet",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Facultatif. Le détail de l'événement : programme, invités, conditions. Vous pouvez mettre en gras, en italique et faire des listes.",
    }),

    defineField({
      name: "films",
      title: "Films concernés",
      type: "array",
      of: [{ type: "reference", to: [{ type: "film" }] }],
      description:
        "Reliez les films de ce cycle ou de cette soirée : leurs affiches et leurs séances apparaîtront automatiquement sur la page de l'événement, sans rien recopier.",
    }),
    defineField({
      name: "linkUrl",
      title: "Lien externe",
      type: "url",
      description:
        "Facultatif : billetterie extérieure, formulaire de réservation, site d'un partenaire. Un bouton apparaîtra sur l'événement.",
    }),
    defineField({
      name: "linkLabel",
      title: "Texte du bouton",
      type: "string",
      description: "Ex. « Réserver le brunch ». Par défaut : « En savoir plus ».",
      hidden: ({ document }) => !document?.linkUrl,
    }),
    defineField({
      name: "slug",
      title: "Adresse de la page",
      type: "slug",
      fieldset: "adresse",
      description:
        "Vous pouvez ignorer ce champ : le site fabrique l'adresse tout seul. « Generate » donne simplement une adresse plus jolie, construite à partir du titre.",
      options: { source: "title", maxLength: 96 },
    }),
  ],
  orderings: [
    {
      title: "Du plus proche au plus lointain",
      name: "debutAsc",
      by: [{ field: "dateDebut", direction: "asc" }],
    },
    {
      title: "Du plus récent au plus ancien",
      name: "debutDesc",
      by: [{ field: "dateDebut", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      debut: "dateDebut",
      fin: "dateFin",
      media: "image",
    },
    prepare({ title, category, debut, fin, media }) {
      const types: Record<string, string> = {
        cycle: "Cycle",
        "cine-club": "Ciné-club",
        brunch: "Brunch",
        "seance-speciale": "Séance spéciale",
        festival: "Festival",
        info: "Information",
      };
      const periode = fin && fin !== debut ? `${debut} → ${fin}` : debut;
      const termine = fin && fin < new Date().toISOString().slice(0, 10);
      return {
        title: title || "Événement sans titre",
        subtitle: [types[category as string], periode, termine ? "terminé" : null]
          .filter(Boolean)
          .join(" · "),
        media,
      };
    },
  },
});
