import { defineField, defineType } from "sanity";

import { listeDesSalles, PLACES_PAR_DEFAUT, SALLES } from "../salles";

/* ============================================================
   Les réglages du cinéma : ce qui ne change presque jamais, mais
   qui est repris partout sur le site (en-tête, pied de page, page
   Infos pratiques, boutons d'achat) et par la caisse en ligne.

   Les tarifs et les salles sont lus par le SERVEUR au moment de
   l'achat (dossier /api) : c'est lui qui calcule le montant à payer
   et le nombre de places restantes, jamais le navigateur du client,
   qui pourrait être trafiqué. Modifier un prix ici le change donc
   réellement à la caisse en ligne.
   ============================================================ */

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Réglages du cinéma",
  type: "document",
  groups: [
    { name: "identite", title: "Identité", default: true },
    { name: "pratique", title: "Infos pratiques" },
    { name: "tarifs", title: "Tarifs & salles" },
    { name: "reseaux", title: "Réseaux & référencement" },
  ],
  fields: [
    /* ---------------- Identité ----------------
       Il n'y a plus de champ « logo » : le nom du cinéma est écrit
       en haut de chaque page, dans la typographie du site, et non
       plus déposé sous forme d'image. */
    defineField({
      name: "shareImage",
      title: "Image de partage",
      type: "imageZinema",
      group: "identite",
      description:
        "L'image qui s'affiche quand quelqu'un partage l'adresse du cinéma sur WhatsApp, Facebook ou Instagram. Format paysage, 1200 × 630 px idéalement. Sans elle, les partages apparaissent sans visuel.",
    }),

    /* ---------------- Infos pratiques ---------------- */
    defineField({
      name: "address",
      title: "Adresse postale",
      type: "text",
      rows: 2,
      group: "pratique",
      description:
        "Sur deux lignes : la rue, puis le code postal et la ville. Ex.\nRue du Maupas 4\n1004 Lausanne\nSert aussi à afficher la carte sur la page Infos.",
      validation: (Rule) => Rule.required().error("L'adresse est obligatoire."),
    }),
    defineField({
      name: "phone",
      title: "Téléphone du cinéma",
      type: "string",
      group: "pratique",
      description: "Le numéro que le public appelle. Ex. 021 311 29 30.",
      validation: (Rule) => Rule.required().error("Le téléphone est obligatoire."),
    }),
    defineField({
      name: "phoneSecondary",
      title: "Téléphone du bureau",
      type: "string",
      group: "pratique",
      description: "Facultatif. N'apparaît sur le site que s'il est rempli.",
    }),
    defineField({
      name: "email",
      title: "E-mail principal",
      type: "string",
      group: "pratique",
      description: "Celui affiché sur la page Infos et dans le pied de page.",
      validation: (Rule) =>
        Rule.required()
          .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, { name: "adresse e-mail" })
          .error("Écrivez une adresse e-mail valable, ex. admin@zinema.ch."),
    }),
    defineField({
      name: "openingHours",
      title: "Horaires",
      type: "array",
      group: "pratique",
      description:
        "Une ligne par période. À gauche les jours, à droite l'horaire. Ex. « Lundi au samedi » / « 15h30 – 24h00 ».",
      of: [
        {
          type: "object",
          name: "horaire",
          fields: [
            {
              name: "label",
              title: "Jours",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "value",
              title: "Horaire",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: "label", subtitle: "value" },
          },
        },
      ],
    }),
    defineField({
      name: "accessInfo",
      title: "Comment venir",
      type: "array",
      of: [{ type: "block" }],
      group: "pratique",
      description:
        "Transports publics, arrêt le plus proche, parking, accès en fauteuil roulant. Affiché sur la page Infos.",
    }),
    defineField({
      name: "remerciements",
      title: "Remerciements",
      type: "array",
      group: "pratique",
      description:
        "Celles et ceux que le cinéma remercie : institutions, soutiens, personnes. Une case par nom, affichée sur la page Infos sous « Notre histoire ». Glissez un nom pour le déplacer ; la couleur et la taille de chaque case sont tirées au hasard à chaque visite. Sans aucun nom, la rubrique n'apparaît pas du tout sur le site.",
      of: [
        {
          type: "object",
          name: "remerciement",
          fields: [
            {
              name: "nom",
              title: "Nom",
              type: "string",
              description:
                "Ce qui s'affiche en grand dans la case. Ex. Loterie Romande, Ville de Lausanne, État de Vaud.",
              validation: (Rule) => Rule.required().error("Écrivez le nom à remercier."),
            },
            {
              name: "mention",
              title: "Pour quoi (facultatif)",
              type: "string",
              description:
                "Deux ou trois mots, en petit sous le nom. Ex. « soutien à la programmation », « projection », « graphisme ». À laisser vide si le nom se suffit.",
            },
            {
              name: "url",
              title: "Lien (facultatif)",
              type: "url",
              description:
                "Si la case doit être cliquable, l'adresse complète du site. Ex. https://entreprise.loro.ch",
            },
          ],
          preview: { select: { title: "nom", subtitle: "mention" } },
        },
      ],
    }),
    defineField({
      name: "mapUrl",
      title: "Lien Google Maps particulier",
      type: "url",
      group: "pratique",
      description:
        "À laisser vide presque toujours : la carte et le lien « Voir sur Google Maps » sont construits automatiquement à partir de l'adresse ci-dessus. À remplir seulement pour pointer vers la fiche Google du cinéma (avec avis et photos).",
    }),

    /* ---------------- Tarifs & salles ---------------- */
    defineField({
      name: "tarifPlein",
      title: "Plein tarif (CHF)",
      type: "number",
      group: "tarifs",
      description:
        "Le prix d'une place normale. Attention : ce chiffre est celui réellement facturé par la caisse en ligne.",
      initialValue: 16,
      validation: (Rule) => Rule.required().positive().error("Indiquez le plein tarif."),
    }),
    defineField({
      name: "tarifReduit",
      title: "Tarif réduit (CHF)",
      type: "number",
      group: "tarifs",
      description: "Le prix réduit. Lui aussi réellement facturé par la caisse en ligne.",
      initialValue: 10,
      validation: (Rule) =>
        Rule.required()
          .positive()
          .custom((reduit, contexte) => {
            const plein = (contexte.document as { tarifPlein?: number } | undefined)?.tarifPlein;
            if (typeof reduit !== "number" || typeof plein !== "number") return true;
            return reduit <= plein
              ? true
              : "Le tarif réduit ne peut pas être plus cher que le plein tarif.";
          }),
    }),
    defineField({
      name: "conditionsReduit",
      title: "Qui a droit au tarif réduit",
      type: "array",
      of: [{ type: "string" }],
      group: "tarifs",
      description:
        "Une ligne par condition — tapez puis Entrée. Ex. Membres de soutien, Abonné·e·s au Courrier, Étudiant·e·s, Carte Culture Caritas. Affiché sous les tarifs.",
    }),
    defineField({
      name: "salles",
      title: "Nombre de places par salle",
      type: "array",
      group: "tarifs",
      description:
        "Sert à ne jamais vendre plus de billets qu'il n'y a de sièges. Les noms de salles sont fixes (ils sont utilisés partout dans le site) ; seul le nombre de places se modifie ici.",
      of: [
        {
          type: "object",
          name: "salle",
          fields: [
            {
              name: "nom",
              title: "Salle",
              type: "string",
              options: { list: listeDesSalles },
              validation: (Rule) => Rule.required(),
            },
            {
              name: "places",
              title: "Nombre de places",
              type: "number",
              validation: (Rule) =>
                Rule.required().min(1).integer().error("Indiquez un nombre de places."),
            },
          ],
          preview: {
            select: { title: "nom", places: "places" },
            prepare({ title, places }) {
              return {
                title: title || "Salle",
                subtitle: `${places ?? 0} places`,
              };
            },
          },
        },
      ],
      initialValue: SALLES.map((nom) => ({ nom, places: PLACES_PAR_DEFAUT[nom] })),
      validation: (Rule) =>
        Rule.custom((salles?: { nom?: string }[]) => {
          if (!salles) return true;
          const manquantes = SALLES.filter(
            (nom) => !salles.some((salle) => salle?.nom === nom)
          );
          return manquantes.length
            ? `Il manque le nombre de places pour : ${manquantes.join(", ")}.`
            : true;
        }),
    }),

    /* ---------------- Réseaux & référencement ---------------- */
    defineField({
      name: "socialLinks",
      title: "Réseaux sociaux",
      type: "array",
      group: "reseaux",
      description: "Affichés dans le pied de page de toutes les pages.",
      of: [
        {
          type: "object",
          name: "reseau",
          fields: [
            {
              name: "label",
              title: "Réseau",
              type: "string",
              options: {
                list: [
                  { title: "Instagram", value: "Instagram" },
                  { title: "Facebook", value: "Facebook" },
                  { title: "YouTube", value: "YouTube" },
                  { title: "LinkedIn", value: "LinkedIn" },
                  { title: "Newsletter", value: "Newsletter" },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: "url",
              title: "Adresse complète",
              type: "url",
              description: "Ex. https://www.instagram.com/zinemazinema/",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        },
      ],
    }),
    defineField({
      name: "seoDescription",
      title: "Description pour Google",
      type: "text",
      rows: 3,
      group: "reseaux",
      description:
        "Le petit texte gris sous le titre du site dans les résultats de recherche. Entre 120 et 160 signes, en disant ce qu'on trouve au cinéma.",
      validation: (Rule) =>
        Rule.max(180).warning("Au-delà de 180 signes, Google coupe la phrase."),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Réglages du cinéma" };
    },
  },
});
