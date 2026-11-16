"use client";

/**
 * Modal "Crear Entidad" en modo captura: NO llama endpoints. La entidad nueva
 * viaja sin `entidad_id` dentro del formulario de la carta; el backend la crea
 * al procesar actualizar-json-link (público) o el motor de commit al confirmar
 * "Crear Coordinación" (privado). Port del legacy `nuevaEntidad.jsx` con
 * `hidePaisesAsociados` (la variante con endpoints ya existe en
 * features/entidades como NuevaEntidad).
 */

import { useMemo, useState } from "react";
import {
  ciudades,
  ciudadesPublico,
  industrias,
  industriasPublico,
  paises,
  paisesPublico,
} from "@/features/catalogos";
import { Button } from "@/shared/components/ui/button";
import { Combobox } from "@/shared/components/ui/combobox";
import type { JsonRecord } from "./model";

interface Props {
  readonly apiMode: "public" | "private";
  /** cod_tipo de la entidad (shipper 155 / consignatario 156). */
  readonly tipo: number;
  readonly onCreate: (entidad: JsonRecord) => void;
}

const INPUT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function NuevaEntidadCaptura({ apiMode, tipo, onCreate }: Props) {
  const esPrivado = apiMode === "private";
  const [valores, setValores] = useState({
    entidad_nombre: "",
    cod_pais: "",
    cod_ciudad: "",
    cod_industria: "",
  });

  const { data: paisesPrivadoData = [] } = paises.useLista({}, { enabled: esPrivado });
  const { data: paisesPublicoData = [] } = paisesPublico.useLista({}, { enabled: !esPrivado });
  const paisesData = esPrivado ? paisesPrivadoData : paisesPublicoData;

  const { data: ciudadesPrivadoData = [] } = ciudades.useLista({}, { enabled: esPrivado });
  const { data: ciudadesPublicoData = [] } = ciudadesPublico.useLista(
    { cod_pais: valores.cod_pais },
    { enabled: !esPrivado && Boolean(valores.cod_pais) },
  );
  const ciudadesData = esPrivado
    ? ciudadesPrivadoData.filter(
        (c) => valores.cod_pais && String(c.cod_pais) === String(valores.cod_pais),
      )
    : ciudadesPublicoData;

  const { data: industriasPrivadoData = [] } = industrias.useLista({}, { enabled: esPrivado });
  const { data: industriasPublicoData = [] } = industriasPublico.useLista(
    {},
    { enabled: !esPrivado },
  );
  const industriasData = esPrivado ? industriasPrivadoData : industriasPublicoData;

  const campos = useMemo(
    () => [
      {
        key: "cod_pais" as const,
        label: "País",
        options: paisesData.map((p) => ({ value: p.cod_pais, label: p.nombre_pais })),
      },
      {
        key: "cod_ciudad" as const,
        label: "Ciudad",
        options: ciudadesData.map((c) => ({ value: c.cod_ciudad, label: c.nombre_ciudad })),
      },
      {
        key: "cod_industria" as const,
        label: "Industria",
        options: industriasData.map((i) => ({ value: i.cod_industria, label: i.nom_industria_es })),
      },
    ],
    [paisesData, ciudadesData, industriasData],
  );

  const esValido = Boolean(
    valores.entidad_nombre.trim() &&
      valores.cod_pais &&
      valores.cod_ciudad &&
      valores.cod_industria,
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="nueva-entidad-nombre" className="mb-1 block text-sm font-medium">
          Nombre<span className="text-destructive ml-1">*</span>
        </label>
        <input
          id="nueva-entidad-nombre"
          type="text"
          value={valores.entidad_nombre}
          onChange={(e) => setValores((prev) => ({ ...prev, entidad_nombre: e.target.value }))}
          className={INPUT_CLASS}
        />
      </div>
      {campos.map((campo) => (
        <div key={campo.key}>
          <label htmlFor={`nueva-entidad-${campo.key}`} className="mb-1 block text-sm font-medium">
            {campo.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <Combobox
            clearable
            id={`nueva-entidad-${campo.key}`}
            value={valores[campo.key]}
            onChange={(value) =>
              setValores((prev) => ({
                ...prev,
                [campo.key]: value,
                // cambiar de país invalida la ciudad elegida
                ...(campo.key === "cod_pais" ? { cod_ciudad: "" } : {}),
              }))
            }
            options={campo.options.map((opt) => ({ ...opt, value: String(opt.value) }))}
            placeholder="Seleccionar..."
          />
        </div>
      ))}
      <div className="flex justify-end">
        <Button
          disabled={!esValido}
          onClick={() =>
            onCreate({
              entidad_nombre: valores.entidad_nombre.trim(),
              cod_pais: valores.cod_pais,
              cod_ciudad: valores.cod_ciudad,
              cod_industria: valores.cod_industria,
              cod_tipo: tipo,
              entidad_id: null,
              _esNueva: true,
            })
          }
        >
          Crear
        </Button>
      </div>
    </div>
  );
}
