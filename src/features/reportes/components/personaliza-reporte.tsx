"use client";

import type { ComboboxOption } from "@/shared/components/ui/combobox";
import type { ColumnaReporte } from "../lib/definir-reporte";
import { type ConfiguracionResumen, MEDIDA_CANTIDAD } from "../lib/resumen-agrupado";
import { CampoSelect } from "./campos";

/** Niveles de agrupación de filas que se pueden elegir (máximo 3). */
const NIVELES = ["nivel-1", "nivel-2", "nivel-3"] as const;

/**
 * "Personaliza tu reporte": por qué columnas se agrupan las filas (hasta 3 niveles), cuál
 * pasa a columnas y qué se suma. Las opciones salen de las columnas `agrupable` y `sumable`.
 */
export function PersonalizaReporte<TFila>({
  columnas,
  config,
  onChange,
}: Readonly<{
  columnas: readonly ColumnaReporte<TFila>[];
  config: ConfiguracionResumen;
  onChange: (config: ConfiguracionResumen) => void;
}>) {
  const agrupables = columnas
    .filter((c) => c.agrupable)
    .map<ComboboxOption>((c) => ({ value: c.id, label: c.label }));
  const medidas: ComboboxOption[] = [
    { value: MEDIDA_CANTIDAD, label: "Cantidad de registros" },
    ...columnas.filter((c) => c.sumable).map((c) => ({ value: c.id, label: `Suma de ${c.label}` })),
  ];

  const libres = (propio: string) =>
    agrupables.filter(
      (o) => o.value === propio || (!config.filas.includes(o.value) && o.value !== config.columna),
    );

  const cambiarNivel = (indice: number, valor: string) => {
    // Al limpiar un nivel se quitan también los siguientes.
    const filas = [...config.filas.slice(0, indice), ...(valor ? [valor] : [])];
    onChange({ ...config, filas });
  };

  const visibles = NIVELES.slice(0, config.filas.length + 1);

  return (
    <div className="flex flex-col gap-3 p-4">
      {visibles.map((clave, indice) => {
        const valor = config.filas[indice] ?? "";
        return (
          <CampoSelect
            key={clave}
            id={clave}
            label={indice === 0 ? "Agrupar filas por" : `Luego por (nivel ${indice + 1})`}
            value={valor}
            onChange={(v) => cambiarNivel(indice, v)}
            opciones={libres(valor)}
          />
        );
      })}
      <CampoSelect
        id="columna-pivote"
        label="Desglosar en columnas por"
        value={config.columna}
        onChange={(columna) => onChange({ ...config, columna })}
        opciones={libres(config.columna)}
      />
      <CampoSelect
        id="medida"
        label="Valor a mostrar"
        value={config.medida}
        onChange={(medida) => onChange({ ...config, medida: medida || MEDIDA_CANTIDAD })}
        opciones={medidas}
        limpiable={false}
      />
    </div>
  );
}
