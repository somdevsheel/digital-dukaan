import { createContext, useContext, type ReactNode } from "react";

export interface Theme {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  radius: number;
}

// Mirrors @platform/ui's CSS-variable convention (light-mode values only — RN has no
// prefers-color-scheme media query story as clean as the web's, so dark mode for the native
// apps is a later pass) with each app supplying its own `primary` at the root, the same way
// web-merchant/web-admin/web-public each set one accent hue in globals.css.
export function createTheme(primary: string, primaryForeground = "#FFFFFF"): Theme {
  return {
    background: "#FFFFFF",
    foreground: "#1F2023",
    card: "#FFFFFF",
    cardForeground: "#1F2023",
    primary,
    primaryForeground,
    secondary: "#F4F4F5",
    secondaryForeground: "#1F2023",
    muted: "#F4F4F5",
    mutedForeground: "#71717A",
    border: "#E4E4E7",
    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",
    success: "#059669",
    warning: "#D97706",
    radius: 12,
  };
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used within a ThemeProvider");
  return theme;
}
