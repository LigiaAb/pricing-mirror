"use client";

/* ==========================================================================
 * CATÁLOGOS DE COTIZACIONES (fuente única)
 *
 * Todos los catálogos del módulo se cargan y normalizan AQUÍ, una sola vez,
 * y cualquier componente los lee con:
 *
 *   const { calculo, formulario } = useCatalogosCotizacion();
 *
 * Ya no hace falta pasarlos por props de componente en componente.
 *
 * ¿Cómo agrego un catálogo nuevo?
 *   1. Si el tipo es nuevo, decláralo en `lib/tipos.ts`.
 *   2. Agrégalo en `construirCatalogosCalculo` o `construirCatalogosFormulario`
 *      (abajo). El tipo `CatalogosCotizacion` se actualiza solo.
 *   3. Úsalo donde lo necesites con `useCatalogosCotizacion()`.
 *
 * El provider se monta en `GestionCotizacion`; cualquier componente dentro
 * de esa pantalla puede usar el hook.
 * ========================================================================== */

import React from "react";

import { useCatalogosTarifas } from "@/features/pricing/tarifas";

import { filtrarPorTipoTabla, normalizarOpciones } from "../lib/catalogos";
import type {
  CatalogoTipo,
  CriterioCatalogo,
  EntidadCatalogo,
  MetodoCatalogo,
  MonedaCatalogo,
  OpcionCriterio,
  PuntoEnlaceCatalogo,
  ReasonCodeSpot,
  RubroCatalogo,
  ServicioCatalogo,
  Unidad,
} from "../lib/tipos";
import type { CatalogosFormularioCotizacion } from "./use-formulario-cotizacion";

type CatalogosTarifas = ReturnType<typeof useCatalogosTarifas>["catalogos"];

/* ==========================================================================
 * CATÁLOGOS DEL CÁLCULO (versiones, carrier, due agent/carrier, scalling...)
 * ========================================================================== */

export type CatalogosCalculo = {
  rubros: RubroCatalogo[];
  servicios: ServicioCatalogo[];
  monedas: MonedaCatalogo[];
  metodos: MetodoCatalogo[];
  proveedores: EntidadCatalogo[];

  /** Tipos de carga + clasificaciones de carga (los usa Carrier/Flete). */
  tipos: CatalogoTipo[];
  categoriasTransporte: CatalogoTipo[];

  puntosEnlace: PuntoEnlaceCatalogo[];

  unidadesMedida: Unidad[];
  unidadesPeso: Unidad[];

  /** Catálogo general de criterios (cod_criterio + campo) usado al guardar. */
  criterios: CriterioCatalogo[];
  reasonCodesSpot: ReasonCodeSpot[];
};

function normalizarUnidades(unidades: CatalogosTarifas["unidadesMedida"] | undefined): Unidad[] {
  return (unidades ?? []).flatMap((unidad) => {
    if (unidad.value == null) return [];

    return [
      {
        ...unidad,
        value: unidad.value,
        label: unidad.label == null ? null : String(unidad.label),
        tipo_desc: unidad.tipo_desc ?? null,
        tipo_padre_desc: unidad.tipo_padre_desc ?? null,
      },
    ];
  });
}

function construirCatalogosCalculo(tarifas: CatalogosTarifas): CatalogosCalculo {
  return {
    rubros: tarifas.rubros,
    servicios: tarifas.servicios,
    metodos: tarifas.metodos.map((metodo) => ({
      ...metodo,
      cod_servicio: metodo.cod_servicio ?? null,
      fecha_final: metodo.fecha_final ?? null,
    })),

    /*
     * Carrier/Flete solo usa estos registros para resolver
     * servicio.cod_tipo_carga y servicio.cod_clasificacion_carga.
     */
    tipos: [...(tarifas.tiposCarga ?? []), ...(tarifas.clasificacionesCarga ?? [])],
    categoriasTransporte: tarifas.categoriasTransporte,
    proveedores: tarifas.proveedores,

    monedas: (tarifas.monedas ?? []).flatMap((moneda) =>
      moneda.cod_moneda == null ? [] : [{ ...moneda, cod_moneda: moneda.cod_moneda }],
    ),

    puntosEnlace: (tarifas.puntosEnlace ?? []).flatMap((punto) => {
      const value = punto.value ?? punto.cod_puntoenlace;

      if (value == null) return [];

      return [{ ...punto, value, label: String(punto.label ?? punto.nombre ?? "") }];
    }),

    unidadesMedida: normalizarUnidades(tarifas.unidadesMedida),
    unidadesPeso: normalizarUnidades(tarifas.unidadesPeso),

    // TODO: conectar el catálogo real de criterios (hoy llega vacío, igual que antes).
    criterios: [],

    reasonCodesSpot: normalizarOpciones(filtrarPorTipoTabla(tarifas.tipos, ["REASON_CODE_SPOT"])),
  };
}

/* ==========================================================================
 * CATÁLOGOS DEL FORMULARIO / TABLA DE CABECERAS ({ value, label })
 * ========================================================================== */

function construirCatalogosFormulario(tarifas: CatalogosTarifas): CatalogosFormularioCotizacion {
  return {
    empresas: normalizarOpciones(tarifas.empresas),
    centrosCosto: normalizarOpciones(tarifas.centrosCosto),

    tiposTransporte: normalizarOpciones(tarifas.tiposTransporte),
    tiposServicio: normalizarOpciones(tarifas.tiposServicio),

    tiposCarga: normalizarOpciones(tarifas.tiposCarga),
    clasificacionesCarga: normalizarOpciones(tarifas.clasificacionesCarga),

    incoterms: normalizarOpciones(tarifas.incoterms),
    tiposPago: normalizarOpciones(tarifas.tiposPago),

    ciudades: normalizarOpciones(tarifas.ciudades),

    paises: normalizarOpciones(tarifas.paises),
    tiposPuntoEnlace: normalizarOpciones(
      filtrarPorTipoTabla(tarifas.tipos, ["PUNTO_ENLACE", "TIPO_PUNTOENLACE"]),
    ),
    puntosEnlace: normalizarOpciones(tarifas.puntosEnlace),

    proveedores: normalizarOpciones(tarifas.proveedores),
    clientes: normalizarOpciones(tarifas.clientes),
  };
}

/* ==========================================================================
 * DERIVADOS (valores calculados a partir de los catálogos)
 * ========================================================================== */

function obtenerCodigosFletes(rubros: RubroCatalogo[]) {
  return rubros.filter(
    (rubro) => rubro.es_flete === true || rubro?.nombre_rubro?.toUpperCase()?.includes("FLETE"),
  );
}

function obtenerCodRubroIVA(rubros: RubroCatalogo[]) {
  const rubroIVA = rubros.find((rubro) => {
    const nombre = String(rubro.nombre ?? rubro.nombre_rubro ?? rubro.label ?? "")
      .trim()
      .toUpperCase();

    return nombre === "IVA";
  });

  return rubroIVA?.cod_rubro ?? null;
}

/* ==========================================================================
 * HOOK + PROVIDER
 * ========================================================================== */

function useConstruirCatalogosCotizacion() {
  const { catalogos: tarifas, isLoading } = useCatalogosTarifas({});

  // Cada parte se memoiza por separado para que solo cambie cuando cambia su fuente.
  const calculo = React.useMemo(() => construirCatalogosCalculo(tarifas), [tarifas]);
  const formulario = React.useMemo(() => construirCatalogosFormulario(tarifas), [tarifas]);
  const codigosFletes = React.useMemo(() => obtenerCodigosFletes(tarifas.rubros), [tarifas.rubros]);
  const codRubroIVA = React.useMemo(() => obtenerCodRubroIVA(tarifas.rubros), [tarifas.rubros]);

  return React.useMemo(
    () => ({
      isLoading,

      /** Catálogos tal como los entrega Tarifas (sin normalizar). */
      tarifas,

      /** Catálogos para el cálculo de la versión. */
      calculo,

      /** Opciones { value, label } para el formulario y la tabla de cabeceras. */
      formulario,

      /**
       * Opciones de los criterios dinámicos, por campo (cod_equipo, cod_commodity...).
       * TODO: conectar sus fuentes reales (hoy llega vacío, igual que antes).
       */
      criterios: CRITERIOS_VACIOS,

      /** Rubros que se consideran flete. */
      codigosFletes,

      /** cod_rubro del IVA (buscado por nombre). */
      codRubroIVA,
    }),
    [isLoading, tarifas, calculo, formulario, codigosFletes, codRubroIVA],
  );
}

const CRITERIOS_VACIOS: Record<string, OpcionCriterio[]> = {};

export type CatalogosCotizacion = ReturnType<typeof useConstruirCatalogosCotizacion>;

const CatalogosCotizacionContext = React.createContext<CatalogosCotizacion | null>(null);

export function CatalogosCotizacionProvider({ children }: { children: React.ReactNode }) {
  const catalogos = useConstruirCatalogosCotizacion();

  return (
    <CatalogosCotizacionContext.Provider value={catalogos}>
      {children}
    </CatalogosCotizacionContext.Provider>
  );
}

/** Catálogos de cotizaciones. Debe usarse dentro de `CatalogosCotizacionProvider`. */
export function useCatalogosCotizacion(): CatalogosCotizacion {
  const catalogos = React.useContext(CatalogosCotizacionContext);

  if (!catalogos) {
    throw new Error("useCatalogosCotizacion debe usarse dentro de <CatalogosCotizacionProvider>.");
  }

  return catalogos;
}

/**
 * Igual que `useCatalogosCotizacion`, pero devuelve `null` fuera del provider.
 * Lo usan componentes compartidos con otras pantallas (por ejemplo CotizacionForm).
 */
export function useCatalogosCotizacionOpcional(): CatalogosCotizacion | null {
  return React.useContext(CatalogosCotizacionContext);
}
