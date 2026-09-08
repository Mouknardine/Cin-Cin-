import { defineField, defineType } from "sanity";

/* ============================================================
   Un article de presse, à rattacher à un film.

   Le lien est le seul champ obligatoire : dans la pratique, on a
   presque toujours l'adresse de l'article sous la main, alors que
   choisir une phrase à citer demande de le relire. La fiche du film
   affiche alors simplement « Article de presse », cliquable.

   La citation reste possible quand une phrase vaut d'être mise en
   avant : elle s'affiche en grand, entre guillemets, à la place.
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
        "Facultatif. Une ou deux phrases, sans guillemets (le site les ajoute) et sans crochets. Ex. Un portrait d'une délicatesse rare. Laissée vide, la fiche du film affiche « Article de presse ».",
      validation: (Rule) => Rule.max(300).error("Une citation reste courte : 300 signes maximum."),
    }),
    defineField({
      name: "source",
      title: "Journal / média",
      type: "string",
      description: "Facultatif. Ex. Le Temps, 24 heures, Le Courrier, RTS.",
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
      description:
        "L'adresse de l'article en ligne. C'est le seul champ vraiment nécessaire : la fiche du film affichera « Article de presse » et mènera ici.",
      validation: (Rule) =>
        Rule.required().error("Sans lien, cette critique n'a rien à montrer sur le site."),
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
      /* Un champ rempli d'un simple espace n'est pas un contenu :
         on le traite comme vide, ici comme sur le site. */
      const citation = (quote ?? "").trim();
      return {
        title: citation
          ? `« ${citation.slice(0, 70)}${citation.length > 70 ? "…" : ""} »`
          : "Article de presse",
        subtitle: [source, author, film]
          .map((valeur) => (valeur ?? "").trim())
          .filter(Boolean)
          .join(" · "),
      };
    },
  },
});
