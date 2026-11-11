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

import { type CatalogosPricing, useCatalogosPricing } from "@/features/pricing/shared";

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

function normalizarUnidades(unidades: CatalogosPricing["unidadesMedida"] | undefined): Unidad[] {
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

function construirCatalogosCalculo(base: CatalogosPricing): CatalogosCalculo {
  return {
    rubros: base.rubros,
    servicios: base.servicios,
    metodos: base.metodos.map((metodo) => ({
      ...metodo,
      cod_servicio: metodo.cod_servicio ?? null,
      fecha_final: metodo.fecha_final ?? null,
    })),

    /*
     * Carrier/Flete solo usa estos registros para resolver
     * servicio.cod_tipo_carga y servicio.cod_clasificacion_carga.
     */
    tipos: [...(base.tiposCarga ?? []), ...(base.clasificacionesCarga ?? [])],
    categoriasTransporte: base.categoriasTransporte,
    proveedores: base.proveedores,

    monedas: (base.monedas ?? []).flatMap((moneda) =>
      moneda.cod_moneda == null ? [] : [{ ...moneda, cod_moneda: moneda.cod_moneda }],
    ),

    puntosEnlace: (base.puntosEnlace ?? []).flatMap((punto) => {
      const value = punto.value ?? punto.cod_puntoenlace;

      if (value == null) return [];

      return [{ ...punto, value, label: String(punto.label ?? punto.nombre ?? "") }];
    }),

    unidadesMedida: normalizarUnidades(base.unidadesMedida),
    unidadesPeso: normalizarUnidades(base.unidadesPeso),

    // TODO: conectar el catálogo real de criterios (hoy llega vacío, igual que antes).
    criterios: [],

    reasonCodesSpot: normalizarOpciones(filtrarPorTipoTabla(base.tipos, ["REASON_CODE_SPOT"])),
  };
}

/* ==========================================================================
 * CATÁLOGOS DEL FORMULARIO / TABLA DE CABECERAS ({ value, label })
 * ========================================================================== */

function construirCatalogosFormulario(base: CatalogosPricing): CatalogosFormularioCotizacion {
  return {
    empresas: normalizarOpciones(base.empresas),
    centrosCosto: normalizarOpciones(base.centrosCosto),

    tiposTransporte: normalizarOpciones(base.tiposTransporte),
    tiposServicio: normalizarOpciones(base.tiposServicio),

    tiposCarga: normalizarOpciones(base.tiposCarga),
    clasificacionesCarga: normalizarOpciones(base.clasificacionesCarga),

    incoterms: normalizarOpciones(base.incoterms),
    tiposPago: normalizarOpciones(base.tiposPago),

    ciudades: normalizarOpciones(base.ciudades),

    paises: normalizarOpciones(base.paises),
    tiposPuntoEnlace: normalizarOpciones(
      filtrarPorTipoTabla(base.tipos, ["PUNTO_ENLACE", "TIPO_PUNTOENLACE"]),
    ),
    puntosEnlace: normalizarOpciones(base.puntosEnlace),

    proveedores: normalizarOpciones(base.proveedores),
    clientes: normalizarOpciones(base.clientes),
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
  const { catalogos: base, isLoading } = useCatalogosPricing();

  // Cada parte se memoiza por separado para que solo cambie cuando cambia su fuente.
  const calculo = React.useMemo(() => construirCatalogosCalculo(base), [base]);
  const formulario = React.useMemo(() => construirCatalogosFormulario(base), [base]);
  const codigosFletes = React.useMemo(() => obtenerCodigosFletes(base.rubros), [base.rubros]);
  const codRubroIVA = React.useMemo(() => obtenerCodRubroIVA(base.rubros), [base.rubros]);

  return React.useMemo(
    () => ({
      isLoading,

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
    [isLoading, calculo, formulario, codigosFletes, codRubroIVA],
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
