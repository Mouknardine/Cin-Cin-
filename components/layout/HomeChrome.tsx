"use client";

import { usePathname } from "next/navigation";

export function HideOnHome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}

export function MainArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return <main className={isHome ? "" : "pt-[57px] md:pt-[73px]"}>{children}</main>;
}
