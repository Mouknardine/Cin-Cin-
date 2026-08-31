import { defineField, defineType } from "sanity";

/* ============================================================
   Une citation de presse, à rattacher à un film.
   Elle s'affiche sur la fiche du film, en grand, entre guillemets.
   ============================================================ */

export const review = defineType({
  name: "review",
  title: "Critique presse",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "La citation",
      type: "text",
      rows: 3,
      description:
        "Une ou deux phrases, sans guillemets (le site les ajoute) et sans crochets. Ex. Un portrait d'une délicatesse rare.",
      validation: (Rule) =>
        Rule.required()
          .max(300)
          .error("Une citation courte est obligatoire (300 signes maximum)."),
    }),
    defineField({
      name: "source",
      title: "Journal / média",
      type: "string",
      description: "Ex. Le Temps, 24 heures, Le Courrier, RTS.",
      validation: (Rule) => Rule.required().error("Indiquez d'où vient la citation."),
    }),
    defineField({
      name: "author",
      title: "Signature",
      type: "string",
      description: "Facultatif : le nom de la personne qui a écrit la critique.",
    }),
    defineField({
      name: "url",
      title: "Lien vers l'article",
      type: "url",
      description: "Facultatif. La citation devient cliquable si vous le remplissez.",
    }),
    defineField({
      name: "film",
      title: "Film concerné",
      type: "reference",
      to: [{ type: "film" }],
      description:
        "Pour retrouver la critique facilement. Pour qu'elle s'affiche sur la fiche, choisissez-la aussi depuis le film, onglet « Programmation ».",
    }),
  ],
  preview: {
    select: { quote: "quote", source: "source", author: "author", film: "film.title" },
    prepare({ quote, source, author, film }) {
      return {
        title: quote ? `« ${quote.slice(0, 70)}${quote.length > 70 ? "…" : ""} »` : "Citation vide",
        subtitle: [source, author, film].filter(Boolean).join(" · "),
      };
    },
  },
});
