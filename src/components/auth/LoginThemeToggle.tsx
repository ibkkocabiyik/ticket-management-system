"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function LoginThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/80"
      title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
