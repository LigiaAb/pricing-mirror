"use client";

import { Calculator, Ruler } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  CalculadoraMedidas,
  type DimensionCalculo,
  type TotalesMedidas,
} from "@/features/pricing/shared";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
import { COD_CRITERIO_EXPRESS } from "../lib/constantes";
import type { ValoresCriterios } from "../lib/criterios-cotizacion";
import type { Id, OpcionCriterio } from "../lib/tipos";

/* ==========================================================================
 * TIPOS
 * ========================================================================== */

export type CriterioFormulario = {
  cod_criterio: Id;

  cod_tipo_dato: string | number;

  campo: string;

  descripcion: string;

  [key: string]: unknown;
};

export type { OpcionCriterio };

type Props = {
  criteriosDisponibles: CriterioFormulario[];

  valores: ValoresCriterios;

  dimensiones: DimensionCalculo[];

  valorCw: unknown;

  valorPeso: unknown;

  lectura?: boolean;

  /**
   * El legado solamente muestra el criterio 13
   * cuando `mostrarExpress === true`.
   *
   * Actualmente Grid no lo enviaba,
   * por lo que el default debe seguir siendo false.
   */
  mostrarExpress?: boolean;

  codTipoTransporte?: Id | null;

  onChange: (campo: string, value: unknown) => void;

  onAplicarMedidas: (data: {
    dimensiones: DimensionCalculo[];

    totales: TotalesMedidas;
  }) => void;

  onCalcular: () => void | Promise<void>;
};

/* ==========================================================================
 * CAMPOS NO VISIBLES
 * ========================================================================== */

/**
 * Copia directa de INPUTS_NO_VISIBLES
 * de GenerarFiltrosCriterios.
 */
const INPUTS_NO_VISIBLES = new Set([
  "valor_cw",

  "cod_puntoenlace_origen",

  "cod_puntoenlace_destino",

  "entidad_id",

  "express",

  "categoria_transporte",

  "valor_dueagent",

  "valor_kilos",

  "valor_por_peso",

  "valor_flete",

  "valor_factura",
]);

/* ==========================================================================
 * HELPERS
 * ========================================================================== */

function obtenerValorOpcion(value: unknown): unknown {
  if (value !== null && typeof value === "object" && "value" in value) {
    return (
      value as {
        value?: unknown;
      }
    ).value;
  }

  return value;
}

function buscarOpcionSeleccionada(value: unknown, options: OpcionCriterio[]) {
  const selectedValue = obtenerValorOpcion(value);

  return options.find((option) => String(option.value) === String(selectedValue ?? "")) ?? null;
}

function numeroMostrar(value: unknown) {
  const result = Number(value ?? 0);

  if (!Number.isFinite(result)) {
    return "0";
  }

  /*
   * CW y peso se mostraban
   * sin decimales.
   */
  return result.toFixed(0);
}

function obtenerValorInicialCalculadora(value: unknown): string | number | null {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return null;
}

/* ==========================================================================
 * INPUT INDIVIDUAL
 * ========================================================================== */

function CriterioInput({
  criterio,

  value,

  options,

  lectura,

  onChange,
}: {
  criterio: CriterioFormulario;

  value: unknown;

  options: OpcionCriterio[];

  lectura: boolean;

  onChange: (value: unknown) => void;
}) {
  const tipo = Number(criterio.cod_tipo_dato);

  /* --------------------------------------------------------------------------
   * 1 - NUMBER
   * ----------------------------------------------------------------------- */

  if (tipo === 1) {
    return (
      <Input
        type="number"
        min={0}
        disabled={lectura}
        value={value == null ? "" : String(value)}
        onChange={(event) => {
          /*
           * Conservamos el string recibido
           * del input.
           *
           * El legado tampoco lo fuerza
           * a Number en handleInput.
           */
          onChange(event.target.value);
        }}
      />
    );
  }

  /* --------------------------------------------------------------------------
   * 5 - CALCULADO
   * ----------------------------------------------------------------------- */

  if (tipo === 5) {
    return <Input type="number" min={0} readOnly value={value == null ? "" : String(value)} />;
  }

  /* --------------------------------------------------------------------------
   * 4 - SELECT
   * ----------------------------------------------------------------------- */

  if (tipo === 4) {
    const opcionSeleccionada = buscarOpcionSeleccionada(value, options);

    return (
      <select
        disabled={lectura}
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        value={opcionSeleccionada ? String(opcionSeleccionada.value) : ""}
        onChange={(event) => {
          const option = options.find((item) => String(item.value) === event.target.value) ?? null;

          /*
           * El formulario antiguo mantiene
           * objetos de catálogo en valores.
           *
           * Ejemplo explícito:
           * cod_commodity = { value, label }
           */
          onChange(option);
        }}
      >
        <option value="">Seleccione</option>

        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  /* --------------------------------------------------------------------------
   * 6 / 7 - RADIO
   * ----------------------------------------------------------------------- */

  if (tipo === 6 || tipo === 7) {
    const valorActual = obtenerValorOpcion(value);

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = String(valorActual ?? "") === String(option.value);

          return (
            <Button
              key={String(option.value)}
              type="button"
              size="sm"
              disabled={lectura}
              variant={selected ? "default" : "outline"}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    );
  }

  return null;
}

/* ==========================================================================
 * COMPONENTE
 * ========================================================================== */

export function CriteriosForm({
  criteriosDisponibles,

  valores,

  dimensiones,

  valorCw,

  valorPeso,

  lectura = false,

  mostrarExpress = false,

  codTipoTransporte,

  onChange,

  onAplicarMedidas,

  onCalcular,
}: Props) {
  /*
   * catalogos: opciones por campo ({ cod_equipo: [...], cod_commodity: [...] }),
   * vienen de useCatalogosCotizacion().criterios.
   */
  const { criterios: catalogos } = useCatalogosCotizacion();

  /* ==========================================================================
   * CRITERIOS VISIBLES
   * ========================================================================== */

  const criteriosVisibles = React.useMemo(
    () =>
      criteriosDisponibles
        .filter((criterio) => !INPUTS_NO_VISIBLES.has(criterio.campo))
        .filter((criterio) => {
          /*
           * Regla literal del legado:
           *
           * criterio 13 solamente aparece
           * cuando mostrarExpress es true.
           */
          if (Number(criterio.cod_criterio) === COD_CRITERIO_EXPRESS && !mostrarExpress) {
            return false;
          }

          return true;
        })
        .filter((criterio) => [1, 4, 5, 6, 7].includes(Number(criterio.cod_tipo_dato)))
        .sort((a, b) => Number(a.cod_tipo_dato) - Number(b.cod_tipo_dato)),
    [criteriosDisponibles, mostrarExpress],
  );

  /* ==========================================================================
   * RENDER
   * ========================================================================== */

  return (
    <>
      <section className="overflow-hidden rounded-lg border">
        {/* ================================================================
            RESUMEN CW / PESO
        ================================================================= */}

        <div className="grid grid-cols-2 border-b">
          <div className="border-r p-3 text-center">
            <p className="text-xs text-muted-foreground">CW</p>

            <p className="font-mono text-lg font-semibold">{numeroMostrar(valorCw)}</p>
          </div>

          <div className="p-3 text-center">
            <p className="text-xs text-muted-foreground">PESO</p>

            <p className="font-mono text-lg font-semibold">{numeroMostrar(valorPeso)}</p>
          </div>
        </div>

        {/* ================================================================
            CAMPOS
        ================================================================= */}

        <div className="grid gap-4 p-4 md:grid-cols-2">
          {criteriosVisibles.map((criterio) => {
            const options = catalogos[criterio.campo] ?? [];

            return (
              <div key={String(criterio.cod_criterio)} className="space-y-1">
                <p className="text-sm font-medium">{criterio.descripcion}</p>

                <CriterioInput
                  criterio={criterio}
                  value={valores[criterio.campo]}
                  options={options}
                  lectura={lectura}
                  onChange={(value) =>
                    onChange(
                      criterio.campo,

                      value,
                    )
                  }
                />
              </div>
            );
          })}

          {!criteriosVisibles.length ? (
            <div className="col-span-full py-4 text-center text-sm text-muted-foreground">
              No hay criterios editables para mostrar.
            </div>
          ) : null}
        </div>

        {/* ================================================================
            ACCIONES
        ================================================================= */}

        <div className="flex flex-wrap justify-end gap-2 border-t p-3">
          {/* La calculadora es corporativa (pricing/shared); aquí solo se elige el botón. */}
          <CalculadoraMedidas
            trigger={
              <Button type="button" variant={lectura ? "outline" : "secondary"}>
                <Ruler className="size-4" />
                Abrir calculadora
              </Button>
            }
            dimensiones={dimensiones}
            pesoInicial={obtenerValorInicialCalculadora(
              valores.total_peso ?? valores.valor_por_peso ?? 0,
            )}
            volumenInicial={obtenerValorInicialCalculadora(valores.total_volumen ?? 0)}
            codTipoTransporte={codTipoTransporte}
            lectura={lectura}
            onAplicar={onAplicarMedidas}
          />

          {!lectura ? (
            <Button type="button" onClick={() => void onCalcular()}>
              <Calculator className="size-4" />
              Calcular
            </Button>
          ) : null}
        </div>
      </section>
    </>
  );
}
