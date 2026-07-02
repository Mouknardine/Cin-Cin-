import type { Metadata } from "next";
import { NavShell } from "@/components/layout/NavShell";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HideOnHome, MainArea } from "@/components/layout/HomeChrome";
import { getSiteSettings } from "@/lib/content";
import { basePath } from "@/lib/basePath";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.tagline ? `Zinéma — ${settings.tagline}` : "Zinéma — Cinéma indépendant à Lausanne",
    description:
      settings.seoDescription ||
      "Le Zinéma, cinéma indépendant à Lausanne : films en VO, avant-premières, ciné-club, brunchs-ciné et cycles thématiques.",
    icons: { icon: `${basePath}/zinema-logo.png` },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=tanker@400&f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <NavShell />
        <MainArea>{children}</MainArea>
        <HideOnHome>
          <SiteFooter settings={settings} />
        </HideOnHome>
      </body>
    </html>
  );
}
