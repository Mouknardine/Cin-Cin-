import { defineField, defineType } from "sanity";

/* ============================================================
   La page Abonnements : cartes de membre, formules, avantages et
   coordonnées bancaires. Tout ce qui s'y affiche vient d'ici —
   plus rien n'est écrit en dur dans le code du site.
   ============================================================ */

export const abonnements = defineType({
  name: "abonnements",
  title: "Formules & paiement",
  type: "document",
  groups: [
    { name: "formules", title: "Les formules", default: true },
    { name: "paiement", title: "Comment payer" },
  ],
  fields: [
    defineField({
      name: "formules",
      title: "Les formules proposées",
      type: "array",
      group: "formules",
      description:
        "Une carte par formule, dans l'ordre d'affichage. Glissez pour réordonner, cliquez sur la croix pour supprimer.",
      of: [
        {
          type: "object",
          name: "formule",
          fields: [
            {
              name: "titre",
              title: "Nom de la formule",
              type: "string",
              description: "Ex. Membre simple, Membre couple, Écoles & associations.",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "prix",
              title: "Prix",
              type: "string",
              description:
                "Écrit tel qu'il doit s'afficher. Ex. « 60 CHF par an », « sur demande ».",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "texte",
              title: "À qui ça s'adresse",
              type: "text",
              rows: 3,
              description: "Une ou deux phrases d'explication.",
            },
            {
              name: "avantages",
              title: "Avantages",
              type: "array",
              of: [{ type: "string" }],
              description:
                "Une ligne par avantage — tapez puis Entrée. Ex. Toutes les places à 7 CHF.",
            },
          ],
          preview: {
            select: { title: "titre", subtitle: "prix" },
          },
        },
      ],
      validation: (Rule) => Rule.min(1).warning("La page sera vide sans au moins une formule."),
    }),
    defineField({
      name: "beneficiaire",
      title: "Au nom de qui payer",
      type: "string",
      group: "paiement",
      description: "Le titulaire du compte. Ex. Association Microciné.",
    }),
    defineField({
      name: "iban",
      title: "IBAN",
      type: "string",
      group: "paiement",
      description: "Ex. CH79 0900 0000 1725 7734 1. Vérifiez chiffre par chiffre.",
    }),
    defineField({
      name: "ccp",
      title: "Numéro de compte (CCP)",
      type: "string",
      group: "paiement",
      description: "Facultatif. Ex. 17-257734-1.",
    }),
    defineField({
      name: "banque",
      title: "Banque",
      type: "string",
      group: "paiement",
      description: "Ex. PostFinance Suisse.",
    }),
    defineField({
      name: "notePaiement",
      title: "Précision sur le paiement",
      type: "text",
      rows: 2,
      group: "paiement",
      description:
        "Facultatif. Ex. « Indiquez votre nom en communication ; la carte vous attend à la caisse. »",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Formules & paiement" };
    },
  },
});
