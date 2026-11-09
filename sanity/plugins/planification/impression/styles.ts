/**
 * La feuille de style de la feuille A4 : un format de page fixe, des
 * hauteurs en millimètres, et un aperçu à l'écran qui montre la feuille
 * posée sur un fond gris, comme sur une table.
 *
 * Une seule taille de texte, et une règle pour la graisse : les titres
 * (la semaine, les jours) en gras, les séances en maigre — tout est déjà
 * en capitales (demande du cinéma, 29 septembre 2026).
 *
 * Le lundi et le mardi qui précèdent la semaine passent en grisé, à la même
 * taille : le même gris que dans la newsletter.
 */
import {GRIS_CLAIR} from '../newsletter/html'
import {
  BLANC, ENCRE, ESPACE_SOUS_LOGO, GRIS_AVANT, GRIS_JOUR, HAUTEUR_A4, HAUTEUR_LOGO, MARGE,
  type MesuresFeuille, TRAIT,
} from './mesures'

/** La hauteur de plusieurs lignes empilées : les lignes, et les traits qu'elles absorbent. */
function hauteurDeLignes(hauteurLigne: number, lignes: number): number {
  return Math.floor((lignes * hauteurLigne + (lignes - 1) * TRAIT) * 100) / 100
}

export function stylesDeLaFeuille(mesures: MesuresFeuille): string {
  return `
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      background: #d9d9d9;
      font-family: Arial, Helvetica, sans-serif;
      color: ${ENCRE};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .feuille {
      width: 210mm;
      height: ${HAUTEUR_A4}mm;
      margin: 8mm auto;
      padding: ${MARGE}mm;
      background: ${BLANC};
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }
    .logo {
      display: block;
      width: 100%;
      height: ${HAUTEUR_LOGO}mm;
      margin: 0 auto ${ESPACE_SOUS_LOGO}mm;
    }
    .titre-semaine {
      height: ${mesures.hauteurBandeau}mm;
      display: flex;
      align-items: center;
      padding: 0 3mm;
      background: ${ENCRE};
      color: ${BLANC};
      font-size: ${mesures.tailleTexte}mm;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    /* La hauteur de chaque tableau est posée sur le tableau lui-même : le
       lundi et le mardi en grisé, puis la semaine, se partagent la page. */
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    td {
      height: ${mesures.hauteurLigne}mm;
      padding: 0 3mm;
      border: ${TRAIT}mm solid ${ENCRE};
      font-size: ${mesures.tailleTexte}mm;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }
    tr.jour td {
      background: ${GRIS_JOUR};
      color: ${ENCRE};
      font-weight: bold;
      text-transform: uppercase;
    }
    /* Une séance spéciale : sa mention est en gras, après le titre. Le texte
       passe à la ligne : la case prend deux ou trois lignes de hauteur. */
    .mention { font-weight: bold; }
    tr.lignes-2 td { height: ${hauteurDeLignes(mesures.hauteurLigne, 2)}mm; }
    tr.lignes-3 td { height: ${hauteurDeLignes(mesures.hauteurLigne, 3)}mm; }
    tr.lignes-2 td.titre, tr.lignes-3 td.titre { white-space: normal; line-height: 1.1; }
    /* Sur plusieurs lignes, l'heure, le titre et la salle s'alignent en haut
       de la case, sur la première ligne du titre (demande du cinéma, 9 novembre 2026). */
    tr.lignes-2 td, tr.lignes-3 td { vertical-align: top; padding-top: 0.9mm; }
    .titre-long {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
    tr.lignes-2 .titre-long { -webkit-line-clamp: 2; }
    table.grise td { color: ${GRIS_CLAIR}; }
    table.grise tr.jour td { background: ${GRIS_AVANT}; color: ${GRIS_CLAIR}; }
    col.col-heure { width: 17mm; }
    col.col-salle { width: 30mm; }
    td.heure { font-variant-numeric: tabular-nums; }
    td.titre { text-transform: uppercase; }
    td.salle { text-align: right; text-transform: uppercase; }
    td.vide { text-align: center; }
    @media print {
      body { background: ${BLANC}; }
      .feuille { margin: 0; box-shadow: none; }
    }
  `
}
