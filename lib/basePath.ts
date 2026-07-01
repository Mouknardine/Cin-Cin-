// Préfixe de chemin quand le site est publié dans un sous-dossier (ex.
// GitHub Pages : mouknardine.github.io/Cin-Cin-/). Next.js gère ça tout
// seul pour next/link, next/router et les imports d'images statiques,
// mais pas pour une chaîne écrite à la main dans l'API metadata — d'où ce
// petit helper pour le favicon.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
