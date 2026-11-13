import { TIPOS_TRANSPORTE, type TipoTransporte } from "./constantes";

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

const UNIDAD_BASE_VOLUMEN = "CENTIMETROS";

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
 * Estas son las reglas que realmente terminan
 * afectando peso/volumétrico en el componente viejo.
 */
const CONVERSIONES_PESO_KG = [
  {
    from: "TONELADAS",
    factor: 1000,
  },
  {
    from: "LIBRAS",
    factor: 0.453592909,
  },
] as const;

/* ==========================================================================
 * HELPERS INTERNOS
 * ========================================================================== */

/**
 * El componente legado usa:
 *
 * Number(valor).toFixed(0)
 *
 * antes de determinar el peso facturable.
 */
function redondearTotal(value: number): number {
  return Number(Number(value).toFixed(0));
}

function obtenerTipoTransporte(codTipoTransporte?: Id | null): TipoTransporte {
  return TIPOS_TRANSPORTE[Number(codTipoTransporte) as keyof typeof TIPOS_TRANSPORTE] ?? "AEREO";
}

/* ==========================================================================
 * LONGITUD
 * ========================================================================== */

/**
 * Replica convertirLongitud del componente legado.
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

function volumenACentimetrosCubicos(volumenUnitario: number, unidad?: string | null): number {
  if (!unidad) {
    return 0;
  }

  if (unidad === UNIDAD_BASE_VOLUMEN) {
    return volumenUnitario;
  }

  const ladoEnCm = convertirLongitud(1, unidad, UNIDAD_BASE_VOLUMEN);

  if (!ladoEnCm) {
    return 0;
  }

  return volumenUnitario * ladoEnCm ** 3;
}

/* ==========================================================================
 * PESO
 * ========================================================================== */

/**
 * Convierte peso a kilogramos.
 *
 * El componente antiguo busca estas reglas dentro
 * de las conversiones marcadas como AEREO,
 * independientemente del transporte seleccionado.
 */
export function convertirPesoAKg(valor: unknown, unidad?: string | null): number {
  const peso = numero(valor);

  if (!peso || !unidad) {
    return 0;
  }

  if (unidad === "KILOGRAMOS") {
    return peso;
  }

  const regla = CONVERSIONES_PESO_KG.find((item) => item.from === unidad);

  if (!regla) {
    return 0;
  }

  return peso * regla.factor;
}

/* ==========================================================================
 * PESO VOLUMÉTRICO
 * ========================================================================== */

/**
 * Convierte el volumen UNITARIO según transporte.
 *
 * AEREO
 * ------
 * cm³ / 6000
 *
 * MARITIMO
 * ---------
 * (cm³ / 1,000,000) * 1000
 * 1 CBM = 1000 kilos volumétricos.
 *
 * TERRESTRE
 * ----------
 * convierte el volumen a m³ y multiplica por 333.
 *
 * IMPORTANTE:
 * El valor actual es 333, aunque anteriormente
 * se haya hablado de 350.
 */
export function convertirVolumetrico(
  volumenUnitario: unknown,
  unidad?: string | null,
  codTipoTransporte?: Id | null,
): number {
  const volumen = numero(volumenUnitario);

  if (!volumen || !unidad) {
    return 0;
  }

  const transporte = obtenerTipoTransporte(codTipoTransporte);

  /* --------------------------------------------------------------------------
   * MARÍTIMO
   * ----------------------------------------------------------------------- */

  if (transporte === "MARITIMO") {
    const volumenCm3 = volumenACentimetrosCubicos(volumen, unidad);

    const volumenCbm = volumenCm3 / 1_000_000;

    return volumenCbm * 1000;
  }

  /* --------------------------------------------------------------------------
   * AÉREO
   * ----------------------------------------------------------------------- */

  if (transporte === "AEREO") {
    const volumenCm3 = volumenACentimetrosCubicos(volumen, unidad);

    return volumenCm3 / 6000;
  }

  /* --------------------------------------------------------------------------
   * TERRESTRE
   *
   * La regla actual es:
   *
   * METROS³ * 333
   * ----------------------------------------------------------------------- */

  const ladoEnMetros = convertirLongitud(1, unidad, "METROS");

  if (!ladoEnMetros) {
    return 0;
  }

  const volumenM3 = volumen * ladoEnMetros ** 3;

  return volumenM3 * 333;
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

  codTipoTransporte,
}: {
  id: Id;

  cantidad: number;

  largo: number;

  ancho: number;

  alto: number;

  pesoUnitario: number;

  unidadMedida: Unidad | null;

  unidadPeso: Unidad | null;

  codTipoTransporte?: Id | null;
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

    codTipoTransporte,
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

export function calcularTotalesMedidas(
  dimensiones: DimensionCalculo[],
  codTipoTransporte?: Id | null,
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

  const volumenSinRedondear = dimensiones.reduce((total, dimension) => {
    if (dimension.volumenTotalKg != null) {
      return total + numero(dimension.volumenTotalKg);
    }

    const volumenUnitario =
      dimension.volumenUnitario ??
      calcularVolumen(
        dimension.largo,

        dimension.ancho,

        dimension.alto,
      );

    const volumetricoUnitario = convertirVolumetrico(
      volumenUnitario,

      dimension.unidadMedida?.tipo_desc,

      codTipoTransporte,
    );

    return total + volumetricoUnitario * numero(dimension.cantidad);
  }, 0);

  const cantidadTotal = dimensiones.reduce(
    (total, dimension) => total + numero(dimension.cantidad),
    0,
  );

  /*
   * El código legado ejecuta redondear()
   * antes de calcular facturableKg.
   *
   * redondear() usa toFixed(0).
   */
  const pesoTotal = redondearTotal(pesoSinRedondear);

  const volumenTotal = redondearTotal(volumenSinRedondear);

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
