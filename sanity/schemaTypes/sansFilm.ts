import { defineField, defineType } from "sanity";

import { LIBELLES_SANS_FILM, prendToutLeJour } from "../casesSansFilm";
import { formatJourLong } from "../plugins/planification/utils/dates";
import { listeDesSalles, SALLES } from "../salles";

/* ============================================================
   Une case sans film : « Projection privée » ou « Vacances »,
   posée dans la grille de la Planification à la place d'un film.
   Elle s'affiche sur l'agenda du site, et rien ne s'y vend.

   On la crée d'un clic depuis la grille (case vide → « Pas de
   film »), on la retire par son menu ⋮. Cette fiche ne sert qu'à
   la corriger à la main. Voir sanity/casesSansFilm.ts.
   ============================================================ */

export const sansFilm = defineType({
  name: "sansFilm",
  title: "Case sans film",
  type: "document",
  fields: [
    defineField({
      name: "libelle",
      title: "Quoi ?",
      type: "string",
      description:
        "« Vacances » ferme toute la journée : l'agenda l'annonce sans heure ni salle. « Projection privée » s'affiche à son heure, dans sa salle.",
      options: {
        list: LIBELLES_SANS_FILM.map((libelle) => ({ title: libelle, value: libelle })),
        layout: "radio",
      },
      validation: (Rule) => Rule.required().error("Choisissez « Projection privée » ou « Vacances »."),
    }),
    defineField({
      name: "date",
      title: "Jour",
      type: "date",
      options: { dateFormat: "dddd D MMMM YYYY" },
      validation: (Rule) => Rule.required().error("Indiquez le jour."),
    }),
    defineField({
      name: "time",
      title: "Heure",
      type: "string",
      description: "Sur 24 heures, avec deux points. Ex. 19:00. Pour les vacances, elle ne s'affiche pas.",
      validation: (Rule) =>
        Rule.required()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "heure (HH:MM)" })
          .error("Écrivez l'heure sous la forme 19:00."),
    }),
    defineField({
      name: "room",
      title: "Salle",
      type: "string",
      description: "Pour les vacances, elle ne s'affiche pas : tout le cinéma est fermé.",
      options: { list: listeDesSalles, layout: "radio" },
      initialValue: SALLES[0],
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Du plus proche au plus lointain",
      name: "dateAsc",
      by: [
        { field: "date", direction: "asc" },
        { field: "time", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: { libelle: "libelle", date: "date", time: "time", room: "room" },
    prepare({ libelle, date, time, room }) {
      const toutLeJour = typeof libelle === "string" && prendToutLeJour(libelle);
      const jour = typeof date === "string" && date ? formatJourLong(date) : "";
      return {
        title: typeof libelle === "string" && libelle ? libelle : "Case sans film",
        subtitle: (toutLeJour ? [jour] : [jour, time, room]).filter(Boolean).join(" · "),
      };
    },
  },
});
