import { esNombre, normalizarNombre } from "../../lib/nombres";
import { NOMBRE_TRANSPORTE, NOMBRE_UNIDAD, type TipoTransporte } from "./constantes";

/* ==========================================================================
 * CÁLCULOS DE EMBARQUE (corporativos)
 *
 * Reglas de volumen, peso, peso volumétrico y CW (chargeable weight) por tipo
 * de transporte. Funciones puras: no conocen cotizaciones, tarifas ni la BD.
 * Cada módulo traduce sus datos guardados a `DimensionCalculo` (ver, por
 * ejemplo, cotizacion/calculo/lib/dimensiones-cotizacion.ts).
 * ========================================================================== */

export type Id = string | number;

/** Convierte a número; lo que no es número válido cuenta como 0. */
export function numero(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

/* ==========================================================================
 * TIPOS
 * ========================================================================== */

/** Unidad de medida o de peso (relación de tipos COORDINACION_CARGA / TIPO_MEDIDA). */
export type Unidad = {
  value: Id;

  label?: string | null;
  tipo_desc?: string | null;
  tipo_padre_desc?: string | null;

  [key: string]: unknown;
};

export type DimensionCalculo = {
  id: Id;

  cantidad: number;

  largo: number;

  ancho: number;

  alto: number;

  pesoUnitario: number;

  unidadMedida: Unidad | null;

  unidadPeso: Unidad | null;

  formulaVolumen: string;

  volumenUnitario: number;

  volumenTotal: number;

  volumenTotalKg: number;

  pesoTotal: number;

  pesoTotalKg: number;

  /*
   * Totales de la fila (alias de pesoTotalKg / volumenTotalKg / CW).
   * El módulo que guarda puede sobrescribirlos con los totales globales.
   */
  total_peso?: number;

  total_volumen?: number;

  total_cw?: number;

  /** Cada módulo puede conservar aquí sus campos propios (ej. columnas de BD). */
  [key: string]: unknown;
};

export type TotalesMedidas = {
  pesoTotal: number;

  volumenTotal: number;

  cantidadTotal: number;

  valorCw: number;

  tipo: "KILOGRAMOS" | "KILOS VOLUMETRICOS" | "AUN NO SE HA CALCULADO";
};

/* ==========================================================================
 * CONSTANTES
 * ========================================================================== */

const CONVERSIONES_LONGITUD = [
  {
    from: "METROS",
    to: "PIES",
    factor: 3.2808,
  },
  {
    from: "METROS",
    to: "CENTIMETROS",
    factor: 100,
  },
  {
    from: "METROS",
    to: "PULGADAS",
    factor: 39.3701,
  },
  {
    from: "PULGADAS",
    to: "METROS",
    factor: 0.0254,
  },
  {
    from: "PIES",
    to: "CENTIMETROS",
    factor: 30.48,
  },
  {
    from: "PIES",
    to: "PULGADAS",
    factor: 12,
  },
  {
    from: "PULGADAS",
    to: "CENTIMETROS",
    factor: 2.54,
  },
] as const;

/*
 * Tabla oficial "Factores de conversión" de la empresa (#157). Se usan tal cual;
 * cada volumen se lleva primero a una medida que la tabla maneja para su
 * transporte y luego se calcula (ver convertirVolumetrico).
 */
const FACTORES = {
  /** 1 pie = 12 pulgadas. */
  PIE_PULGADAS: 12,
  /** 1 tonelada = 1000 kilogramos. */
  TONELADA_KG: 1000,
  /** 1 kilo = 2.2046 libras. */
  KILO_LIBRAS: 2.2046,
  /** Aéreo: centímetros cúbicos ÷ 6000 = kilos volumétricos. */
  AEREO_CM3: 6000,
  /** Aéreo: metros cúbicos ÷ 0.006 = kilos volumétricos. */
  AEREO_M3: 0.006,
  /** Aéreo: pulgadas cúbicas ÷ 366 = kilos volumétricos. */
  AEREO_IN3: 366,
  /** Pulgadas cúbicas ÷ 1728 = pies cúbicos (y pie cúbico × 1728 = pulgadas cúbicas). */
  IN3_FT3: 1728,
  /** Pies cúbicos ÷ 35.3145 = metro cúbico. */
  FT3_M3: 35.3145,
  /** Centímetros cúbicos ÷ 1 000 000 = metro cúbico (1 m = 100 cm). */
  CM3_M3: 1_000_000,
  /** Marítimo: 1 metro cúbico (CBM) = 1000 kilos volumétricos. */
  MARITIMO_M3: 1000,
  /** Terrestre: metro cúbico × 350 = kilos volumétricos. */
  TERRESTRE_M3: 350,
} as const;

/* ==========================================================================
 * HELPERS INTERNOS
 * ========================================================================== */

/**
 * Redondeo hacia arriba a entero (regla de la empresa, #157).
 * Antes se quitan los decimales de punto flotante (333.00000000000006 → 333).
 */
export function redondearArriba(value: unknown): number {
  return Math.ceil(Number(numero(value).toFixed(6)));
}

/** Tipo de transporte por su nombre (nomTipo); `null` si el nombre no es uno conocido. */
export function reconocerTransporte(transporte?: string | null): TipoTransporte | null {
  return Object.values(NOMBRE_TRANSPORTE).find((nombre) => esNombre(transporte, nombre)) ?? null;
}

/** Transporte para calcular: si el nombre no se reconoce, se calcula como AEREO. */
function obtenerTipoTransporte(transporte?: string | null): TipoTransporte {
  return reconocerTransporte(transporte) ?? NOMBRE_TRANSPORTE.AEREO;
}

/** `true` si la unidad (tipo_desc) tiene conversión en la calculadora. */
export function esUnidadConocida(unidad?: string | null): boolean {
  return Object.values(NOMBRE_UNIDAD).some((nombre) => esNombre(unidad, nombre));
}

/* ==========================================================================
 * LONGITUD
 * ========================================================================== */

/**
 * Replica convertirLongitud del componente legado.
 * El volumétrico ya no la usa: sigue los caminos de la tabla (convertirVolumetrico).
 */
export function convertirLongitud(
  valor: number,
  desde?: string | null,
  hacia?: string | null,
): number {
  if (!desde || !hacia) {
    return 0;
  }

  if (desde === hacia) {
    return valor;
  }

  const reglaDirecta = CONVERSIONES_LONGITUD.find(
    (regla) => regla.from === desde && regla.to === hacia,
  );

  if (reglaDirecta) {
    return valor * reglaDirecta.factor;
  }

  /*
   * El legado también permite usar
   * la regla en sentido inverso.
   */
  const reglaInversa = CONVERSIONES_LONGITUD.find(
    (regla) => regla.from === hacia && regla.to === desde,
  );

  if (reglaInversa) {
    return valor / reglaInversa.factor;
  }

  return 0;
}

/* ==========================================================================
 * VOLUMEN
 * ========================================================================== */

export function calcularVolumen(largo: unknown, ancho: unknown, alto: unknown): number {
  return numero(largo) * numero(ancho) * numero(alto);
}

/**
 * Volumen en metros cúbicos (Marítimo y Terrestre), con los factores de la tabla:
 * pulgadas³ ÷ 1728 = pies³; pies³ ÷ 35.3145 = m³; cm³ ÷ 1 000 000 = m³.
 * `0` si la unidad no se reconoce.
 */
function volumenAMetrosCubicos(volumen: number, unidad?: string | null): number {
  const nombre = normalizarNombre(unidad);

  if (nombre === NOMBRE_UNIDAD.METROS) return volumen;
  if (nombre === NOMBRE_UNIDAD.PIES) return volumen / FACTORES.FT3_M3;
  if (nombre === NOMBRE_UNIDAD.PULGADAS) return volumen / FACTORES.IN3_FT3 / FACTORES.FT3_M3;
  if (nombre === NOMBRE_UNIDAD.CENTIMETROS) return volumen / FACTORES.CM3_M3;

  return 0;
}

/**
 * Aéreo, con los factores de la tabla: cm³ ÷ 6000, m³ ÷ 0.006, pulgadas³ ÷ 366.
 * Pies: pies³ × 1728 = pulgadas³ y luego ÷ 366. `0` si la unidad no se reconoce.
 */
function volumetricoAereo(volumen: number, unidad?: string | null): number {
  const nombre = normalizarNombre(unidad);

  if (nombre === NOMBRE_UNIDAD.CENTIMETROS) return volumen / FACTORES.AEREO_CM3;
  if (nombre === NOMBRE_UNIDAD.METROS) return volumen / FACTORES.AEREO_M3;
  if (nombre === NOMBRE_UNIDAD.PULGADAS) return volumen / FACTORES.AEREO_IN3;
  if (nombre === NOMBRE_UNIDAD.PIES) return (volumen * FACTORES.IN3_FT3) / FACTORES.AEREO_IN3;

  return 0;
}

/* ==========================================================================
 * PESO
 * ========================================================================== */

/**
 * Convierte peso a kilogramos (tabla de la empresa): toneladas × 1000, libras ÷ 2.2046.
 * Igual para todos los transportes. `0` si la unidad no se reconoce.
 */
export function convertirPesoAKg(valor: unknown, unidad?: string | null): number {
  const peso = numero(valor);
  const nombre = normalizarNombre(unidad);

  if (!peso || !nombre) {
    return 0;
  }

  if (nombre === NOMBRE_UNIDAD.KILOGRAMOS) return peso;
  if (nombre === NOMBRE_UNIDAD.TONELADAS) return peso * FACTORES.TONELADA_KG;
  if (nombre === NOMBRE_UNIDAD.LIBRAS) return peso / FACTORES.KILO_LIBRAS;

  return 0;
}

/* ==========================================================================
 * PESO VOLUMÉTRICO
 * ========================================================================== */

/**
 * Convierte el volumen UNITARIO a kilos volumétricos según el transporte (por su
 * nombre), con la tabla de la empresa. Primero se lleva a una medida que la tabla
 * maneja para ese transporte y luego se calcula:
 *
 * AEREO      cm³ ÷ 6000 · m³ ÷ 0.006 · pulgadas³ ÷ 366 · pies³ × 1728 ÷ 366
 * MARITIMO   m³ × 1000 (1 CBM = 1000 kilos volumétricos)
 * TERRESTRE  m³ × 350
 *
 * Si el transporte no se reconoce se calcula como AEREO (la calculadora avisa).
 */
export function convertirVolumetrico(
  volumenUnitario: unknown,
  unidad?: string | null,
  transporte?: string | null,
): number {
  const volumen = numero(volumenUnitario);

  if (!volumen || !unidad) {
    return 0;
  }

  const tipo = obtenerTipoTransporte(transporte);

  if (tipo === NOMBRE_TRANSPORTE.MARITIMO) {
    return volumenAMetrosCubicos(volumen, unidad) * FACTORES.MARITIMO_M3;
  }

  if (tipo === NOMBRE_TRANSPORTE.TERRESTRE) {
    return volumenAMetrosCubicos(volumen, unidad) * FACTORES.TERRESTRE_M3;
  }

  return volumetricoAereo(volumen, unidad);
}

/* ==========================================================================
 * CREAR UNA FILA
 * ========================================================================== */

export function crearDimension({
  id,

  cantidad,

  largo,

  ancho,

  alto,

  pesoUnitario,

  unidadMedida,

  unidadPeso,

  transporte,
}: {
  id: Id;

  cantidad: number;

  largo: number;

  ancho: number;

  alto: number;

  pesoUnitario: number;

  unidadMedida: Unidad | null;

  unidadPeso: Unidad | null;

  /** Nombre del tipo de transporte (nomTipo). */
  transporte?: string | null;
}): DimensionCalculo {
  const cantidadProcesada = numero(cantidad || 1);

  const largoProcesado = numero(largo);

  const anchoProcesado = numero(ancho);

  const altoProcesado = numero(alto);

  const pesoUnitarioProcesado = numero(pesoUnitario);

  const volumenUnitario = calcularVolumen(largoProcesado, anchoProcesado, altoProcesado);

  const volumenTotal = volumenUnitario * cantidadProcesada;

  const volumenUnitarioKg = convertirVolumetrico(
    volumenUnitario,

    unidadMedida?.tipo_desc,

    transporte,
  );

  const volumenTotalKg = volumenUnitarioKg * cantidadProcesada;

  const pesoTotal = pesoUnitarioProcesado * cantidadProcesada;

  const pesoUnitarioKg = convertirPesoAKg(
    pesoUnitarioProcesado,

    unidadPeso?.tipo_desc,
  );

  const pesoTotalKg = pesoUnitarioKg * cantidadProcesada;

  return {
    id,

    cantidad: cantidadProcesada,

    largo: largoProcesado,

    ancho: anchoProcesado,

    alto: altoProcesado,

    pesoUnitario: pesoUnitarioProcesado,

    unidadMedida: volumenUnitario > 0 ? unidadMedida : null,

    unidadPeso: pesoUnitarioProcesado > 0 ? unidadPeso : null,

    formulaVolumen: `${largoProcesado}x${anchoProcesado}x${altoProcesado}`,

    volumenUnitario,

    volumenTotal,

    volumenTotalKg,

    pesoTotal,

    pesoTotalKg,

    total_peso: pesoTotalKg,

    total_volumen: volumenTotalKg,

    total_cw: Math.max(pesoTotalKg, volumenTotalKg),
  };
}

/* ==========================================================================
 * TOTALES
 * ========================================================================== */

/**
 * La misma fila con el volumétrico del transporte indicado (nombre). La fila guarda
 * el del transporte con el que se creó; si el transporte cambia, se recalcula.
 */
export function recalcularDimension(
  dimension: DimensionCalculo,
  transporte?: string | null,
): DimensionCalculo {
  const volumenUnitario =
    dimension.volumenUnitario ?? calcularVolumen(dimension.largo, dimension.ancho, dimension.alto);

  const volumenTotalKg =
    convertirVolumetrico(volumenUnitario, dimension.unidadMedida?.tipo_desc, transporte) *
    numero(dimension.cantidad);

  return {
    ...dimension,
    volumenTotalKg,
    total_volumen: volumenTotalKg,
    total_cw: Math.max(numero(dimension.pesoTotalKg), volumenTotalKg),
  };
}

export function calcularTotalesMedidas(
  dimensiones: DimensionCalculo[],
  transporte?: string | null,
): TotalesMedidas {
  const pesoSinRedondear = dimensiones.reduce((total, dimension) => {
    /*
     * Si la fila ya trae la conversión calculada,
     * se utiliza directamente.
     */
    if (dimension.pesoTotalKg != null) {
      return total + numero(dimension.pesoTotalKg);
    }

    const pesoUnitarioKg = convertirPesoAKg(
      dimension.pesoUnitario,

      dimension.unidadPeso?.tipo_desc,
    );

    return total + pesoUnitarioKg * numero(dimension.cantidad);
  }, 0);

  /* El volumétrico siempre se recalcula con el transporte actual (no el de la fila). */
  const volumenSinRedondear = dimensiones.reduce(
    (total, dimension) => total + recalcularDimension(dimension, transporte).volumenTotalKg,
    0,
  );

  const cantidadTotal = dimensiones.reduce(
    (total, dimension) => total + numero(dimension.cantidad),
    0,
  );

  /* Se redondea hacia arriba antes de determinar el CW (#157). */
  const pesoTotal = redondearArriba(pesoSinRedondear);

  const volumenTotal = redondearArriba(volumenSinRedondear);

  if (pesoTotal === 0 && volumenTotal === 0) {
    return {
      pesoTotal: 0,

      volumenTotal: 0,

      cantidadTotal,

      valorCw: 0,

      tipo: "AUN NO SE HA CALCULADO",
    };
  }

  if (pesoTotal >= volumenTotal) {
    return {
      pesoTotal,

      volumenTotal,

      cantidadTotal,

      valorCw: pesoTotal,

      tipo: "KILOGRAMOS",
    };
  }

  return {
    pesoTotal,

    volumenTotal,

    cantidadTotal,

    valorCw: volumenTotal,

    tipo: "KILOS VOLUMETRICOS",
  };
}

/* ==========================================================================
 * TOTALES CON ENTRADA DIRECTA
 * ========================================================================== */

/**
 * Totales finales de la calculadora: los de las filas tienen prioridad; si un
 * total de filas es 0 se usa el escrito directamente (peso o volumétrico).
 * El CW es el mayor de ambos.
 */
export function combinarTotales(
  totalesFilas: TotalesMedidas,
  pesoDirecto: unknown,
  volumenDirecto: unknown,
): TotalesMedidas {
  const pesoTotal = totalesFilas.pesoTotal > 0 ? totalesFilas.pesoTotal : numero(pesoDirecto);

  const volumenTotal =
    totalesFilas.volumenTotal > 0 ? totalesFilas.volumenTotal : numero(volumenDirecto);

  const valorCw = Math.max(pesoTotal, volumenTotal);

  return {
    pesoTotal,
    volumenTotal,
    cantidadTotal: totalesFilas.cantidadTotal,
    valorCw,
    tipo:
      valorCw <= 0
        ? "AUN NO SE HA CALCULADO"
        : pesoTotal >= volumenTotal
          ? "KILOGRAMOS"
          : "KILOS VOLUMETRICOS",
  };
}
