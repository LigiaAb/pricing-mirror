"use client";

import React from "react";

import {
  type RubroCalculo,
  type ServicioCalculo,
  useCalcularTarifa,
  useCalcularTarifaRubros,
  useCalcularTarifaScalling,
} from "../api/calculo-cotizacion";

import type { Id } from "../lib/tipos";
import { crearKeyCriterios } from "../lib/utils";
import { COD_ENTIDAD_DUE_AGENT, RUBRO, TIPO_CALCULO } from "../lib/constantes";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

type Criterios = Record<string, unknown>;
type Filtros = Record<string, unknown>;

type CriterioPlantilla = {
  campo: string;
  cod_tipo_dato?: string | number | null;
};

type Plantilla = {
  cod_tarifaplantilla?: Id | null;
  criterios?: CriterioPlantilla[];
};

type EntidadConFlete = {
  value?: Id | null;
  label?: string | number | null;

  entidad_id?: Id | null;
  entidad_nombre?: string | null;

  [key: string]: unknown;
};

export type ValoresCalculadosCotizacion = {
  data: RubroCalculo[];

  valores: Record<string, unknown>;

  tarifasInternas: RubroCalculo[];

  nuevo?: boolean;
};

type Props = {
  filtros: Filtros;

  criterios: Criterios;

  plantilla?: Plantilla | null;

  isReadOnly?: boolean;
};

type CalcularCotizacionArgs = {
  criteriosCalculo: Criterios;

  codProveedorCarrier?: Id | null;

  nuevo?: boolean;
};

type CalcularDueCarrierDesdeAgentArgs = {
  totalDueAgent: string | number | null | undefined;

  codProveedorCarrier?: Id | null;
};

type CalcularScallingArgs = {
  criteriosCalculo: Criterios;

  codProveedorCarrier?: Id | null;
};

function obtenerValorCriterio(valor: unknown) {
  if (valor != null && typeof valor === "object" && "value" in valor) {
    return (
      valor as {
        value?: unknown;
      }
    ).value;
  }

  return valor;
}

function flattenRubrosServicios(rubros: RubroCalculo[]) {
  return rubros.flatMap((rubro) =>
    (rubro.servicios ?? []).map((servicio) => ({
      value: `${rubro.cod_rubro}-${servicio.cod_servicio}`,

      ...rubro,
      ...servicio,

      servicios: undefined,

      servicio,
    })),
  );
}

/* ==========================================================================
 * CRITERIOS PARA FLETE
 * ========================================================================== */

function quitarValorFlete(criterios: Criterios) {
  const {
    valor_flete: _valorFlete,
    flete_fuente: _fleteFuente,
    express: _express,
    categoria_transporte: _categoriaTransporte,
    ...rest
  } = criterios;

  return rest;
}

export function useCalculoCotizacion({
  filtros,
  criterios,
  plantilla,
  isReadOnly = false,
}: Props) {
  const {
    codigosFletes,
    calculo: { monedas },
  } = useCatalogosCotizacion();

  /*
   * Uso instancias independientes aunque apunten
   * al mismo endpoint.
   *
   * Así cada cálculo tiene su propio isPending/error.
   */
  const calcularCarrierMutation = useCalcularTarifa();

  const calcularAgentMutation = useCalcularTarifa();

  const calcularDueCarrierDesdeAgentMutation = useCalcularTarifa();

  const calcularFleteMutation = useCalcularTarifaRubros();

  const calcularScallingMutation = useCalcularTarifaScalling();

  const [valoresCalculados, setValoresCalculados] =
    React.useState<ValoresCalculadosCotizacion | null>(null);

  const [fletesCalculados, setFletesCalculados] = React.useState<RubroCalculo[]>([]);

  const [entidadesConFlete, setEntidadesConFlete] = React.useState<EntidadConFlete[]>([]);

  const [dueCarrierBasadoEnDueAgent, setDueCarrierBasadoEnDueAgent] = React.useState<
    ReturnType<typeof flattenRubrosServicios>
  >([]);

  /* ============================================================
   * CONTROL DE REQUEST DE FLETE
   * ============================================================ */

  const ultimaKeyFleteRef = React.useRef("");

  const requestFleteRef = React.useRef(0);

  /*
   * Request independiente para Due Carrier basado en Due Agent.
   * Permite invalidar respuestas anteriores cuando el usuario sigue
   * escribiendo un valor abierto.
   */
  const requestDueCarrierDesdeAgentRef = React.useRef(0);

  /*
   * Request independiente para Scalling.
   * Si el usuario modifica puntos/criterios mientras una petición sigue
   * en vuelo, una respuesta vieja no debe sobrescribir la más reciente.
   */
  const requestScallingRef = React.useRef(0);

  const fletesCalculadosRef = React.useRef<RubroCalculo[]>([]);

  const [resetFleteToken, setResetFleteToken] = React.useState(0);

  const actualizarFletesCalculados = React.useCallback((fletes: RubroCalculo[]) => {
    fletesCalculadosRef.current = fletes;
    setFletesCalculados(fletes);
  }, []);

  /* ============================================================
   * CÁLCULO GENERAL
   * ============================================================ */

  const calcularCotizacion = React.useCallback(
    async ({ criteriosCalculo, codProveedorCarrier, nuevo }: CalcularCotizacionArgs) => {
      if (codProveedorCarrier == null) {
        return null;
      }

      /*
       * El Grid hace dos consultas:
       *
       * Carrier -> proveedor seleccionado
       * Agent   -> 13624
       *
       * Son independientes, así que pueden
       * ejecutarse en paralelo.
       */
      const [dataCarrier, dataAgent] = await Promise.all([
        calcularCarrierMutation.mutateAsync({
          ...criteriosCalculo,

          cod_proveedor: codProveedorCarrier,

          ...filtros,

          cod_tarifaplantilla: 0,
        }),

        calcularAgentMutation.mutateAsync({
          ...criteriosCalculo,

          cod_proveedor: COD_ENTIDAD_DUE_AGENT,

          ...filtros,

          cod_tarifaplantilla: 0,
        }),
      ]);

      const siguiente: ValoresCalculadosCotizacion = {
        data: [...dataCarrier, ...dataAgent],

        valores: {
          ...criteriosCalculo,

          cod_proveedor: codProveedorCarrier,
        },

        /*
         * El cálculo interno está comentado
         * en el sistema actual.
         */
        tarifasInternas: [],

        ...(nuevo === undefined ? {} : { nuevo }),
      };

      setValoresCalculados(siguiente);

      return siguiente;
    },
    [filtros, calcularCarrierMutation, calcularAgentMutation],
  );

  /* ============================================================
   * FLETE
   * ============================================================ */

  const obtenerFlete = React.useCallback(
    async ({
      criteriosActuales,
      requestKey,
    }: {
      criteriosActuales: Criterios;
      requestKey?: string;
    }) => {
      /*
       * Igual al Grid actual.
       */
      if (!criteriosActuales.valor_cw) {
        return [];
      }

      if (requestKey && ultimaKeyFleteRef.current === requestKey) {
        return fletesCalculadosRef.current;
      }

      if (plantilla?.cod_tarifaplantilla == null) {
        actualizarFletesCalculados([]);
        setEntidadesConFlete([]);

        return [];
      }

      const codRubros = codigosFletes
        .map((item) => item.cod_rubro)
        .filter((value): value is Id => value != null && value !== "");

      if (!codRubros.length) {
        actualizarFletesCalculados([]);
        setEntidadesConFlete([]);

        return [];
      }

      if (requestKey) {
        ultimaKeyFleteRef.current = requestKey;
      }

      const requestActual = ++requestFleteRef.current;

      actualizarFletesCalculados([]);
      setEntidadesConFlete([]);

      const { cod_tarifaplantilla = 0, criterios: criteriosPlantilla = [] } = plantilla;

      let valoresProcesados: Record<string, unknown> = {
        cod_tarifaplantilla,
      };

      /*
       * Conserva exactamente la lógica
       * de plantilla del Grid.
       */
      if (criteriosPlantilla.length > 0) {
        for (const criterio of criteriosPlantilla) {
          const valor = criteriosActuales[criterio.campo];

          valoresProcesados[criterio.campo] =
            Number(criterio.cod_tipo_dato) === 4 ? obtenerValorCriterio(valor) : valor;
        }
      } else {
        valoresProcesados = {
          ...criteriosActuales,

          cod_tarifaplantilla,
        };
      }

      try {
        const data = await calcularFleteMutation.mutateAsync({
          ...valoresProcesados,
          ...filtros,

          cod_rubro: codRubros,
        });

        /*
         * Si mientras esperaba se lanzó
         * otro cálculo, esta respuesta
         * ya es vieja.
         */
        if (requestActual !== requestFleteRef.current) {
          return [];
        }

        const fletes = data.filter((item) => item.es_flete === true);

        const entidades = fletes.flatMap((rubro) =>
          (rubro.servicios ?? []).map((servicio) => ({
            ...servicio,

            entidad_id: servicio.entidad_id ?? null,

            value: servicio.entidad_id ?? null,

            label: servicio.entidad_nombre,
          })),
        );

        actualizarFletesCalculados(fletes);

        setEntidadesConFlete(entidades);

        return fletes;
      } catch (error) {
        /*
         * Solo limpiar si este sigue
         * siendo el request vigente.
         */
        if (requestActual === requestFleteRef.current) {
          actualizarFletesCalculados([]);
          setEntidadesConFlete([]);
        }

        throw error;
      }
    },
    [plantilla, codigosFletes, filtros, calcularFleteMutation, actualizarFletesCalculados],
  );

  const criteriosParaFlete = React.useMemo(() => quitarValorFlete(criterios), [criterios]);

  const criteriosParaFleteKey = React.useMemo(
    () => crearKeyCriterios(criteriosParaFlete),
    [criteriosParaFlete],
  );

  /*
   * Contexto semántico del cálculo Due Carrier basado en Due Agent.
   * No depende de referencias de objetos, solamente de sus valores.
   */
  const calculoContextKey = React.useMemo(
    () => [crearKeyCriterios(criterios), crearKeyCriterios(filtros)].join("||"),
    [criterios, filtros],
  );

  /*
   * Se conserva el nombre anterior para no romper consumidores existentes.
   */
  const dueCarrierDesdeAgentContextKey = calculoContextKey;

  /*
   * PASO A DEL PIPELINE DEL LEGADO:
   * plantilla + criterios base -> fletes disponibles.
   *
   * En el ZIP no existía ningún consumidor de obtenerFlete(),
   * por lo que sin este efecto fletesCalculados permanecía vacío.
   */
  React.useEffect(() => {
    if (isReadOnly) {
      return;
    }

    if (plantilla?.cod_tarifaplantilla == null) {
      return;
    }

    if (!Object.keys(criteriosParaFlete).length) {
      return;
    }

    const requestKey = `${plantilla.cod_tarifaplantilla}__${criteriosParaFleteKey}__${resetFleteToken}`;

    void obtenerFlete({
      criteriosActuales: criteriosParaFlete,
      requestKey,
    });
  }, [
    isReadOnly,
    plantilla?.cod_tarifaplantilla,
    criteriosParaFlete,
    criteriosParaFleteKey,
    resetFleteToken,
    obtenerFlete,
  ]);

  /*
   * Permite forzar nuevamente el cálculo
   * aun si la request key no cambió.
   */
  const invalidarFlete = React.useCallback(() => {
    ultimaKeyFleteRef.current = "";

    setResetFleteToken((prev) => prev + 1);
  }, []);

  /* ============================================================
   * DUE CARRIER BASADO EN DUE AGENT
   * ============================================================ */

  const limpiarDueCarrierBasadoEnDueAgent = React.useCallback(() => {
    /*
     * Invalida cualquier request anterior. Si una respuesta vieja llega
     * después de que el total cambió, ya no podrá repoblar el estado.
     */
    requestDueCarrierDesdeAgentRef.current += 1;

    setDueCarrierBasadoEnDueAgent((prev) => (prev.length > 0 ? [] : prev));
  }, []);

  const calcularDueCarrierBasadoEnDueAgent = React.useCallback(
    async ({ totalDueAgent, codProveedorCarrier }: CalcularDueCarrierDesdeAgentArgs) => {
      if (isReadOnly) {
        return [];
      }

      const total = Number(totalDueAgent) || 0;

      if (codProveedorCarrier == null || total <= 0) {
        limpiarDueCarrierBasadoEnDueAgent();
        return [];
      }

      const requestId = ++requestDueCarrierDesdeAgentRef.current;

      try {
        const rubros = await calcularDueCarrierDesdeAgentMutation.mutateAsync({
          ...criterios,
          ...filtros,

          cod_proveedor: codProveedorCarrier,

          cod_tarifaplantilla: 0,

          valor_dueagent: total,

          cod_tipo_calculo: TIPO_CALCULO.DUE_AGENT,
        });

        /*
         * El usuario puede haber seguido escribiendo mientras el request
         * estaba en vuelo. Solo la respuesta más reciente puede aplicarse.
         */
        if (requestId !== requestDueCarrierDesdeAgentRef.current) {
          return [];
        }

        const procesados = flattenRubrosServicios(rubros);

        setDueCarrierBasadoEnDueAgent(procesados);

        return procesados;
      } catch (error) {
        if (requestId === requestDueCarrierDesdeAgentRef.current) {
          setDueCarrierBasadoEnDueAgent((prev) => (prev.length > 0 ? [] : prev));
        }

        throw error;
      }
    },
    [
      isReadOnly,
      criterios,
      filtros,
      calcularDueCarrierDesdeAgentMutation,
      limpiarDueCarrierBasadoEnDueAgent,
    ],
  );

  /* ============================================================
   * MONEDA PARA SCALLING
   * ============================================================ */

  const codMonedaDelResto = React.useMemo(() => {
    for (const item of valoresCalculados?.data ?? []) {
      const codMoneda = item.servicios?.[0]?.metodo?.cod_moneda_venta;

      if (codMoneda != null && String(codMoneda).trim() !== "") {
        return codMoneda;
      }
    }

    return null;
  }, [valoresCalculados?.data]);

  const getMoneda = React.useCallback(
    (codMoneda: Id | null | undefined) => {
      if (codMoneda == null || String(codMoneda).trim() === "") {
        return null;
      }

      return monedas.find((moneda) => String(moneda.cod_moneda) === String(codMoneda)) ?? null;
    },
    [monedas],
  );

  /* ============================================================
   * SCALLING
   * ============================================================ */

  const calcularScalling = React.useCallback(
    async ({ criteriosCalculo, codProveedorCarrier }: CalcularScallingArgs) => {
      if (codProveedorCarrier == null) {
        return [];
      }

      const requestId = ++requestScallingRef.current;

      const data = await calcularScallingMutation.mutateAsync({
        /*
         * El orden importa.
         * Es el mismo del Grid actual.
         */
        ...criteriosCalculo,

        cod_proveedor: codProveedorCarrier,

        ...criterios,

        cod_tarifaplantilla: 0,

        ...filtros,
      });

      /*
       * El usuario pudo modificar puntos/criterios mientras el request
       * estaba en vuelo. Solo la respuesta más reciente puede aplicarse.
       */
      if (requestId !== requestScallingRef.current) {
        return [];
      }

      if (!data.length) {
        return [];
      }

      const moneda = getMoneda(codMonedaDelResto);

      const serviciosBase: ServicioCalculo[] = data.flatMap((item) =>
        (item.servicios ?? []).length > 0
          ? flattenRubrosServicios([item])
          : [item as unknown as ServicioCalculo],
      );

      const serviciosScalling = serviciosBase.map((item) => {
        const rutas = Array.isArray(item.metodo?.rutas) ? item.metodo.rutas : [];

        const minimo = Number(item.metodo?.minimo ?? 0);

        const totalRutas = rutas.reduce((total, ruta) => total + Number(ruta.costo ?? 0), 0);

        /*
         * calcular-tarifa-scalling también puede devolver el servicio plano
         * con rutas vacías y únicamente metodo.minimo. En ese caso el mínimo
         * sigue siendo el valor calculado que debe mostrarse.
         */
        const totalConMinimo = Math.max(minimo, totalRutas);

        return {
          ...item,

          metodo: {
            ...item.metodo,

            detalles: [],

            venta: totalConMinimo,

            costo: totalConMinimo,

            cod_moneda_costo: codMonedaDelResto,

            cod_moneda_venta: codMonedaDelResto,

            moneda_costo: moneda,

            moneda_venta: moneda,
          },
        };
      });

      /*
       * El Grid no agrega otro rubro:
       *
       * busca rubro 134 y sustituye
       * sus servicios.
       */
      setValoresCalculados((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,

          data: prev.data.map((rubro) =>
            Number(rubro.cod_rubro) === RUBRO.SCALLING
              ? {
                  ...rubro,

                  servicios: serviciosScalling,
                }
              : rubro,
          ),

          valores: {
            ...prev.valores,
            ...criteriosCalculo,
          },
        };
      });

      return serviciosScalling;
    },
    [criterios, filtros, codMonedaDelResto, getMoneda, calcularScallingMutation],
  );

  /* ============================================================
   * RESET
   * ============================================================ */

  const limpiarResultadosTarifa = React.useCallback(() => {
    setValoresCalculados(null);

    setDueCarrierBasadoEnDueAgent([]);
  }, []);

  const limpiarCalculo = React.useCallback(() => {
    setValoresCalculados(null);

    actualizarFletesCalculados([]);

    setEntidadesConFlete([]);

    setDueCarrierBasadoEnDueAgent([]);

    ultimaKeyFleteRef.current = "";

    requestFleteRef.current += 1;

    requestScallingRef.current += 1;

    /*
     * Igual al resetCalcToken del legado:
     * permite volver a pedir flete aun con
     * los mismos criterios aparentes.
     */
    setResetFleteToken((prev) => prev + 1);
  }, [actualizarFletesCalculados]);

  /* ============================================================
   * ESTADOS
   * ============================================================ */

  const calculandoDueCarrier = calcularCarrierMutation.isPending;

  const calculandoDueAgent = calcularAgentMutation.isPending;

  const calculandoTarifas = calculandoDueCarrier || calculandoDueAgent;

  const calculandoFlete = calcularFleteMutation.isPending;

  const calculandoDueCarrierBasadoEnDueAgent = calcularDueCarrierDesdeAgentMutation.isPending;

  const calculandoScalling = calcularScallingMutation.isPending;

  const isPending =
    calculandoTarifas ||
    calculandoFlete ||
    calculandoDueCarrierBasadoEnDueAgent ||
    calculandoScalling;

  return {
    /* Datos */

    valoresCalculados,

    fletesCalculados,

    entidadesConFlete,

    dueCarrierBasadoEnDueAgent,

    codMonedaDelResto,

    /* Criterios base usados para obtener/recalcular flete */

    criteriosParaFlete,

    calculoContextKey,

    dueCarrierDesdeAgentContextKey,

    /* Acciones */

    calcularCotizacion,

    obtenerFlete,

    invalidarFlete,

    calcularDueCarrierBasadoEnDueAgent,

    limpiarDueCarrierBasadoEnDueAgent,

    calcularScalling,

    limpiarCalculo,

    limpiarResultadosTarifa,

    /* Loading */

    calculandoTarifas,

    calculandoDueCarrier,

    calculandoDueAgent,

    calculandoFlete,

    calculandoDueCarrierBasadoEnDueAgent,

    calculandoScalling,

    isPending,
  };
}
