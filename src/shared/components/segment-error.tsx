"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/shared/components/ui/button";

/**
 * Cuerpo común de los error boundaries por segmento (error.tsx).
 * Cada segmento de feature lo monta con su descripción propia.
 */
export function SegmentError({
  error,
  reset,
  descripcion = "Ocurrió un error inesperado. Puedes intentar recargar la sección.",
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
  descripcion?: string;
}>) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Algo salió mal</h2>
        <p className="max-w-md text-muted-foreground">{descripcion}</p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/50">ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        Intentar de nuevo
      </Button>
    </div>
  );
}
