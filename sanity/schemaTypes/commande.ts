import { defineField, defineType } from "sanity";

/* Une commande de billets.
   ATTENTION : ces documents sont créés et mis à jour par le serveur
   (dossier /api), jamais à la main. Ils sont donc en lecture seule
   dans le Studio : on peut tout consulter, rien modifier. Un billet
   dont on changerait le statut à la main ne correspondrait plus au
   paiement réellement encaissé chez SumUp. */
export const commande = defineType({
  name: "commande",
  title: "Commande",
  type: "document",
  readOnly: true,
  fields: [
    defineField({
      name: "reference",
      title: "Référence",
      type: "string",
      description: "Le code du billet, présenté à l'entrée de la salle.",
    }),
    defineField({
      name: "statut",
      title: "Statut",
      type: "string",
      options: {
        list: [
          { title: "En attente de paiement", value: "en-attente" },
          { title: "Payée", value: "payee" },
          { title: "Échouée", value: "echouee" },
          { title: "Expirée", value: "expiree" },
          { title: "Remboursée", value: "remboursee" },
        ],
      },
      initialValue: "en-attente",
    }),
    defineField({
      name: "seance",
      title: "Séance",
      type: "reference",
      to: [{ type: "screening" }],
    }),
    /* Les informations de la séance sont recopiées dans la commande au
       moment de l'achat. Si la séance est ensuite déplacée ou
       supprimée, le billet vendu garde trace de ce qui a été acheté. */
    defineField({ name: "filmTitre", title: "Film", type: "string" }),
    defineField({ name: "seanceDate", title: "Date de la séance", type: "date" }),
    defineField({ name: "seanceHeure", title: "Heure de la séance", type: "string" }),
    defineField({ name: "seanceSalle", title: "Salle", type: "string" }),

    defineField({
      name: "billetsPlein",
      title: "Billets plein tarif",
      type: "number",
    }),
    defineField({
      name: "billetsReduit",
      title: "Billets tarif réduit",
      type: "number",
    }),
    defineField({
      name: "montant",
      title: "Montant total (CHF)",
      type: "number",
    }),
    defineField({
      name: "email",
      title: "E-mail de l'acheteur",
      type: "string",
    }),

    defineField({
      name: "sumupCheckoutId",
      title: "Identifiant SumUp",
      type: "string",
      description: "Sert à retrouver le paiement dans le compte SumUp.",
    }),
    defineField({
      name: "creeLe",
      title: "Commandée le",
      type: "datetime",
    }),
    defineField({
      name: "payeeLe",
      title: "Payée le",
      type: "datetime",
    }),
    defineField({
      name: "utiliseeLe",
      title: "Billet scanné le",
      type: "datetime",
      description: "Rempli au contrôle à l'entrée. Vide = billet non encore utilisé.",
    }),
  ],
  orderings: [
    {
      title: "Les plus récentes",
      name: "recentes",
      by: [{ field: "creeLe", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      reference: "reference",
      statut: "statut",
      film: "filmTitre",
      date: "seanceDate",
      heure: "seanceHeure",
      plein: "billetsPlein",
      reduit: "billetsReduit",
    },
    prepare({ reference, statut, film, date, heure, plein, reduit }) {
      const nombre = (plein || 0) + (reduit || 0);
      const etat: Record<string, string> = {
        "en-attente": "⏳ en attente",
        payee: "✓ payée",
        echouee: "✗ échouée",
        expiree: "✗ expirée",
        remboursee: "↩ remboursée",
      };
      return {
        title: `${reference || "Commande"} — ${nombre} billet${nombre > 1 ? "s" : ""}`,
        subtitle: [etat[statut] || statut, film, date, heure].filter(Boolean).join(" · "),
      };
    },
  },
});
