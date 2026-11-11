"use client";

import React from "react";
import { TIPO_PAGO } from "../lib/constantes";
import {
  calcularTotalesPorMoneda,
  construirElementosAgrupados,
  construirEstadoInicialTotales,
  construirListaElementos,
  construirPayloadRubrosAgrupados,
  construirSugerenciasNombreGrupo,
  type EntidadTotal,
  type GruposPorRubro,
  getLetraTipoPago,
  type Id,
  type NombresGrupo,
  type RubroTotal,
  separarRubrosParaTotales,
  type TipoPagoPorRubro,
} from "../lib/totales-rubros";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

type Props = {
  rubros: RubroTotal[];

  cotizacion?: {
    cod_tipo_pago?: Id | null;
    cod_cc?: Id | null;
    cod_tipo_transporte?: Id | null;
  } | null;

  entidad?: EntidadTotal | null;

  lectura?: boolean;

  onRubrosAgrupados?: (rubros: ReturnType<typeof construirPayloadRubrosAgrupados>) => void;
};

const NOOP_RUBROS_AGRUPADOS: NonNullable<Props["onRubrosAgrupados"]> = () => {};

function crearFirmaEstadoInicial({
  gruposIngresadosSegunRubro,
  nombresGrupo,
  tipoPagoSeleccionado,
}: {
  gruposIngresadosSegunRubro: GruposPorRubro;
  nombresGrupo: NombresGrupo;
  tipoPagoSeleccionado: TipoPagoPorRubro;
}) {
  const grupos = Object.entries(gruposIngresadosSegunRubro)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, value?.idDeGrupo ?? null, value?.nombre ?? ""]);

  const nombres = Object.entries(nombresGrupo).sort(([a], [b]) => a.localeCompare(b));

  const tiposPago = Object.entries(tipoPagoSeleccionado).sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify({
    grupos,
    nombres,
    tiposPago,
  });
}

export function useTotalesRubros({
  rubros,
  cotizacion,
  entidad,
  lectura = false,
  onRubrosAgrupados = NOOP_RUBROS_AGRUPADOS,
}: Props) {
  const {
    codRubroIVA,
    calculo: { monedas },
  } = useCatalogosCotizacion();

  const codTipoPago = cotizacion?.cod_tipo_pago;

  const letraTipoPagoDefault = React.useMemo(() => getLetraTipoPago(codTipoPago), [codTipoPago]);

  const { rubrosIvaEnCalculo, rubrosSinIva } = React.useMemo(
    () =>
      separarRubrosParaTotales({
        rubros,
        codRubroIVA: codRubroIVA ?? null,
      }),
    [rubros, codRubroIVA],
  );

  const listaElementos = React.useMemo(
    () =>
      construirListaElementos({
        rubros: rubrosSinIva,
        codTipoPago: codTipoPago ?? null,
      }),
    [rubrosSinIva, codTipoPago],
  );

  const estadoInicial = React.useMemo(
    () =>
      construirEstadoInicialTotales({
        rubrosSinIva,
        codTipoPago: codTipoPago ?? null,

        codCc: cotizacion?.cod_cc ?? null,

        codTipoTransporte: cotizacion?.cod_tipo_transporte ?? null,
      }),
    [rubrosSinIva, codTipoPago, cotizacion?.cod_cc, cotizacion?.cod_tipo_transporte],
  );

  const [gruposIngresadosSegunRubro, setGruposIngresadosSegunRubro] =
    React.useState<GruposPorRubro>(estadoInicial.gruposIngresadosSegunRubro);

  const [nombresGrupo, setNombresGrupo] = React.useState<NombresGrupo>(estadoInicial.nombresGrupo);

  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = React.useState<TipoPagoPorRubro>(
    estadoInicial.tipoPagoSeleccionado,
  );

  /*
   * Equivale al useEffect de inicialización
   * del GenerarTotalRubros viejo.
   *
   * IMPORTANTE:
   * `estadoInicial` puede ser un objeto nuevo aunque los rubros tengan
   * exactamente el mismo contenido. Depender directamente de su referencia
   * provocaba:
   *
   * estadoInicial nuevo -> setState -> render -> estadoInicial nuevo -> ...
   *
   * La sincronización ahora depende del contenido lógico.
   */
  const firmaEstadoInicial = crearFirmaEstadoInicial(estadoInicial);

  const ultimaFirmaEstadoInicialRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (ultimaFirmaEstadoInicialRef.current === firmaEstadoInicial) {
      return;
    }

    /*
     * Guardamos la firma antes de escribir estado para que el render
     * provocado por los setters no pueda repetir la misma sincronización.
     */
    ultimaFirmaEstadoInicialRef.current = firmaEstadoInicial;

    setGruposIngresadosSegunRubro(estadoInicial.gruposIngresadosSegunRubro);

    /*
     * El legado conservaba nombres escritos previamente mediante:
     *
     * {
     *   ...auto,
     *   ...guardado,
     *   ...prev
     * }
     *
     * Mantenemos ese comportamiento.
     */
    setNombresGrupo((prev) => ({
      ...estadoInicial.nombresGrupo,
      ...prev,
    }));

    setTipoPagoSeleccionado(estadoInicial.tipoPagoSeleccionado);
  }, [firmaEstadoInicial, estadoInicial]);

  const sugerenciaNombreGrupo = React.useMemo(
    () =>
      construirSugerenciasNombreGrupo({
        listaElementos,
        gruposIngresadosSegunRubro,
      }),
    [listaElementos, gruposIngresadosSegunRubro],
  );

  const totalPorMoneda = React.useMemo(
    () =>
      calcularTotalesPorMoneda({
        monedas,
        listaElementos,
        rubrosIvaEnCalculo,
        codTipoPago: codTipoPago ?? null,
        tipoPagoSeleccionado,
      }),
    [monedas, listaElementos, rubrosIvaEnCalculo, codTipoPago, tipoPagoSeleccionado],
  );

  const elementosAgrupados = React.useMemo(
    () =>
      construirElementosAgrupados({
        listaElementos,
        gruposIngresadosSegunRubro,
        tipoPagoSeleccionado,
        letraTipoPagoDefault,
      }),
    [listaElementos, gruposIngresadosSegunRubro, tipoPagoSeleccionado, letraTipoPagoDefault],
  );

  /*
   * El componente viejo elimina nombres
   * de grupos que ya no existen.
   */
  React.useEffect(() => {
    if (lectura) {
      return;
    }

    setNombresGrupo((prev) => {
      const gruposActivos = new Set(
        Object.values(gruposIngresadosSegunRubro)
          .map((grupo) => grupo?.idDeGrupo)
          .filter(Boolean)
          .map(String),
      );

      let cambio = false;

      const next = {
        ...prev,
      };

      for (const key of Object.keys(next)) {
        if (!gruposActivos.has(key)) {
          delete next[key];
          cambio = true;
        }
      }

      return cambio ? next : prev;
    });
  }, [gruposIngresadosSegunRubro, lectura]);

  /*
   * =====================================================
   * CAMBIAR TIPO DE PAGO
   * =====================================================
   *
   * Si el rubro pertenece a un grupo,
   * cambia P/C para TODOS los rubros
   * del mismo grupo.
   */
  const cambiarTipoPago = React.useCallback(
    (rubroId: Id, value: "P" | "C") => {
      const key = String(rubroId);

      const idDeGrupo = gruposIngresadosSegunRubro[key]?.idDeGrupo;

      if (!idDeGrupo) {
        setTipoPagoSeleccionado((prev) => ({
          ...prev,
          [key]: value,
        }));

        return;
      }

      setTipoPagoSeleccionado((prev) => {
        const next = {
          ...prev,
        };

        for (const [otroRubroId, info] of Object.entries(gruposIngresadosSegunRubro)) {
          if (Number(info?.idDeGrupo) === Number(idDeGrupo)) {
            next[otroRubroId] = value;
          }
        }

        return next;
      });
    },
    [gruposIngresadosSegunRubro],
  );

  /*
   * =====================================================
   * CAMBIAR NOMBRE DEL GRUPO
   * =====================================================
   */

  const cambiarNombreGrupo = React.useCallback((idDeGrupo: Id, nombre: string) => {
    setNombresGrupo((prev) => ({
      ...prev,
      [String(idDeGrupo)]: nombre,
    }));
  }, []);

  /*
   * =====================================================
   * CAMBIAR GRUPO
   * =====================================================
   */

  const cambiarGrupo = React.useCallback(
    (rubroId: Id, raw: string) => {
      const key = String(rubroId);

      const cleaned = String(raw ?? "").replace(/[^\d]/g, "");

      const idDeGrupo = cleaned === "" ? null : Number.parseInt(cleaned, 10);

      /*
       * Permitir quitar el grupo.
       */
      if (idDeGrupo == null) {
        setGruposIngresadosSegunRubro((prev) => {
          const next = {
            ...prev,
          };

          delete next[key];

          return next;
        });

        return;
      }

      const tipoPagoActual = tipoPagoSeleccionado[key] ?? letraTipoPagoDefault;

      /*
       * Igual al legado:
       * no permitir meter en el mismo
       * grupo rubros P y C.
       */
      const tieneConflicto = Object.entries(gruposIngresadosSegunRubro).some(
        ([otroRubroId, info]) => {
          if (!info?.idDeGrupo) {
            return false;
          }

          if (Number(info.idDeGrupo) !== idDeGrupo) {
            return false;
          }

          if (String(otroRubroId) === key) {
            return false;
          }

          const tipoPagoOtro = tipoPagoSeleccionado[otroRubroId] ?? letraTipoPagoDefault;

          return tipoPagoOtro !== tipoPagoActual;
        },
      );

      if (tieneConflicto) {
        return;
      }

      setGruposIngresadosSegunRubro((prev) => ({
        ...prev,

        [key]: {
          idDeGrupo,

          nombre: prev[key]?.nombre ?? "",
        },
      }));
    },
    [gruposIngresadosSegunRubro, tipoPagoSeleccionado, letraTipoPagoDefault],
  );

  /*
   * =====================================================
   * PAYLOAD FINAL
   * =====================================================
   */

  const rubrosAgrupados = React.useMemo(
    () =>
      construirPayloadRubrosAgrupados({
        listaElementos,
        gruposIngresadosSegunRubro,
        tipoPagoSeleccionado,
        nombresGrupo,
        sugerenciaNombreGrupo,
        codTipoPago: codTipoPago ?? null,
        rubrosIvaEnCalculo,
        codRubroIVA: codRubroIVA ?? null,
        totalPorMoneda,
        entidad: entidad ?? null,
      }),
    [
      listaElementos,
      gruposIngresadosSegunRubro,
      tipoPagoSeleccionado,
      nombresGrupo,
      sugerenciaNombreGrupo,
      codTipoPago,
      rubrosIvaEnCalculo,
      codRubroIVA,
      totalPorMoneda,
      entidad,
    ],
  );

  /*
   * Mantiene el contrato viejo:
   *
   * <GenerarTotalRubros
   *   onRubrosAgrupados={setRubrosConGrupos}
   * />
   */
  React.useEffect(() => {
    onRubrosAgrupados(rubrosAgrupados);
  }, [rubrosAgrupados, onRubrosAgrupados]);

  return {
    listaElementos,

    elementosAgrupados,

    totalPorMoneda,

    letraTipoPagoDefault,

    mostrarTipoPago: Number(codTipoPago) === TIPO_PAGO.TODOS,

    gruposIngresadosSegunRubro,

    nombresGrupo,

    tipoPagoSeleccionado,

    sugerenciaNombreGrupo,

    cambiarGrupo,

    cambiarNombreGrupo,

    cambiarTipoPago,

    rubrosAgrupados,
  };
}
