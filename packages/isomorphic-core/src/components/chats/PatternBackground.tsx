"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function PatternBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
      {/* Simple Checkered Pattern */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, ${isDark ? "#222" : "#e5e7eb"} 25%, transparent 25%, transparent 75%, ${isDark ? "#222" : "#e5e7eb"} 75%),
            linear-gradient(45deg, ${isDark ? "#222" : "#e5e7eb"} 25%, transparent 25%, transparent 75%, ${isDark ? "#222" : "#e5e7eb"} 75%)`,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px",
        }}
      />
    </div>
  );
}
