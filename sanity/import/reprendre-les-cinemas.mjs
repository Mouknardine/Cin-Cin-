/* ============================================================
   Rattache le contenu déjà saisi au cinéma auquel il appartient.

   Le Studio connaît maintenant plusieurs cinémas : les films y sont
   communs, mais chaque cinéma a sa fiche et ses séances. Le contenu
   enregistré avant ce changement ne dit pas encore de quel cinéma il
   parle. Ce script le lui dit, une fois pour toutes.

   Deux façons de le lancer, l'une sûre, l'autre définitive :

     node sanity/import/reprendre-les-cinemas.mjs              → SIMULATION
     node sanity/import/reprendre-les-cinemas.mjs --appliquer   → pour de vrai

   Sans « --appliquer », le script lit Sanity, dit exactement ce qu'il
   ferait, et n'écrit rien.

   Il lui faut un jeton d'écriture dans SANITY_WRITE_TOKEN. Le plus
   simple est de passer par l'onglet Actions de GitHub, où le jeton
   est déjà rangé : workflow « Reprendre les cinémas ».

   Ce qu'il fait, dans l'ordre :

     1. il donne un NOM et un NOM COURT à la fiche du cinéma
        historique, si elle n'en a pas encore ;
     2. il rattache à ce cinéma toutes les SÉANCES qui ne disent pas
        où elles ont lieu.

   Il ne touche à rien d'autre : ni aux films, ni aux tarifs, ni aux
   salles, ni aux séances déjà rattachées. Le lancer deux fois ne
   change rien de plus.
   ============================================================ */

import { createClient } from "@sanity/client";

/* L'identifiant de la fiche du cinéma historique. Elle s'appelle
   « siteSettings » : c'est le nom qu'elle portait du temps où il n'y
   avait qu'un cinéma. */
const ID_CINEMA_HISTORIQUE = "siteSettings";
const NOM_PAR_DEFAUT = "Zinéma";
const NOM_COURT_PAR_DEFAUT = "zinema";

/* Sans « --appliquer », on ne fait que regarder. */
const SIMULATION = !process.argv.includes("--appliquer");

const jeton = process.env.SANITY_WRITE_TOKEN;
if (!jeton) {
  console.error(
    "\n✗ Il manque le jeton d'écriture Sanity (SANITY_WRITE_TOKEN).\n" +
      "  Il se crée sur https://www.sanity.io/manage → projet vle63mzm →\n" +
      "  API → Tokens → Add API token, avec les droits « Editor ».\n"
  );
  process.exit(1);
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "vle63mzm",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-06-01",
  token: jeton,
  useCdn: false, // on veut l'état réel, pas une copie de cache
});

const dire = (...mots) => console.log(...mots);
const titre = (texte) => dire("\n" + texte + "\n" + "─".repeat(texte.length));

/* ---------------- 1. La fiche du cinéma historique ---------------- */

async function nommerLeCinemaHistorique() {
  titre("La fiche du cinéma");

  const fiche = await client.fetch(
    '*[_id == $id][0]{_id, nom, "nomCourt": slug.current, "salles": salles[].nom}',
    { id: ID_CINEMA_HISTORIQUE }
  );

  if (!fiche) {
    dire(
      `   ✗ Aucune fiche « ${ID_CINEMA_HISTORIQUE} » dans ce Studio.\n` +
        "     Rien à reprendre : créez vos cinémas à la main dans « Cinémas »,\n" +
        "     puis indiquez le cinéma de chaque séance."
    );
    return null;
  }

  const aManquer = [];
  const correctif = {};
  if (!fiche.nom) {
    correctif.nom = NOM_PAR_DEFAUT;
    aManquer.push(`nom → « ${NOM_PAR_DEFAUT} »`);
  }
  if (!fiche.nomCourt) {
    correctif.slug = { _type: "slug", current: NOM_COURT_PAR_DEFAUT };
    aManquer.push(`nom court → « ${NOM_COURT_PAR_DEFAUT} »`);
  }

  if (aManquer.length === 0) {
    dire(`   ✓ « ${fiche.nom} » est déjà nommée (nom court : ${fiche.nomCourt}).`);
  } else {
    dire(`   ${SIMULATION ? "à écrire" : "écrit"} : ${aManquer.join(", ")}`);
    if (!SIMULATION) await client.patch(fiche._id).set(correctif).commit();
  }

  const salles = (fiche.salles || []).filter(Boolean);
  dire(`   Salles déclarées : ${salles.length ? salles.join(", ") : "AUCUNE — à ajouter dans sa fiche"}`);

  return fiche._id;
}

/* ---------------- 2. Les séances sans cinéma ---------------- */

/* Les séances partent par paquets : une transaction de plusieurs
   milliers de documents serait refusée par Sanity. */
const TAILLE_PAQUET = 100;

async function rattacherLesSeances(idCinema) {
  titre("Les séances");

  const seances = await client.fetch(
    '*[_type == "screening" && !defined(cinema)]{_id, date, "salle": room} | order(date asc)'
  );

  if (seances.length === 0) {
    dire("   ✓ Toutes les séances disent déjà dans quel cinéma elles ont lieu.");
    return;
  }

  const premiere = seances[0]?.date ?? "?";
  const derniere = seances[seances.length - 1]?.date ?? "?";
  dire(
    `   ${seances.length} séance(s) sans cinéma, du ${premiere} au ${derniere}.\n` +
      `   ${SIMULATION ? "À rattacher" : "Rattachées"} à la fiche « ${idCinema} ».`
  );

  /* Les salles nommées dans ces séances : si l'une n'existe pas dans la
     fiche du cinéma, la caisse ne saura pas compter ses places. On le
     dit maintenant plutôt que le jour d'une vente. */
  const salles = [...new Set(seances.map((s) => s.salle).filter(Boolean))];
  const declarees = await client.fetch('*[_id == $id][0].salles[].nom', { id: idCinema });
  const inconnues = salles.filter((salle) => !(declarees || []).includes(salle));
  if (inconnues.length) {
    dire(
      `   ⚠︎  Salles nommées dans les séances mais absentes de la fiche : ${inconnues.join(", ")}.\n` +
        "       Ajoutez-les à la fiche du cinéma, ou corrigez ces séances."
    );
  }

  if (SIMULATION) return;

  for (let debut = 0; debut < seances.length; debut += TAILLE_PAQUET) {
    const paquet = seances.slice(debut, debut + TAILLE_PAQUET);
    let transaction = client.transaction();
    for (const seance of paquet) {
      transaction = transaction.patch(seance._id, (patch) =>
        patch.set({ cinema: { _type: "reference", _ref: idCinema } })
      );
    }
    await transaction.commit();
    dire(`   … ${Math.min(debut + TAILLE_PAQUET, seances.length)} / ${seances.length}`);
  }
}

/* ---------------- Le déroulé ---------------- */

async function principal() {
  titre("Reprendre les cinémas");
  dire(
    SIMULATION
      ? "MODE SIMULATION — rien ne sera écrit. Relancer avec « --appliquer » pour le faire vraiment.\n"
      : "MODE RÉEL — les modifications partent dans le Studio.\n"
  );

  const idCinema = await nommerLeCinemaHistorique();
  if (idCinema) await rattacherLesSeances(idCinema);

  titre("Il reste à faire à la main");
  dire("   Créer la fiche de chaque autre cinéma dans « Cinémas »,");
  dire("   avec son adresse, ses horaires, ses tarifs et ses salles.");
  dire(
    SIMULATION
      ? "\nSimulation terminée : rien n'a été modifié.\n"
      : "\nTerminé. Le site affiche le nouveau contenu immédiatement.\n"
  );
}

principal().catch((erreur) => {
  console.error("\n✗ Le script s'est arrêté :", erreur.message);
  console.error("  Si Sanity refuse l'accès, le jeton est absent, expiré, ou");
  console.error("  n'a pas les droits « Editor ».\n");
  process.exit(1);
});
