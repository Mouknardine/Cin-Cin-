import { defineField, defineType } from "sanity";

/* ============================================================
   Image du site — brique réutilisée par TOUTES les images.

   Deux règles, qui répondent aux deux pièges habituels :

   1. Une image = un seul endroit. Une image déposée ici est la
      seule qui sera affichée sur le site. Il n'existe plus d'image
      « de secours » cachée dans le code : ce qu'on voit dans le
      Studio est exactement ce qu'on verra en ligne.

   2. Chaque image porte sa description (« texte alternatif »).
      C'est ce qui s'affiche si l'image ne charge pas, ce que lisent
      les personnes aveugles, et ce que lit Google. C'est aussi ce
      qui permet, dans une liste, de savoir d'un coup d'œil quelle
      image on est en train de remplacer.
   ============================================================ */

export const imageZinema = defineType({
  name: "imageZinema",
  title: "Image",
  type: "image",
  options: {
    hotspot: true, // permet de choisir le point important de l'image
  },
  fields: [
    defineField({
      name: "alt",
      title: "Décrire l'image en une phrase",
      type: "string",
      description:
        "Ce que l'on voit sur l'image, simplement. Ex. « Affiche du film Le Dernier pour la route : trois hommes marchent sur fond jaune ». Sert aux personnes malvoyantes, à Google, et s'affiche si l'image ne charge pas.",
      validation: (Rule) =>
        Rule.min(5).warning(
          "Sans cette phrase, l'image reste invisible pour les personnes malvoyantes et pour Google. À compléter quand vous avez un moment — cela n'empêche pas de publier."
        ),
    }),
  ],
  preview: {
    select: { media: "asset", title: "alt" },
    prepare({ media, title }) {
      return { media, title: title || "Image sans description" };
    },
  },
});
