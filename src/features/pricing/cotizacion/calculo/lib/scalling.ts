import type { RutaScalling } from "../api/scalling";

import type { Id, MonedaCatalogo, PuntoEnlaceCatalogo } from "./tipos";
import { buscarMoneda } from "./utils";

export const TIPO_PUNTO_POR_TRANSPORTE = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
} as const;

export type TipoTransporteScalling = keyof typeof TIPO_PUNTO_POR_TRANSPORTE;

export type PuntoEnlaceScalling = PuntoEnlaceCatalogo;

export type MonedaScalling = MonedaCatalogo;

export type LegScalling = {
  cod_cotizaciondetalle?: Id | null;

  cod_tipo_transporte?: Id | null;

  cod_puntoenlace_origen?: Id | null;

  cod_puntoenlace_destino?: Id | null;

  orden: number;

  rate: number;

  costo: number;

  entidad_id?: Id | null;

  cod_estado?: Id | null;

  [key: string]: unknown;
};

export type RubroScalling = {
  value?: string | null;

  cod_rubro?: Id | null;

  metodo?: {
    rutas?: Array<{
      codigo?: string | null;

      punto_enlace?: string | null;

      rate?: string | number | null;

      costo?: string | number | null;

      cod_moneda?: Id | null;

      [key: string]: unknown;
    }>;

    cod_moneda_costo?: Id | null;

    cod_moneda_venta?: Id | null;

    moneda_costo?: MonedaScalling | null;

    moneda_venta?: MonedaScalling | null;

    [key: string]: unknown;
  } | null;

  [key: string]: unknown;
};

export type RutaScallingProcesada = RubroScalling & {
  value: string;

  sigla: string | null;

  metodo: {
    sigla: string | null;

    venta: number;

    costo?: number;

    rate?: number;

    cod_moneda_costo?: Id | null;

    cod_moneda_venta?: Id | null;

    moneda_costo?: MonedaScalling | null;

    moneda_venta?: MonedaScalling | null;

    [key: string]: unknown;
  };
};
export function obtenerPuntosScallingPosibles({
  puntos,
  rutasDisponibles,
  tipoTransporte,
  codPuntoOrigen,
  codPuntoDestino,
}: {
  puntos: PuntoEnlaceScalling[];

  rutasDisponibles: RutaScalling[];

  tipoTransporte?: string | null;

  codPuntoOrigen?: Id | null;

  codPuntoDestino?: Id | null;
}) {
  const tipoPunto =
    TIPO_PUNTO_POR_TRANSPORTE[String(tipoTransporte ?? "").toUpperCase() as TipoTransporteScalling];

  if (!tipoPunto) {
    return [];
  }

  const codigosDisponibles = new Set(
    rutasDisponibles.map((ruta) => String(ruta.codigo ?? "").trim()).filter(Boolean),
  );

  return puntos.filter((punto) => {
    if (punto.tipo_descripcion !== tipoPunto) {
      return false;
    }

    /*
     * Origen y destino de la cotización
     * no son paradas intermedias.
     */
    if (codPuntoOrigen != null && String(punto.value) === String(codPuntoOrigen)) {
      return false;
    }

    if (codPuntoDestino != null && String(punto.value) === String(codPuntoDestino)) {
      return false;
    }

    return codigosDisponibles.has(String(punto.codigo ?? ""));
  });
}
export function togglePuntoScalling({
  puntos,
  punto,
}: {
  puntos: PuntoEnlaceScalling[];

  punto: PuntoEnlaceScalling;
}) {
  const existe = puntos.some((item) => String(item.value) === String(punto.value));

  if (existe) {
    return puntos.filter((item) => String(item.value) !== String(punto.value));
  }

  return [...puntos, punto];
}

export function sincronizarOrdenPuntos({
  seleccionados,
  ordenActual,
}: {
  seleccionados: PuntoEnlaceScalling[];

  ordenActual: PuntoEnlaceScalling[];
}) {
  const conservados = ordenActual.filter((punto) =>
    seleccionados.some((item) => String(item.value) === String(punto.value)),
  );

  const nuevos = seleccionados.filter(
    (punto) => !ordenActual.some((item) => String(item.value) === String(punto.value)),
  );

  return [...conservados, ...nuevos];
}

export function moverPuntoScalling({
  puntos,
  index,
  direccion,
}: {
  puntos: PuntoEnlaceScalling[];

  index: number;

  direccion: "up" | "down";
}) {
  const siguienteIndex = direccion === "up" ? index - 1 : index + 1;

  if (siguienteIndex < 0 || siguienteIndex >= puntos.length) {
    return puntos;
  }

  const siguiente = [...puntos];

  const puntoActual = siguiente[index];
  const puntoSiguiente = siguiente[siguienteIndex];

  if (!puntoActual || !puntoSiguiente) {
    return puntos;
  }

  siguiente[index] = puntoSiguiente;
  siguiente[siguienteIndex] = puntoActual;

  return siguiente;
}
export function procesarRutasScalling({
  rubros,
  lectura,
  legs,
  puntos,
  monedas,
}: {
  rubros: RubroScalling[];

  lectura: boolean;

  legs: LegScalling[];

  puntos: PuntoEnlaceScalling[];

  monedas: MonedaScalling[];
}): RutaScallingProcesada[] {
  if (lectura) {
    return rubros.flatMap((rubro) =>
      legs.map((leg, index) => {
        const punto = puntos.find(
          (item) =>
            String(item.cod_puntoenlace ?? item.value) === String(leg.cod_puntoenlace_origen),
        );

        const codMonedaCosto =
          rubro.metodo?.cod_moneda_costo ?? (leg.cod_moneda as Id | undefined) ?? 2;

        const codMonedaVenta =
          rubro.metodo?.cod_moneda_venta ?? (leg.cod_moneda as Id | undefined) ?? 2;

        const sigla = punto?.codigo ?? null;

        return {
          ...rubro,
          ...leg,

          sigla,

          value: `${rubro.value ?? rubro.cod_rubro ?? "SCALLING"}-${sigla ?? index}`,

          metodo: {
            ...(rubro.metodo ?? {}),

            ...leg,

            sigla,

            venta: Number(leg.costo ?? 0),

            costo: Number(leg.costo ?? 0),

            rate: Number(leg.rate ?? 0),

            cod_moneda_costo: codMonedaCosto,

            cod_moneda_venta: codMonedaVenta,

            moneda_costo: rubro.metodo?.moneda_costo ?? buscarMoneda(monedas, codMonedaCosto),

            moneda_venta: rubro.metodo?.moneda_venta ?? buscarMoneda(monedas, codMonedaVenta),
          },
        };
      }),
    );
  }

  return rubros.flatMap((rubro) =>
    (rubro.metodo?.rutas ?? []).map((ruta, index) => {
      const sigla = ruta.punto_enlace ?? ruta.codigo ?? null;

      return {
        ...rubro,
        ...ruta,

        sigla,

        value: `${rubro.value ?? rubro.cod_rubro ?? "SCALLING"}-${sigla ?? index}`,

        metodo: {
          ...(rubro.metodo ?? {}),

          ...ruta,

          sigla,

          venta: Number(ruta.costo ?? 0),

          costo: Number(ruta.costo ?? 0),

          rate: Number(ruta.rate ?? 0),

          cod_moneda_costo: ruta.cod_moneda ?? 2,

          cod_moneda_venta: ruta.cod_moneda ?? 2,

          moneda_costo: buscarMoneda(monedas, ruta.cod_moneda ?? 2),

          moneda_venta: buscarMoneda(monedas, ruta.cod_moneda ?? 2),
        },
      };
    }),
  );
}
export function obtenerValorPuntoScalling({
  codigo,
  rutas,
  puntos,
}: {
  codigo?: string | null;

  rutas: RutaScallingProcesada[];

  puntos: PuntoEnlaceScalling[];
}) {
  if (!codigo) {
    return null;
  }

  const ruta = rutas.find((item) => item.sigla === codigo);

  const punto = puntos.find((item) => item.codigo === codigo);

  if (!punto) {
    return null;
  }

  return {
    ...punto,

    moneda: ruta?.metodo?.moneda_venta ?? null,

    rate: Number(ruta?.metodo?.rate ?? 0),

    venta: Number(ruta?.metodo?.venta ?? 0),
  };
}
export function construirLegsScalling({
  puntosOrdenados,
  rutas,
  puntos,
  codCotizacionDetalle,
  codTipoTransporte,
  entidadId,
}: {
  puntosOrdenados: PuntoEnlaceScalling[];

  rutas: RutaScallingProcesada[];

  puntos: PuntoEnlaceScalling[];

  codCotizacionDetalle?: Id | null;

  codTipoTransporte?: Id | null;

  entidadId?: Id | null;
}): LegScalling[] {
  return puntosOrdenados
    .map<LegScalling | null>((puntoDestino, index) => {
      const puntoOrigen = puntosOrdenados[index - 1];

      if (!puntoOrigen) {
        return null;
      }

      const origen = obtenerValorPuntoScalling({
        codigo: puntoOrigen.codigo ?? null,

        rutas,

        puntos,
      });

      const destino = obtenerValorPuntoScalling({
        codigo: puntoDestino.codigo ?? null,

        rutas,

        puntos,
      });

      return {
        cod_cotizaciondetalle: codCotizacionDetalle ?? null,

        cod_tipo_transporte: codTipoTransporte ?? null,

        cod_puntoenlace_origen: origen?.cod_puntoenlace ?? origen?.value ?? null,

        cod_puntoenlace_destino: destino?.cod_puntoenlace ?? destino?.value ?? null,

        orden: index,

        /*
         * El costo/rate pertenecen
         * al punto ORIGEN del leg.
         */
        rate: origen?.rate ?? 0,

        costo: origen?.venta ?? 0,

        entidad_id: entidadId ?? null,

        cod_estado: 1,
      };
    })
    .filter((item): item is LegScalling => item != null);
}
export function sonLegsScallingIguales(a: LegScalling[], b: LegScalling[]) {
  if (a === b) {
    return true;
  }

  if (a.length !== b.length) {
    return false;
  }

  return a.every((item, index) => {
    const next = b[index];

    if (!next) {
      return false;
    }

    return (
      String(item.cod_cotizaciondetalle ?? "") === String(next.cod_cotizaciondetalle ?? "") &&
      String(item.cod_tipo_transporte ?? "") === String(next.cod_tipo_transporte ?? "") &&
      String(item.cod_puntoenlace_origen ?? "") === String(next.cod_puntoenlace_origen ?? "") &&
      String(item.cod_puntoenlace_destino ?? "") === String(next.cod_puntoenlace_destino ?? "") &&
      item.orden === next.orden &&
      item.rate === next.rate &&
      item.costo === next.costo &&
      item.cod_estado === next.cod_estado
    );
  });
}
