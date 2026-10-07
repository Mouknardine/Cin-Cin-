import { defineField, defineType } from "sanity";
import { TagIcon } from "@sanity/icons";

/* ============================================================
   Un type d'événement : « Festival », « Brunch », « Ciné-club »…

   Le cinéma les nomme comme il veut. Un type se crée ici, ou
   directement depuis un événement (bouton « Créer » du champ
   « Type d'événement »). Renommer un type renomme tous les
   événements qui l'utilisent, d'un coup.
   ============================================================ */

export const typeEvenement = defineType({
  name: "typeEvenement",
  title: "Type d'événement",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "nom",
      title: "Nom du type",
      type: "string",
      description:
        "Tel qu'il s'affichera sur le site. Ex. « Festival », « Première », « Brunch ».",
      validation: (Rule) =>
        Rule.required().max(60).error("Donnez un nom au type (60 signes maximum)."),
    }),
  ],
  orderings: [
    {
      title: "Par nom",
      name: "nomAsc",
      by: [{ field: "nom", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "nom" },
    prepare({ title }) {
      return { title: typeof title === "string" && title ? title : "Type sans nom" };
    },
  },
});
