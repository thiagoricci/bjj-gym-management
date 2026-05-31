import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { themePresets, type ThemePreset } from "@/lib/themes";
import { useAuth } from "./AuthContext";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemePreset;
  mode: ThemeMode;
  setThemeById: (id: string) => void;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: "light" | "dark";
};

const STORAGE_KEY_MODE = "app-theme-mode";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemePreset>(() => themePresets[0]);

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode | null;
    return savedMode || "system";
  });

  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedMode: "light" | "dark" =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  const setThemeById = (id: string) => {
    const preset = themePresets.find((t) => t.id === id);
    if (preset) setTheme(preset);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, mode, setThemeById, setMode, resolvedMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export function AccountThemeScope({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, mode, resolvedMode, setThemeById, setMode } = useTheme();
  const { organization } = useAuth();
  const orgIdRef = useRef<string | null>(null);
  const loadedRef = useRef(false);
  const appliedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const orgId = organization?.id;
    if (!orgId) {
      loadedRef.current = false;
      orgIdRef.current = null;
      return;
    }

    if (orgIdRef.current !== orgId) {
      orgIdRef.current = orgId;
      loadedRef.current = false;

      const savedThemeId = localStorage.getItem(`org-theme-${orgId}`);
      const savedMode = localStorage.getItem(`org-mode-${orgId}`);

      if (savedThemeId) {
        const preset = themePresets.find((t) => t.id === savedThemeId);
        if (preset) setThemeById(savedThemeId);
      }
      if (
        savedMode === "light" ||
        savedMode === "dark" ||
        savedMode === "system"
      ) {
        setMode(savedMode);
      }

      loadedRef.current = true;
    }

    if (loadedRef.current) {
      localStorage.setItem(`org-theme-${orgId}`, theme.id);
      localStorage.setItem(`org-mode-${orgId}`, mode);
    }
  }, [organization?.id, theme.id, mode, setThemeById, setMode]);

  useEffect(() => {
    const root = document.documentElement;
    const vars =
      resolvedMode === "dark" ? theme.dark : theme.light;
    const keys = Object.keys(vars);

    root.classList.toggle("dark", resolvedMode === "dark");

    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }

    appliedKeysRef.current = new Set(keys);

    return () => {
      for (const key of appliedKeysRef.current) {
        root.style.removeProperty(key);
      }
      root.classList.remove("dark");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.toggle("dark", prefersDark);
    };
  }, [theme, resolvedMode]);

  return <>{children}</>;
}
