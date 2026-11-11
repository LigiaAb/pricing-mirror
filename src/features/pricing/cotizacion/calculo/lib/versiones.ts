import type { CriterioDisponible, CriterioGuardado, RubroVersion } from "../api/versiones";

import type { Id } from "./tipos";

export type EstadosVersion = {
  ACTIVO: Id;
  INACTIVO: Id;
  ANULADO: Id;
  AUTORIZADO: Id;
  VENCIDO: Id;
};

export type EstadosCalculoCotizacion = EstadosVersion & {
  CONFIRMADO: Id;
  RECHAZADO: Id;
  RECHAZADO_GLOBAL?: Id;
};

const ESTADOS_CALCULO = [
  "ACTIVO",
  "INACTIVO",
  "ANULADO",
  "AUTORIZADO",
  "CONFIRMADO",
  "RECHAZADO",
  "VENCIDO",
] as const;

function normalizarTexto(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function resolverEstadosCatalogo<K extends string>(
  catalogo: unknown,
  nombres: readonly K[],
) {
  const esRegistro = (valor: unknown): valor is Record<string, unknown> =>
    typeof valor === "object" && valor !== null;
  const lista = Array.isArray(catalogo)
    ? catalogo
    : esRegistro(catalogo)
      ? Array.isArray(catalogo.items)
        ? catalogo.items
        : catalogo.data
      : undefined;
  const filas = Array.isArray(lista) ? lista.filter(esRegistro) : [];
  const estados: Partial<Record<K, Id>> = {};
  for (const nombre of nombres) {
    const fila = filas.find(
      (item) =>
        normalizarTexto(
          item.label ?? item.estado_desc ?? item.descripcion ?? item.nombre ?? item.nom_estado,
        ) === nombre,
    );
    const id = fila?.value ?? fila?.cod_estado;
    if (typeof id === "string" || typeof id === "number") estados[nombre] = id;
  }
  return estados;
}

/** Nombres de los estados requeridos por el cálculo que NO están en el catálogo. */
export function estadosCalculoFaltantes(catalogo: unknown): string[] {
  const encontrados = resolverEstadosCatalogo(catalogo, ESTADOS_CALCULO);

  return ESTADOS_CALCULO.filter((nombre) => encontrados[nombre] == null);
}

export function resolverEstadosCalculo(catalogo: unknown): EstadosCalculoCotizacion | null {
  const {
    ACTIVO,
    INACTIVO,
    ANULADO,
    AUTORIZADO,
    CONFIRMADO,
    RECHAZADO,
    RECHAZADO_GLOBAL,
    VENCIDO,
  } = resolverEstadosCatalogo(catalogo, [...ESTADOS_CALCULO, "RECHAZADO_GLOBAL"] as const);
  if (
    ACTIVO == null ||
    INACTIVO == null ||
    ANULADO == null ||
    AUTORIZADO == null ||
    CONFIRMADO == null ||
    RECHAZADO == null ||
    VENCIDO == null
  )
    return null;
  return {
    ACTIVO,
    INACTIVO,
    ANULADO,
    AUTORIZADO,
    CONFIRMADO,
    RECHAZADO,
    VENCIDO,
    ...(RECHAZADO_GLOBAL == null ? {} : { RECHAZADO_GLOBAL }),
  };
}

export type CotizacionParaVersion = {
  cod_estado?: Id | null;

  cod_tipo_pago?: Id | null;

  entidad_id?: Id | null;

  entidad_id_estacion?: Id | null;

  cod_pais_origen?: Id | null;

  cod_pais_destino?: Id | null;

  cod_puntoenlace_origen?: Id | null;

  cod_puntoenlace_destino?: Id | null;

  cod_continente_origen?: Id | null;

  cod_continente_destino?: Id | null;
};
export function normalizarBooleanVersion(value: unknown) {
  if (value === true || value === false) {
    return value;
  }

  if (value == null) {
    return false;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalizado = value.trim().toLowerCase();

    if (["true", "1", "si", "sí", "y", "yes"].includes(normalizado)) {
      return true;
    }

    if (["false", "0", "no", "n"].includes(normalizado)) {
      return false;
    }
  }

  return Boolean(value);
}
export function extraerEntidadVersion({
  rubros,
  codigosFletes,
}: {
  rubros: RubroVersion[];

  codigosFletes: Array<{
    cod_rubro?: Id | null;
  }>;
}) {
  if (!rubros.length) {
    return null;
  }

  const codigos = new Set(codigosFletes.map((item) => String(item.cod_rubro)));

  /*
   * Prioridad:
   * rubro de flete.
   */
  const rubroFlete = rubros.find(
    (rubro) => rubro.es_flete === true || codigos.has(String(rubro.cod_rubro)),
  );

  if (rubroFlete?.entidad_id != null) {
    return rubroFlete.entidad_id;
  }

  /*
   * Fallback:
   * entidad más frecuente.
   */
  const conteo = new Map<string, number>();

  for (const rubro of rubros) {
    const id = rubro.entidad_id ?? rubro.cod_entidad ?? null;

    if (id == null) {
      continue;
    }

    const key = String(id);

    conteo.set(key, (conteo.get(key) ?? 0) + 1);
  }

  const masFrecuente = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0];

  return masFrecuente ? masFrecuente[0] : null;
}
export function construirCriteriosVersion({
  criteriosDisponibles,
  criteriosGuardados,
  cotizacion,
}: {
  criteriosDisponibles: CriterioDisponible[];

  criteriosGuardados: CriterioGuardado[];

  cotizacion: CotizacionParaVersion;
}) {
  const valoresGuardados = new Map(
    criteriosGuardados.map((item) => [String(item.cod_criterio), item.valor]),
  );

  const valoresDefault = criteriosDisponibles.reduce<Record<string, unknown>>(
    (resultado, criterio) => {
      const key = String(criterio.cod_criterio);

      if (valoresGuardados.has(key)) {
        resultado[criterio.campo] = valoresGuardados.get(key);
      }

      return resultado;
    },
    {},
  );

  return {
    cod_pais_origen: cotizacion.cod_pais_origen ?? null,

    cod_pais_destino: cotizacion.cod_pais_destino ?? null,

    cod_puntoenlace_destino: cotizacion.cod_puntoenlace_destino ?? null,

    cod_puntoenlace_origen: cotizacion.cod_puntoenlace_origen ?? null,

    cod_continente_origen: cotizacion.cod_continente_origen ?? null,

    cod_continente_destino: cotizacion.cod_continente_destino ?? null,

    entidad_id: cotizacion.entidad_id ?? null,

    ...valoresDefault,

    express: normalizarBooleanVersion(valoresDefault.express),
  };
}
