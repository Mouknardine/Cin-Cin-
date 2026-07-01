// GitHub Pages sert un "project site" dans un sous-dossier
// (mouknardine.github.io/Cin-Cin-/), pas à la racine du domaine. Le
// workflow GitHub Actions positionne NEXT_PUBLIC_BASE_PATH="/Cin-Cin-"
// avant le build ; en local ou sur un hébergement à la racine (Infomaniak
// avec domaine dédié), la variable est absente et basePath reste vide.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export statique : "next build" écrit un site HTML/CSS/JS pur dans out/,
  // déployable sur n'importe quel hébergement statique (Infomaniak, GitHub
  // Pages, etc). Pas de serveur Node requis. Le contenu Sanity est figé au
  // moment du build — il faut rebuild + redéployer après chaque changement
  // dans le Studio.
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  // Génère /agenda/index.html plutôt que /agenda.html : un hébergement
  // statique basique (Apache mutualisé Infomaniak, GitHub Pages...) sert
  // nativement l'index d'un dossier, sans règle de réécriture à configurer.
  trailingSlash: true,
  images: {
    // L'optimisation d'image à la volée de Next nécessite un serveur ;
    // en export statique elle est désactivée, next/image rend une <img>
    // classique. Les images Sanity sont déjà redimensionnées via l'URL
    // builder, donc le poids reste maîtrisé.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
