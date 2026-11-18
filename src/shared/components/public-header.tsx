"use client";

/**
 * Barra superior de las rutas públicas (`/public/*`): mismo estilo
 * "header-premium" (material plano translúcido azul corporativo) que `AppHeader`
 * (features/shell/components/header.tsx), reducido a logo + toggle de tema.
 *
 * El toggle usa colores blancos fijos (no `ModeToggle`, atado a
 * `--sidebar-foreground`): esta barra es siempre oscura sin importar el tema
 * activo, igual que el botón de tema de la pantalla de login
 * (login-client.tsx) — con `ModeToggle` el ícono se volvía invisible en tema
 * claro (el token del sidebar resuelve oscuro sobre un fondo que aquí nunca
 * cambia).
 */

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { CropaLogo } from "@/shared/components/cropa-logo";
import { Button } from "@/shared/components/ui/button";

function PublicThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="h-[1.1rem] w-[1.1rem]" suppressHydrationWarning />
      ) : (
        <Moon className="h-[1.1rem] w-[1.1rem]" suppressHydrationWarning />
      )}
    </Button>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="header-premium">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2 rounded-lg p-1">
            <CropaLogo className="h-10 w-auto text-white" />
          </div>
          <div className="flex-1" />
          <PublicThemeToggle />
        </div>
      </div>
    </header>
  );
}
