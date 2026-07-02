import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Réglages du site",
  type: "document",
  groups: [
    { name: "general", title: "Général" },
    { name: "pratique", title: "Infos pratiques" },
  ],
  fields: [
    defineField({
      name: "tagline",
      title: "Accroche (accueil)",
      type: "string",
      group: "general",
      initialValue: "Cinéma indépendant à Lausanne",
    }),
    defineField({
      name: "seoDescription",
      title: "Description SEO",
      type: "text",
      rows: 3,
      group: "general",
    }),
    defineField({
      name: "historyIntro",
      title: "Introduction de la page Histoire",
      description:
        "Grand paragraphe affiché en tête de la page Histoire, avant la frise chronologique.",
      type: "text",
      rows: 4,
      group: "general",
    }),
    defineField({
      name: "address",
      title: "Adresse",
      type: "text",
      rows: 2,
      group: "pratique",
    }),
    defineField({
      name: "phone",
      title: "Téléphone",
      type: "string",
      group: "pratique",
    }),
    defineField({
      name: "email",
      title: "E-mail",
      type: "string",
      group: "pratique",
    }),
    defineField({
      name: "openingHours",
      title: "Horaires de la caisse",
      type: "array",
      group: "pratique",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Jour(s)", type: "string" },
            { name: "value", title: "Horaire", type: "string" },
          ],
        },
      ],
    }),
    defineField({
      name: "accessInfo",
      title: "Accès (transports, parking)",
      type: "array",
      of: [{ type: "block" }],
      group: "pratique",
    }),
    defineField({
      name: "mapUrl",
      title: "Lien carte (Google/OSM)",
      type: "url",
      group: "pratique",
    }),
    defineField({
      name: "socialLinks",
      title: "Réseaux sociaux",
      type: "array",
      group: "general",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Plateforme", type: "string" },
            { name: "url", title: "URL", type: "url" },
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Réglages du site" };
    },
  },
});
