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
  BLANC, ENCRE, ESPACE_SOUS_LOGO, GRIS_JOUR, HAUTEUR_A4, HAUTEUR_LOGO, HAUTEUR_TITRE, MARGE,
  type MesuresFeuille, TRAIT,
} from './mesures'

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
      height: ${HAUTEUR_TITRE}mm;
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
      color: ${BLANC};
      font-weight: bold;
      text-transform: uppercase;
    }
    table.grise td { color: ${GRIS_CLAIR}; }
    table.grise tr.jour td { background: ${GRIS_CLAIR}; color: ${BLANC}; }
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
