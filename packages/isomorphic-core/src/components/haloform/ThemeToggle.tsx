"use client"

import React from "react";
import { useTheme } from "@haloform/hooks/use-theme";
import { Button } from "@haloform/ui/button";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@haloform/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 transition-all hover:scale-110"
          >
            {theme === "dark" ? (
              <Moon className="h-[20px] w-[20px] transition-transform" />
            ) : (
              <Sun className="h-[20px] w-[20px] transition-transform" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === "dark" ? "Light" : "Dark"} Mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ThemeToggle;
