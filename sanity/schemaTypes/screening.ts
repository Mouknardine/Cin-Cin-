import { defineField, defineType, type SanityDocument } from "sanity";

import { intervallesSeChevauchent } from "../plugins/planification/utils/conflits";
import { ChampSalle } from "./components/ChampSalle";

/* ============================================================
   Une séance : un cinéma, un film, une date, une heure, une salle.

   Presque tout est hérité du film (titre, affiche, durée, prix,
   lien de paiement) : il n'y a donc que cinq champs à remplir.
   L'onglet « Planification » en haut du Studio permet d'en créer
   des dizaines d'un coup plutôt qu'une par une.

   C'est la séance, et elle seule, qui dit dans quel cinéma un film
   passe. Les films sont communs à tous les cinémas : ils sont
   saisis une fois et programmés autant de fois qu'on veut.
   ============================================================ */

interface ScreeningEnCours extends SanityDocument {
  cinema?: { _ref?: string };
  film?: { _ref?: string };
  date?: string;
  time?: string;
  room?: string;
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function dateEnFrancais(iso?: string): string {
  if (!iso) return "";
  const [a, m, j] = iso.split("-").map(Number);
  if (!a || !m || !j) return iso;
  const d = new Date(Date.UTC(a, m - 1, j));
  return `${JOURS[d.getUTCDay()]} ${j} ${MOIS[m - 1]}`;
}

export const screening = defineType({
  name: "screening",
  title: "Séance",
  type: "document",
  // Avertit (sans bloquer) si une autre séance occupe déjà la même salle
  // au même moment (durée du film + pause de nettoyage comprises).
  validation: (Rule) =>
    Rule.custom(async (document, contexte) => {
      const seance = document as ScreeningEnCours | undefined;
      const { date, time, room } = seance ?? {};
      const filmRef = seance?.film?._ref;
      const cinemaRef = seance?.cinema?._ref;
      /* Sans cinéma, la question n'a pas de sens : deux « Salle 1 »
         de deux villes différentes ne se gênent pas. */
      if (!date || !time || !room || !filmRef || !cinemaRef) return true;

      const client = contexte.getClient({ apiVersion: "2024-06-01" });
      const idPublie = (seance?._id ?? "").replace(/^drafts\./, "");
      const { duree, autres } = await client.fetch<{
        duree: number | null;
        autres: { heure: string; duree: number | null; titre: string | null }[];
      }>(
        `{
          "duree": *[_id == $filmRef][0].duration,
          "autres": *[_type == "screening" && date == $date && room == $room
            && cinema._ref == $cinemaRef
            && !(_id in [$idPublie, $idBrouillon])]{
            "heure": time, "duree": film->duration, "titre": film->title
          }
        }`,
        { filmRef, date, room, cinemaRef, idPublie, idBrouillon: `drafts.${idPublie}` }
      );

      const genante = autres.find((autre) =>
        intervallesSeChevauchent(time, duree, autre.heure, autre.duree)
      );
      if (genante) {
        return `Attention : « ${genante.titre ?? "un autre film"} » occupe déjà cette salle vers ${genante.heure} (durée du film + 15 min de pause). Choisissez une autre heure ou l'autre salle.`;
      }
      return true;
    }).warning(),
  fields: [
    /* Le cinéma en premier : c'est lui qui décide des salles
       proposées plus bas, et une séance sans lieu n'existe pas. */
    defineField({
      name: "cinema",
      title: "Dans quel cinéma ?",
      type: "reference",
      to: [{ type: "siteSettings" }],
      description:
        "Le cinéma où ce film passe. Les salles proposées ci-dessous sont celles de ce cinéma.",
      validation: (Rule) =>
        Rule.required().error("Indiquez dans quel cinéma la séance a lieu."),
    }),
    defineField({
      name: "film",
      title: "Quel film ?",
      type: "reference",
      to: [{ type: "film" }],
      description:
        "Le titre, l'affiche, la durée, la version et le prix sont repris automatiquement de la fiche du film — rien à recopier ici.",
      validation: (Rule) => Rule.required().error("Choisissez le film projeté."),
    }),
    defineField({
      name: "date",
      title: "Date de la séance",
      type: "date",
      options: { dateFormat: "dddd D MMMM YYYY" },
      validation: (Rule) => Rule.required().error("Indiquez la date de la séance."),
    }),
    defineField({
      name: "time",
      title: "Heure de début",
      type: "string",
      description: "Sur 24 heures, avec deux points. Ex. 20:30 pour 20 h 30.",
      validation: (Rule) =>
        Rule.required()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "heure (HH:MM)" })
          .error("Écrivez l'heure sous la forme 20:30."),
    }),
    defineField({
      name: "room",
      title: "Salle",
      type: "string",
      description:
        "Les salles de ce cinéma, et le nombre de places de chacune, se règlent dans sa fiche, sous « Tarifs & salles ».",
      components: { input: ChampSalle },
      validation: (Rule) => Rule.required().error("Indiquez la salle."),
    }),
    defineField({
      name: "status",
      title: "État de la séance",
      type: "string",
      description:
        "« Complet » et « Annulé » s'affichent sur l'agenda et désactivent l'achat de billets.",
      options: {
        list: [
          { title: "Places disponibles", value: "disponible" },
          { title: "Complet", value: "complet" },
          { title: "Annulée", value: "annule" },
        ],
        layout: "radio",
      },
      initialValue: "disponible",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "versionNote",
      title: "Mention particulière",
      type: "string",
      description:
        "S'affiche à côté de l'heure sur l'agenda. Ex. « Séance suivie d'une rencontre », « Ciné-goûter dès 6 ans », « Copie restaurée ». Laissez vide pour une séance normale.",
    }),
    defineField({
      name: "price",
      title: "Prix particulier pour cette séance",
      type: "string",
      description:
        "Laissez vide : la séance prend le prix du film, sinon les tarifs du cinéma. À remplir seulement pour une exception.",
    }),
    defineField({
      name: "sumupCheckoutUrl",
      title: "Lien de paiement SumUp de cette séance",
      type: "url",
      description:
        "Laissez vide : le lien du film est utilisé. À remplir seulement si cette séance a son propre lien.",
    }),
  ],
  orderings: [
    {
      title: "De la plus proche à la plus lointaine",
      name: "dateTimeAsc",
      by: [
        { field: "date", direction: "asc" },
        { field: "time", direction: "asc" },
      ],
    },
    {
      title: "De la plus récente à la plus ancienne",
      name: "dateTimeDesc",
      by: [
        { field: "date", direction: "desc" },
        { field: "time", direction: "desc" },
      ],
    },
  ],
  preview: {
    select: {
      titre: "film.title",
      media: "film.poster",
      cinema: "cinema.nom",
      date: "date",
      time: "time",
      room: "room",
      status: "status",
      mention: "versionNote",
    },
    /* Le cinéma ouvre la ligne : dans une liste qui en mêle plusieurs,
       c'est la première chose qu'on cherche. */
    prepare({ titre, media, cinema, date, time, room, status, mention }) {
      const etat =
        status === "complet" ? "COMPLET" : status === "annule" ? "ANNULÉE" : null;
      const lieu = [cinema, room].filter(Boolean).join(" · ");
      return {
        title: `${time || "??:??"} — ${titre || "Film à choisir"}`,
        subtitle: [dateEnFrancais(date), lieu, etat, mention]
          .filter(Boolean)
          .join(" · "),
        media,
      };
    },
  },
});
