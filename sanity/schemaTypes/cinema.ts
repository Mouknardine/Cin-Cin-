import { defineField, defineType } from "sanity";

/* ============================================================
   UN CINÉMA : son adresse, ses horaires, ses tarifs, ses salles,
   ses réseaux. Tout ce qui ne change presque jamais, mais qui est
   repris partout sur son site (en-tête, pied de page, page Infos,
   boutons d'achat) et par sa caisse en ligne.

   Il y a une fiche par cinéma. Les FILMS, eux, sont communs à tous
   les cinémas : un film saisi une fois s'affiche partout où il est
   programmé. C'est la séance qui dit dans quel cinéma il passe.

   Chaque site déclare le cinéma qu'il représente et ne lit que sa
   fiche : deux cinémas ne se mélangent jamais.

   Les tarifs et les salles sont lus par le SERVEUR au moment de
   l'achat (dossier /api) : c'est lui qui calcule le montant à payer
   et le nombre de places restantes, jamais le navigateur du client,
   qui pourrait être trafiqué. Modifier un prix ici le change donc
   réellement à la caisse en ligne.

   Le nom interne du modèle est resté « siteSettings », celui qu'il
   portait du temps où il n'y avait qu'un cinéma. Le renommer aurait
   voulu dire réécrire toutes les fiches déjà enregistrées et toutes
   les requêtes du site en même temps, pour un mot que personne ne
   voit dans le Studio.
   ============================================================ */

export const cinema = defineType({
  name: "siteSettings",
  title: "Cinéma",
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
      name: "nom",
      title: "Nom du cinéma",
      type: "string",
      group: "identite",
      description:
        "Tel qu'il s'écrit sur son site et sur son programme. Ex. Zinéma.",
      validation: (Rule) => Rule.required().error("Donnez un nom à ce cinéma."),
    }),
    defineField({
      name: "slug",
      title: "Nom court du cinéma",
      type: "slug",
      group: "identite",
      description:
        "Un seul mot, sans accent ni espace, qui identifie ce cinéma. Cliquez sur « Generate » : il se fabrique tout seul à partir du nom. C'est ce mot que le site du cinéma déclare pour savoir qu'il parle de lui — ne plus le modifier une fois le site en ligne, sinon ses pages se videraient.",
      options: { source: "nom", maxLength: 60 },
      validation: (Rule) => Rule.required().error("Le nom court est obligatoire."),
    }),
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
      title: "Les salles de ce cinéma",
      type: "array",
      group: "tarifs",
      description:
        "Une ligne par salle de projection : son nom, puis son nombre de places. C'est la liste que proposent les séances de ce cinéma, et c'est elle qui empêche de vendre plus de billets qu'il n'y a de sièges.\n\nL'ordre compte : à heure égale, le programme se lit dans cet ordre. Rangez d'abord la salle principale.\n\nAttention en renommant une salle : les séances déjà programmées gardent l'ancien nom et le Studio vous signalera qu'elles pointent vers une salle qui n'existe plus. Mieux vaut renommer puis corriger ces séances.",
      of: [
        {
          type: "object",
          name: "salle",
          fields: [
            {
              name: "nom",
              title: "Nom de la salle",
              type: "string",
              description: "Tel qu'il s'affiche sur le programme. Ex. Salle 1, Grande salle, Hall-Bar.",
              validation: (Rule) => Rule.required().error("Donnez un nom à cette salle."),
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
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error("Un cinéma a au moins une salle : sans elle, aucune séance ne peut être programmée.")
          .custom((salles?: { nom?: string }[]) => {
            if (!salles) return true;
            /* Deux salles du même nom rendraient le comptage des places
               ambigu : la caisse ne saurait pas laquelle compter. */
            const noms = salles.map((salle) => (salle?.nom ?? "").trim().toLowerCase());
            const doublon = noms.find((nom, i) => nom && noms.indexOf(nom) !== i);
            return doublon
              ? `Deux salles portent le même nom (« ${doublon} ») : donnez-leur des noms différents.`
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
    select: { nom: "nom", adresse: "address" },
    prepare({ nom, adresse }) {
      /* La ville suffit à distinguer deux cinémas dans la liste : elle
         est sur la dernière ligne de l'adresse postale, après le code
         postal. */
      const lignes = String(adresse ?? "")
        .split(/\s*\n\s*|,\s*/)
        .filter(Boolean);
      const derniere = lignes[lignes.length - 1] ?? "";
      return {
        title: nom || "Cinéma sans nom",
        subtitle: derniere.replace(/^\d{4,}\s+/, "") || undefined,
      };
    },
  },
});
