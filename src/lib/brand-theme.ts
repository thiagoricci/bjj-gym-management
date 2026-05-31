import { useEffect, type CSSProperties } from "react";

// Fixed brand palette (the "Midnight" preset) used on public/unauthenticated
// pages — Landing, Login — so they always render in the standard brand colors
// and never inherit an account's selected theme. Applied as inline CSS variables
// on the page's root container, which overrides the values AccountThemeScope
// writes to :root for that subtree.
export const brandFixedStyles: CSSProperties = {
  ["--background" as string]: "220 17% 97%",
  ["--foreground" as string]: "222 47% 11%",
  ["--card" as string]: "0 0% 100%",
  ["--card-foreground" as string]: "222 47% 11%",
  ["--popover" as string]: "0 0% 100%",
  ["--popover-foreground" as string]: "222 47% 11%",
  ["--primary" as string]: "237 83% 27%",
  ["--primary-foreground" as string]: "0 0% 100%",
  ["--secondary" as string]: "220 14% 96%",
  ["--secondary-foreground" as string]: "222 47% 11%",
  ["--muted" as string]: "220 14% 96%",
  ["--muted-foreground" as string]: "215 16% 47%",
  ["--accent" as string]: "348 83% 47%",
  ["--accent-foreground" as string]: "0 0% 100%",
  ["--destructive" as string]: "0 84% 60%",
  ["--destructive-foreground" as string]: "0 0% 100%",
  ["--border" as string]: "220 13% 91%",
  ["--input" as string]: "220 13% 91%",
  ["--ring" as string]: "237 83% 27%",
  ["--radius" as string]: "0.75rem",
  ["--sidebar" as string]: "0 0% 100%",
  ["--sidebar-foreground" as string]: "222 47% 11%",
  ["--sidebar-border" as string]: "220 13% 91%",
  ["--sidebar-accent" as string]: "220 14% 96%",
  ["--sidebar-accent-foreground" as string]: "222 47% 11%",
  ["--sidebar-ring" as string]: "237 83% 27%",
  ["--gradient-primary" as string]:
    "linear-gradient(135deg, hsl(237 83% 27%), hsl(237 83% 37%))",
  ["--gradient-accent" as string]:
    "linear-gradient(135deg, hsl(348 83% 47%), hsl(348 83% 57%))",
  ["--gradient-card" as string]:
    "linear-gradient(180deg, hsl(0 0% 100%), hsl(220 17% 99%))",
  ["--transition-smooth" as string]: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  colorScheme: "light",
};

// Force light mode while a public page is mounted, restoring the previous
// dark-mode state on unmount. Pairs with brandFixedStyles.
export function useBrandLightMode() {
  useEffect(() => {
    const hadDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
    return () => {
      if (hadDark) document.documentElement.classList.add("dark");
    };
  }, []);
}
