"use client";

/**
 * Pantallas terminales del wizard público: gestión ya culminada y link
 * expirado (port de las vistas de cierre de public/page.jsx del legacy).
 */

import { CheckCircle2, Link2Off } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

interface PantallaGestionCompletadaProps {
  readonly mensaje?: string;
  /** Legacy `bpm/SuccessScreen.jsx`: sin `onVolver` no se ofrece salida (caso
   * de la vista pública, sin listado accesible para el cliente). */
  readonly onVolver?: () => void;
  readonly volverTexto?: string;
}

export function PantallaGestionCompletada({
  mensaje,
  onVolver,
  volverTexto = "Volver al listado",
}: PantallaGestionCompletadaProps) {
  return (
    <div className="grid min-h-[70vh] place-items-center p-4">
      <Card className="w-full max-w-xl">
        <div className="h-2 w-full rounded-t-xl bg-emerald-500" />
        <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <h1 className="text-xl font-semibold">Formulario Registrado con éxito</h1>
          <p className="text-muted-foreground">
            {mensaje || "La gestión ya culminó de manera satisfactoria."}
          </p>
          {onVolver && (
            <Button size="lg" className="mt-1 min-w-50" onClick={onVolver}>
              {volverTexto}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PantallaLinkExpirado() {
  return (
    <div className="grid min-h-[70vh] place-items-center p-4">
      <Card className="w-full max-w-xl">
        <div className="h-2 w-full rounded-t-xl bg-amber-500" />
        <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Link2Off className="size-12 text-amber-600" />
          <h1 className="text-xl font-semibold">El link ha expirado</h1>
          <p className="text-muted-foreground">Por favor solicite un nuevo link a su asesor.</p>
        </CardContent>
      </Card>
    </div>
  );
}
