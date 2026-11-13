import { addDays } from "date-fns";

import { obtenerOrdenGrupoDefault } from "./agrupacion-rubros";
import { UNIDAD_DEFAULT } from "./constantes";

import type { Id } from "./tipos";

export type RubroGuardar = {
  idDeGrupo?: Id | null;

  gruporubro_nombre?: string | null;

  es_flete?: boolean | null;

  es_tarifa_spot?: boolean | null;

  venta_rubro?: string | number | null;

  original_venta?: string | number | null;

  rate_venta?: string | number | null;

  rate_costo?: string | number | null;

  original_rate_venta?: string | number | null;

  original_rate_costo?: string | number | null;

  [key: string]: unknown;
};

export type DimensionIngresada = {
  esTotalDirecto?: boolean;

  cotdetdim_cantidad?: unknown;
  cantidad?: unknown;

  cotdetdim_largo?: unknown;
  largo?: unknown;

  cotdetdim_ancho?: unknown;
  ancho?: unknown;

  cotdetdim_alto?: unknown;
  alto?: unknown;

  cotdetdim_peso_unitario?: unknown;
  pesoUnitario?: unknown;

  cotdetdim_unidad_medida?: unknown;

  unidadMedida?: {
    value?: unknown;
  } | null;

  cotdetdim_unidad_peso?: unknown;

  unidadPeso?: {
    value?: unknown;
  } | null;

  total_volumen?: unknown;
  volumenTotalKg?: unknown;
  volumenTotal?: unknown;

  total_peso?: unknown;
  pesoTotalKg?: unknown;
  pesoTotal?: unknown;

  total_cw?: unknown;

  [key: string]: unknown;
};
export function obtenerRubroSpot(rubros: RubroGuardar[]) {
  return rubros.find((rubro) => rubro.es_tarifa_spot === true) ?? null;
}

export function esSpotMayorAlOriginal(rubro: RubroGuardar | null) {
  if (!rubro) {
    return true;
  }

  /*
   * Es estrictamente >.
   *
   * Si son iguales,
   * devuelve false.
   */
  return Number(rubro.venta_rubro) > Number(rubro.original_venta);
}

export function requiereDocumentoSpot({
  rubroSpot,
  archivo,
}: {
  rubroSpot: RubroGuardar | null;

  archivo: File | null;
}) {
  if (!rubroSpot) {
    return false;
  }

  return !archivo && !esSpotMayorAlOriginal(rubroSpot);
}
export function construirPayloadVersion({
  version,
  codCotizacionCabecera,
  codEstadoInactivo,
  tieneSpot,
}: {
  version: Record<string, unknown>;

  codCotizacionCabecera: Id;

  codEstadoInactivo: Id;

  tieneSpot: boolean;
}) {
  return {
    ...version,

    cod_cotizacion_cabecera: codCotizacionCabecera,

    cod_estado: codEstadoInactivo,

    fecha_vencimiento: addDays(new Date(), 15),

    es_spot: tieneSpot,
  };
}
export function agruparRubrosParaGuardar({
  rubros,
  codCc,
  codTipoTransporte,
}: {
  rubros: RubroGuardar[];

  codCc?: Id | null;

  codTipoTransporte?: Id | null;
}) {
  const agrupados = new Map<number, RubroGuardar[]>();

  for (const rubro of rubros) {
    const orden = obtenerOrdenGrupoDefault({
      nombre: rubro.gruporubro_nombre ?? null,

      idDeGrupo: rubro.idDeGrupo ?? null,

      codCc: codCc ?? null,

      codTipoTransporte: codTipoTransporte ?? null,
    });

    const grupo = agrupados.get(orden) ?? [];

    grupo.push(rubro);

    agrupados.set(orden, grupo);
  }

  return [...agrupados.entries()].sort(([a], [b]) => a - b).map(([, rubrosGrupo]) => rubrosGrupo);
}
export function construirDimensionesPayload(
  dimensiones: DimensionIngresada[],
  criterios: Record<string, unknown> = {},
) {
  const pesoTotalDirecto = Number(criterios.total_peso ?? 0);

  const volumenTotalDirecto = Number(criterios.total_volumen ?? 0);

  const cwTotalDirecto = Number(
    criterios.valor_cw ?? Math.max(pesoTotalDirecto, volumenTotalDirecto),
  );

  const tieneTotalesDirectos = pesoTotalDirecto > 0 || volumenTotalDirecto > 0;

  const dimensionesParaGuardar: DimensionIngresada[] = dimensiones.length
    ? dimensiones
    : tieneTotalesDirectos
      ? [
          {
            cantidad: 1,

            largo: volumenTotalDirecto,
            ancho: 1,
            alto: 1,

            cotdetdim_peso_unitario: pesoTotalDirecto,

            cotdetdim_unidad_medida: UNIDAD_DEFAULT.MEDIDA,
            cotdetdim_unidad_peso: UNIDAD_DEFAULT.PESO,

            total_peso: pesoTotalDirecto,
            total_volumen: volumenTotalDirecto,
            total_cw: cwTotalDirecto,

            esTotalDirecto: true,
          },
        ]
      : [];

  const payload = dimensionesParaGuardar
    .map((dimension) => {
      const esTotalDirecto = dimension.esTotalDirecto === true;

      const cantidad = Number(dimension.cotdetdim_cantidad ?? dimension.cantidad ?? 0);

      const largo = Number(dimension.cotdetdim_largo ?? dimension.largo ?? 0);

      const ancho = Number(dimension.cotdetdim_ancho ?? dimension.ancho ?? 0);

      const alto = Number(dimension.cotdetdim_alto ?? dimension.alto ?? 0);

      const unidadMedida =
        dimension.cotdetdim_unidad_medida ?? dimension.unidadMedida?.value ?? null;

      const unidadPeso = dimension.cotdetdim_unidad_peso ?? dimension.unidadPeso?.value ?? null;

      const totalVolumenFallback = largo * ancho * alto * cantidad;

      const totalPesoFallback =
        Number(dimension.cotdetdim_peso_unitario ?? dimension.pesoUnitario ?? 0) * cantidad;

      const totalVolumen = Number(
        dimension.total_volumen ??
          dimension.volumenTotalKg ??
          dimension.volumenTotal ??
          totalVolumenFallback,
      );

      const totalPeso = Number(
        dimension.total_peso ?? dimension.pesoTotalKg ?? dimension.pesoTotal ?? totalPesoFallback,
      );

      const totalCw = Number(dimension.total_cw ?? Math.max(totalPeso, totalVolumen));

      return {
        cod_cotdetdim: null,

        cotdetdim_cantidad: cantidad,

        cotdetdim_largo: largo,

        cotdetdim_ancho: ancho,

        cotdetdim_alto: alto,

        /*
         * Sí:
         * actualmente se guarda
         * TOTAL VOLUMÉTRICO aquí.
         */
        cotdetdim_peso_unitario: esTotalDirecto
          ? 0
          : Number(dimension.volumenTotalKg ?? totalVolumen),

        cotdetdim_unidad_medida:
          unidadMedida != null && unidadMedida !== "" ? Number(unidadMedida) : null,

        cotdetdim_unidad_peso: unidadPeso != null && unidadPeso !== "" ? Number(unidadPeso) : null,

        total_peso: Math.ceil(totalPeso),

        total_volumen: Math.ceil(totalVolumen),

        total_cw: Math.ceil(totalCw),
      };
    })
    .filter(
      (dimension) =>
        dimension.cotdetdim_cantidad > 0 ||
        dimension.cotdetdim_largo > 0 ||
        dimension.cotdetdim_ancho > 0 ||
        dimension.cotdetdim_alto > 0 ||
        dimension.cotdetdim_peso_unitario > 0 ||
        dimension.total_peso > 0 ||
        dimension.total_volumen > 0 ||
        dimension.cotdetdim_unidad_medida != null ||
        dimension.cotdetdim_unidad_peso != null,
    );

  /*
   * Estos campos representan los totales de toda la cotización.
   * Se repiten completos en cada registro de dimensiones.
   */
  const pesoGlobal = Math.ceil(
    Number(
      criterios.total_peso ??
        criterios.valor_por_peso ??
        payload.reduce((total, dimension) => total + dimension.total_peso, 0),
    ),
  );
  const volumenGlobal = Math.ceil(
    Number(
      criterios.total_volumen ??
        dimensionesParaGuardar.reduce(
          (total, dimension) =>
            total +
            Number(
              dimension.total_volumen ??
                dimension.volumenTotalKg ??
                dimension.volumenTotal ??
                Number(dimension.cotdetdim_largo ?? dimension.largo ?? 0) *
                  Number(dimension.cotdetdim_ancho ?? dimension.ancho ?? 0) *
                  Number(dimension.cotdetdim_alto ?? dimension.alto ?? 0) *
                  Number(dimension.cotdetdim_cantidad ?? dimension.cantidad ?? 0),
            ),
          0,
        ),
    ),
  );
  const cwGlobal = Math.max(pesoGlobal, volumenGlobal);

  payload.forEach((dimension, index) => {
    dimension.cotdetdim_peso_unitario = index === 0 ? pesoGlobal : 0;
    dimension.total_peso = pesoGlobal;
    dimension.total_volumen = volumenGlobal;
    dimension.total_cw = cwGlobal;
  });

  return payload;
}
type CriterioCatalogo = {
  cod_criterio?: Id | null;
  campo?: string | null;
};

function obtenerValorCriterio(campo: string, valor: unknown) {
  if (
    campo === "total_peso" ||
    campo === "total_volumen" ||
    campo === "total_cw" ||
    campo === "valor_cw"
  ) {
    return Math.ceil(Number(valor ?? 0));
  }

  if (campo === "express") {
    return valor === "NORMAL";
  }

  if (typeof valor === "number" || typeof valor === "string") {
    return valor;
  }

  if (valor && typeof valor === "object" && "value" in valor) {
    return (
      (
        valor as {
          value?: unknown;
        }
      ).value ?? 0
    );
  }

  return 0;
}

export function construirCriteriosPayload({
  criterios,
  criterioCobertura,
  catalogo,
}: {
  criterios: Record<string, unknown>;

  criterioCobertura?: Record<string, unknown>;

  catalogo: CriterioCatalogo[];
}) {
  return (
    Object.entries({
      ...criterios,
      ...(criterioCobertura ?? {}),
    })
      /*
       * PARIDAD LITERAL:
       *
       * el legado tiene un espacio
       * al final.
       */
      .filter(([campo]) => campo !== "flete_fuente ")
      .flatMap(([campo, valor]) => {
        const criterio = catalogo.find((item) => item.campo === campo);

        if (criterio?.cod_criterio == null) {
          return [];
        }

        return [
          {
            cod_criterio: criterio.cod_criterio,

            valor: obtenerValorCriterio(campo, valor),
          },
        ];
      })
  );
}
export function construirSpotPayload({
  rubroSpot,
  codUsuario,
  codCotizacionDetalle,
  codEstadoActivo,
  codEstadoAutorizado,
  reasonCode,
  descripcion,
}: {
  rubroSpot: RubroGuardar;

  codUsuario?: Id | null;

  codCotizacionDetalle: Id;

  codEstadoActivo: Id;

  codEstadoAutorizado: Id;

  reasonCode?: Id | null;

  descripcion?: string | null;
}) {
  const spotMayor = esSpotMayorAlOriginal(rubroSpot);

  return {
    venta: rubroSpot.rate_venta,
    ...(rubroSpot.venta_rubro != null ? { flete: rubroSpot.venta_rubro } : {}),
    costo: rubroSpot.rate_costo,

    url_documento: null,

    cod_usuario_tarifaspot: codUsuario ?? null,

    cod_usuario_autoriza_tarifaspot: null,

    cod_estado: spotMayor ? codEstadoAutorizado : codEstadoActivo,

    venta_original: rubroSpot.original_rate_venta ?? 0,

    costo_original: rubroSpot.original_rate_costo ?? 0,

    reason_code: reasonCode ?? null,

    /*
     * Nombre esperado actualmente
     * por el endpoint.
     */
    jusificacion: descripcion ?? "",

    cod_cotizaciondetalle: codCotizacionDetalle,
  };
}
