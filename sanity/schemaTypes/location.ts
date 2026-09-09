import { defineField, defineType } from "sanity";

import { SALLES } from "../salles";

/* ============================================================
   La page « Location » : louer une salle, ou tout le lieu.

   Une seule fiche pour toute la page. On y décrit les espaces
   qu'on peut louer, ce qu'on peut y faire, et ce qu'il faut savoir
   avant de demander. Le formulaire de demande du site envoie les
   messages à l'adresse indiquée en bas de cette fiche.

   Rien n'est obligatoire sauf le premier espace : une rubrique
   laissée vide ne s'affiche simplement pas sur le site, plutôt que
   d'afficher une case vide.
   ============================================================ */

/* Les salles du cinéma, plus le lieu entier : on ne loue pas
   seulement une salle, on peut privatiser l'endroit. */
const ESPACES = [...SALLES, "Tout le lieu"] as const;

export const location = defineType({
  name: "location",
  title: "Location des espaces",
  type: "document",
  fields: [
    defineField({
      name: "intro",
      title: "Phrase d'accueil",
      type: "text",
      rows: 3,
      description:
        "Le texte en haut de la page, avant la liste des espaces. Deux ou trois phrases : à qui s'adresse la location, et ce qu'on peut y faire.",
      validation: (Rule) =>
        Rule.max(600).warning("Au-delà de ~600 signes, le texte cesse d'être lu."),
    }),

    defineField({
      name: "occasions",
      title: "Pour quelles occasions",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description:
        "Tapez une occasion puis Entrée. Ex. Projection privée, Séminaire, Anniversaire, Conférence, Tournage, Assemblée générale. Elles s'affichent en cases, sous la phrase d'accueil.",
    }),

    defineField({
      name: "espaces",
      title: "Les espaces à louer",
      type: "array",
      description:
        "Un bloc par espace. Glissez-les pour changer l'ordre d'affichage sur le site.",
      of: [
        {
          type: "object",
          name: "espace",
          fields: [
            defineField({
              name: "nom",
              title: "Espace",
              type: "string",
              options: { list: ESPACES.map((nom) => ({ title: nom, value: nom })) },
              initialValue: ESPACES[0],
              validation: (Rule) => Rule.required().error("Choisissez l'espace concerné."),
            }),
            defineField({
              name: "places",
              title: "Nombre de places",
              type: "number",
              description: "Le nombre de personnes que l'espace peut accueillir.",
              validation: (Rule) =>
                Rule.min(1).max(500).warning("Ce nombre semble inhabituel — vérifiez la saisie."),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 4,
              description:
                "Ce qu'il faut savoir sur cet espace : l'ambiance, l'équipement, ce qu'on y fait le mieux.",
            }),
            defineField({
              name: "equipements",
              title: "Équipement",
              type: "array",
              of: [{ type: "string" }],
              options: { layout: "tags" },
              description:
                "Tapez un équipement puis Entrée. Ex. Projection 4K, Son Dolby, Micro, Écran 8 m, Bar.",
            }),
            defineField({
              name: "tarif",
              title: "Tarif",
              type: "string",
              description:
                "Ex. « 450.- la demi-journée », ou « Sur demande ». Laissez vide pour ne rien afficher.",
            }),
            defineField({
              name: "image",
              title: "Photo de l'espace",
              type: "imageZinema",
              description: "Facultatif. Image horizontale, 1200 px de large minimum.",
            }),
          ],
          preview: {
            select: { title: "nom", places: "places", tarif: "tarif", media: "image" },
            prepare({ title, places, tarif, media }) {
              return {
                title: title || "Espace sans nom",
                subtitle: [places ? `${places} places` : null, tarif].filter(Boolean).join(" · "),
                media,
              };
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.min(1).error("Indiquez au moins un espace, sinon la page n'a rien à montrer."),
    }),

    defineField({
      name: "conditions",
      title: "Bon à savoir",
      type: "text",
      rows: 5,
      description:
        "Les conditions pratiques : horaires possibles, restauration, accessibilité, délai de réservation. Une idée par ligne.",
    }),

    defineField({
      name: "emailDemandes",
      title: "Adresse qui reçoit les demandes",
      type: "string",
      description:
        "Les demandes envoyées depuis le formulaire du site arrivent ici. Laissez vide pour utiliser l'e-mail du cinéma défini dans « Réglages du cinéma ».",
      validation: (Rule) =>
        Rule.email().warning("Cette adresse ne ressemble pas à une adresse e-mail."),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Location des espaces" };
    },
  },
});
