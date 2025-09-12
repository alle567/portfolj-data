"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // avoid hydration mismatch
    return (
      <div className="flex items-center gap-2 opacity-0">
        <Sun className="h-4 w-4" />
        <Switch />
        <Moon className="h-4 w-4" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 opacity-60" />
      <Switch
        checked={isDark}
        onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <Moon className="h-4 w-4 opacity-60" />
    </div>
  );
}
