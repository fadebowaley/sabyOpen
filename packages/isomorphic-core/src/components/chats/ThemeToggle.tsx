"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@chats/ui/button";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-20 right-6 z-[100] w-12 h-12 p-0 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse" />
      </Button>
    );
  }

  return (
    <Button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      variant="ghost"
      size="sm"
      className={`
        fixed top-20 right-6 z-[100] w-12 h-12 p-0 rounded-2xl 
        bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm 
        border border-gray-200 dark:border-gray-700 
        shadow-lg hover:shadow-xl transition-all duration-300 
        hover:scale-105 group
        ${
          theme === "dark"
            ? "hover:shadow-blue-500/20 border-blue-500/30"
            : "hover:shadow-amber-500/20 border-amber-500/30"
        }
        active:scale-95
        backdrop-blur-[8px]
      `}>
      <div className="relative w-6 h-6 group-hover:animate-pulse">
        <Sun
          className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-500 ${
            theme === "dark"
              ? "opacity-0 scale-0 rotate-90"
              : "opacity-100 scale-100 rotate-0"
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 text-blue-600 dark:text-blue-400 transition-all duration-500 ${
            theme === "dark"
              ? "opacity-100 scale-100 rotate-0"
              : "opacity-0 scale-0 -rotate-90"
          }`}
        />
      </div>

      {/* Subtle glow effect */}
      <div
        className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
          theme === "dark"
            ? "bg-blue-500/10 group-hover:bg-blue-500/20"
            : "bg-amber-500/10 group-hover:bg-amber-500/20"
        }`}
      />
    </Button>
  );
}
