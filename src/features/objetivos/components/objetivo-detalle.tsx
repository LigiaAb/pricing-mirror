"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { objetivos } from "@/features/objetivos/api/objetivos";
import { usePermisosCategoria } from "@/features/shell";
import { Button } from "@/shared/components/ui/button";
import { ObjetivoForm } from "./objetivo-form";

/**
 * Sin tabs: la opción del menú es una sola ("Lista", §1.1 del plan) y gobierna
 * tanto la lista como este detalle.
 */
export function ObjetivoDetalle({
  rutaBase,
  codObjetivo,
}: Readonly<{ rutaBase: string; codObjetivo: number | null }>) {
  const router = useRouter();
  const permisos = usePermisosCategoria("Lista");
  const esAlta = codObjetivo === null;
  const { data = [], isLoading } = objetivos.useLista();
  const objetivo = esAlta
    ? null
    : (data.find((item) => String(item.codObjetivo) === String(codObjetivo)) ?? null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(rutaBase)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar a la lista
        </Button>
        <h2 className="text-lg font-semibold">
          {esAlta ? "Nuevo objetivo" : (objetivo?.descripcion ?? "Objetivo")}
        </h2>
      </div>
      {isLoading && !esAlta ? (
        <div>Cargando...</div>
      ) : (
        <ObjetivoForm
          rutaBase={rutaBase}
          objetivo={objetivo}
          soloLectura={!esAlta && !permisos.puedeEditar}
        />
      )}
    </div>
  );
}
