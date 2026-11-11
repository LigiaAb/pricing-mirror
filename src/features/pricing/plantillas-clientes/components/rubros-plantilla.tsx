"use client";

import { Save } from "lucide-react";
import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { esRubroDueAgent } from "../../cotizacion/calculo/lib/clasificacion-rubros";
import {
  type PlantillaRubro,
  useGuardarPlantillaRubros,
  usePlantillasRubros,
} from "../api/plantillas-clientes";

type Id = string | number;
type Servicio = {
  cod_servicio?: Id | null;
  cod_rubro?: Id | null;
  nombre?: string | null;
  siglas?: string | null;
  obligatorio?: boolean | null;
  clasificacion?: Id | null;
  servicio_clasificacion?: Id | null;
};
type Rubro = { cod_rubro?: Id | null; nombre?: string | null };

const keyServicio = (item: Servicio) => `${item.cod_servicio}|${item.cod_rubro}`;

export function RubrosPlantilla({
  codTarifaPlantilla,
  servicios,
  rubros,
}: {
  codTarifaPlantilla: Id;
  servicios: Servicio[];
  rubros: Rubro[];
}) {
  const consulta = usePlantillasRubros();
  const guardar = useGuardarPlantillaRubros();
  const disponibles = React.useMemo(() => servicios.filter(esRubroDueAgent), [servicios]);
  const existentes = React.useMemo(
    () =>
      (consulta.data ?? []).filter(
        (item) =>
          String(item.cod_tarifaplantilla) === String(codTarifaPlantilla) &&
          item.cod_servicio != null &&
          Number(item.cod_estado ?? 1) === 1,
      ),
    [consulta.data, codTarifaPlantilla],
  );
  const [seleccion, setSeleccion] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const next = new Set(existentes.map((item) => `${item.cod_servicio}|${item.cod_rubro}`));
    disponibles.forEach((servicio) => {
      const hermanos = disponibles.filter(
        (item) => String(item.cod_rubro) === String(servicio.cod_rubro),
      );
      if (hermanos.length === 1 && servicio.obligatorio) next.add(keyServicio(servicio));
    });
    setSeleccion(next);
  }, [disponibles, existentes]);

  const cambiar = (servicio: Servicio, checked: boolean) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (checked) {
        disponibles
          .filter((item) => String(item.cod_rubro) === String(servicio.cod_rubro))
          .forEach((item) => {
            next.delete(keyServicio(item));
          });
        next.add(keyServicio(servicio));
      } else next.delete(keyServicio(servicio));
      return next;
    });
  };

  const handleGuardar = async () => {
    const existentesPorKey = new Map(
      existentes.map((item) => [`${item.cod_servicio}|${item.cod_rubro}`, item]),
    );
    const insertar = disponibles
      .filter(
        (item) => seleccion.has(keyServicio(item)) && !existentesPorKey.has(keyServicio(item)),
      )
      .map((item) => ({
        cod_tarifaplantilla: codTarifaPlantilla,
        cod_servicio: item.cod_servicio,
        cod_rubro: item.cod_rubro,
        obligatorio: Boolean(item.obligatorio),
        cod_estado: 1,
      }));
    const eliminar = existentes
      .filter((item) => !seleccion.has(`${item.cod_servicio}|${item.cod_rubro}`))
      .map((item: PlantillaRubro) => ({ ...item, cod_estado: 2 }));
    await guardar.mutateAsync({ insertar, eliminar });
  };

  const grupos = React.useMemo(() => {
    const resultado = new Map<string, Servicio[]>();
    disponibles.forEach((item) => {
      const key = String(item.cod_rubro ?? "");
      resultado.set(key, [...(resultado.get(key) ?? []), item]);
    });
    return resultado;
  }, [disponibles]);

  return (
    <div className="space-y-4">
      {[...grupos.entries()].map(([codRubro, items]) => (
        <section key={codRubro} className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">
            {rubros.find((item) => String(item.cod_rubro) === codRubro)?.nombre ??
              `Rubro ${codRubro}`}
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {items.map((servicio) => {
              const obligatorio = items.length === 1 && Boolean(servicio.obligatorio);
              const key = keyServicio(servicio);
              const checkboxId = `servicio-${key}`;
              return (
                <label
                  key={key}
                  htmlFor={checkboxId}
                  className="flex items-start gap-2 rounded-md border p-3"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={seleccion.has(key)}
                    disabled={obligatorio}
                    onCheckedChange={(value) => cambiar(servicio, value === true)}
                  />
                  <span>
                    <span className="block font-medium">{servicio.nombre}</span>
                    <span className="text-xs text-muted-foreground">{servicio.siglas}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
      <Button type="button" disabled={guardar.isPending} onClick={() => void handleGuardar()}>
        <Save className="size-4" />
        Guardar rubros
      </Button>
    </div>
  );
}
