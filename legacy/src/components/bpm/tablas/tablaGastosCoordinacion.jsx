import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Autocomplete, Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import TablaDue from "@/components/bpm/tablas/tablaDue";
import {
  useFetchMonedas,
  useFetchServicios,
  useFetchTipos,
  useListarCoordinacionGastos,
  useObtenerUltimaVersionCoordinacionGastos,
  useFetchEntidades,
  useInsertarCoordinacionGasto,
  useListarCoordinacionGastosCriterio,
  mapCriteriosConValor,
  useCalcularTarifa,
} from "@/hooks/Bpm";

const DUE_AGENT_SERVICE_DEFAULT_LIMIT = 100;
const DUE_AGENT_SERVICE_SEARCH_LIMIT = 200;
const DUE_AGENT_SERVICE_MIN_SEARCH_LENGTH = 2;
const DUE_AGENT_SERVICE_LISTBOX_MAX_HEIGHT = 360;

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const toNumberOrFallback = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const normalizedValue = Number(value);
  return Number.isNaN(normalizedValue) ? fallback : normalizedValue;
};

const formatVentaDisplay = (value) => {
  const normalizedValue = toNumberOrFallback(value, null);

  if (normalizedValue === null) {
    return value == null || value === "" ? "" : String(value);
  }

  return `${normalizedValue.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
};

const getDueAgentServiceSearchState = (options, rawInputValue) => {
  const normalizedTerm = String(rawInputValue ?? "").trim().toLowerCase();

  if (!normalizedTerm) {
    return {
      options: options.slice(0, DUE_AGENT_SERVICE_DEFAULT_LIMIT),
      totalMatches: options.length,
      needsMoreChars: false,
    };
  }

  if (normalizedTerm.length < DUE_AGENT_SERVICE_MIN_SEARCH_LENGTH) {
    return {
      options: [],
      totalMatches: 0,
      needsMoreChars: true,
    };
  }

  const matchedOptions = options.filter((option) => option.searchText.includes(normalizedTerm));

  return {
    options: matchedOptions.slice(0, DUE_AGENT_SERVICE_SEARCH_LIMIT),
    totalMatches: matchedOptions.length,
    needsMoreChars: false,
  };
};

const TablaGastosCoordinacion = ({ embarqueId, embarqueVersion, embarqueData, onLoadingChange = null, mostrarAgregarServicio = true }) => {
  const { themeMode } = useSelector((state) => state.theme);

  const { data: versionData = {}, isSuccess: isVersionSuccess, isLoading: isLoadingVersion } = useObtenerUltimaVersionCoordinacionGastos(
    embarqueId || null,
  );

  const resolvedVersion =
    versionData?.embarque_version ?? embarqueVersion ?? null;

  const { data: gastos = [], isLoading: isLoadingGastos } = useListarCoordinacionGastos({
    embarque_id: embarqueId,
    embarque_version: resolvedVersion,
    enabled: !!embarqueId && isVersionSuccess,
  });

  const { data: monedas = [], isLoading: isLoadingMonedas } = useFetchMonedas({ es_operativa: true });
  const { data: servicios = [], isLoading: isLoadingServicios } = useFetchServicios();
  const dueAgentEntidadId = "13624";

  const dueCarrierEntidadId = useMemo(() => {
    if (!Array.isArray(gastos)) return null;

    const entidadId = gastos
      .map((item) => item?.entidad_id ?? item?.ENTIDAD_ID ?? item?.codigo_entidad ?? item?.cod_proveedor ?? null)
      .find((id) => id != null && String(id) !== dueAgentEntidadId);

    return entidadId == null ? null : Number(entidadId);
  }, [gastos]);

  // ── Criterios para armar params de calcular-tarifa ───────────────────────
  const { data: criteriosRaw = [], isFetched: isCriteriosFetched, isLoading: isLoadingCriterios } = useListarCoordinacionGastosCriterio(
    embarqueId,
    resolvedVersion,
    { enabled: !!embarqueId && isVersionSuccess },
  );

  const criteriosMap = useMemo(
    () => mapCriteriosConValor(criteriosRaw, embarqueId),
    [criteriosRaw, embarqueId],
  );

  // ── Params para calcular-tarifa: obligatorios desde embarqueData, opcionales desde criterios ──
  const calcularTarifaParams = useMemo(() => {
    const codEmpresa =
      embarqueData?.empresa_id ?? embarqueData?.EMPRESA_ID ?? embarqueData?.empresaId ?? embarqueData?.cod_empresa ?? null;
    const codCc =
      embarqueData?.cencod_id ?? embarqueData?.CENCOD_ID ?? embarqueData?.cencodId ??
      embarqueData?.cencos_id ?? embarqueData?.CENCOS_ID ?? embarqueData?.cencosId ??
      embarqueData?.centroId ?? embarqueData?.centro_id ?? embarqueData?.cod_cc ?? embarqueData?.COD_CC ?? null;
    const codTipoServicio =
      embarqueData?.id_servicio ?? embarqueData?.ID_SERVICIO ?? embarqueData?.idServicio ?? embarqueData?.cod_tipo_servicio ?? null;
    const codTipoTransporte =
      embarqueData?.tipo_id_embarque ?? embarqueData?.TIPO_ID_EMBARQUE ?? embarqueData?.tipoIdEmbarque ?? embarqueData?.cod_tipo_transporte ?? null;
    const entidadIdCli =
      embarqueData?.entidad_id_cli ?? embarqueData?.ENTIDAD_ID_CLI ?? embarqueData?.entidadIdCli ?? null;
    const codTarifaplantilla =
      embarqueData?.cod_tarifaplantilla ?? criteriosMap?.cod_tarifaplantilla ?? 0;

    const codProveedor = 13624;

    return {
      cod_tarifaplantilla: codTarifaplantilla,
      cod_empresa: codEmpresa,
      cod_cc: codCc,
      cod_tipo_servicio: codTipoServicio,
      cod_tipo_transporte: codTipoTransporte,
      entidad_id: entidadIdCli,
      cod_proveedor: codProveedor,
      ...criteriosMap,
    };
  }, [embarqueData, criteriosMap]);

  const { data: tarifaRubros = [] } = useCalcularTarifa(calcularTarifaParams, {
    enabled: !!embarqueId && isVersionSuccess && isCriteriosFetched,
  });

  const monedasMap = useMemo(() => {
    const map = new Map();
    monedas.forEach((m) => {
      map.set(String(m.cod_moneda), m);
    });
    return map;
  }, [monedas]);

  const { data: tiposPago = [], isLoading: isLoadingTiposPago } = useFetchTipos({ tipo_tabla: "PAGO" });

  const serviciosMap = useMemo(() => {
    const map = new Map();
    servicios.forEach((s) => {
      const key = String(s.value ?? s.cod_servicio ?? s.cod_servicio);
      const label = s.label ?? s.nombre ?? s.descripcion ?? "";
      const siglas = s.siglas ?? s.SIGLAS ?? "";
      map.set(key, { label, siglas });
    });
    return map;
  }, [servicios]);

  const tipoPagoMap = useMemo(() => {
    const map = new Map();
    tiposPago.forEach((t) => {
      const tipoValue = toNumberOrFallback(firstDefined(t.value, t.cod_tipo, t.codTipo), null);
      const tipoLabel = firstDefined(t.label, t.nom_tipo, t.nomTipo, t.descripcion, "");

      if (tipoValue != null) {
        map.set(String(tipoValue), tipoLabel);
      }
    });
    return map;
  }, [tiposPago]);

  const tipoIdPagoCoordinacion = toNumberOrFallback(
    firstDefined(embarqueData?.tipo_id_pago, embarqueData?.TIPO_ID_PAGO, embarqueData?.tipoPago),
    null,
  );

  const [selectedDueAgentService, setSelectedDueAgentService] = useState(null);
  const [dueAgentServiceSearch, setDueAgentServiceSearch] = useState("");
  const [selectedPagoType, setSelectedPagoType] = useState(null);
  const [isAddingDueAgent, setIsAddingDueAgent] = useState(false);
  const defaultMoneda = monedas[0]?.cod_moneda ?? monedas[0]?.value ?? 1;
  const defaultTipoPago = toNumberOrFallback(firstDefined(tiposPago[0]?.value, tiposPago[0]?.cod_tipo, tiposPago[0]?.codTipo), 131);

  const pagoTypeOptions = useMemo(() => {
    const normalizedTiposPago = tiposPago
      .map((tipo) => ({
        value: toNumberOrFallback(firstDefined(tipo.value, tipo.cod_tipo, tipo.codTipo), null),
        label: String(firstDefined(tipo.label, tipo.nom_tipo, tipo.nomTipo, tipo.descripcion, "")).trim(),
      }))
      .filter((tipo) => tipo.value != null);

    const findTipo = (value, matcher, fallbackLabel) => {
      const tipo = normalizedTiposPago.find((option) => option.value === value)
        ?? normalizedTiposPago.find((option) => matcher(option.label));

      return {
        value,
        label: tipo?.label || fallbackLabel,
      };
    };

    const prepaid = findTipo(128, (label) => /pre[\s-]*paid/i.test(label), "PREPAID");
    const collect = findTipo(127, (label) => /collect/i.test(label), "COLLECT");

    const options = [
      prepaid,
      collect,
    ].filter((option) => option.value != null);

    return options.length > 0 ? options : [{ value: defaultTipoPago, label: tipoPagoMap.get(String(defaultTipoPago)) ?? "Pago" }];
  }, [tiposPago, defaultTipoPago, tipoPagoMap]);

  const isPagoTypeReadOnly = tipoIdPagoCoordinacion === 127 || tipoIdPagoCoordinacion === 128;

  useEffect(() => {
    if (tipoIdPagoCoordinacion === 127 || tipoIdPagoCoordinacion === 128) {
      setSelectedPagoType(tipoIdPagoCoordinacion);
      return;
    }

    if (tipoIdPagoCoordinacion === 131) {
      setSelectedPagoType((currentValue) => (
        pagoTypeOptions.some((option) => option.value === currentValue) ? currentValue : null
      ));
    }
  }, [pagoTypeOptions, tipoIdPagoCoordinacion]);

  const pagoTypeValue = selectedPagoType ?? "";

  const { mutateAsync: insertarCoordinacionGasto } = useInsertarCoordinacionGasto();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    if (!embarqueId) return;

    await queryClient.invalidateQueries({ queryKey: ["ultima-version-coordinacion-gastos", embarqueId] });
    await queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos", embarqueId] });
    await queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos-criterio", embarqueId] });
    await queryClient.invalidateQueries({ queryKey: ["calcular-tarifa"] });
    await queryClient.invalidateQueries({ queryKey: ["coordinaciones", 1, 16, Number(embarqueId)] });
  };

  const dueAgentServiceOptions = useMemo(() => {
    const result = [];
    const seen = new Set();
    let hasTarifaServices = false;
    const expectedEmpresa = calcularTarifaParams.cod_empresa;
    const expectedCentroCosto = calcularTarifaParams.cod_cc;
    const expectedTipoServicio = calcularTarifaParams.cod_tipo_servicio;
    const expectedTipoTransporte = calcularTarifaParams.cod_tipo_transporte;

    const matchesContext = (currentValue, expectedValue) => {
      if (expectedValue == null || expectedValue === "") return true;
      if (currentValue == null || currentValue === "") return true;
      return String(currentValue) === String(expectedValue);
    };

    const pushOption = ({
      codServicio,
      codRubro,
      nombre,
      siglas,
      venta,
      metodoDes,
      codTipoCalculo,
      entidadId,
      rubroNombre,
      codClasificacionCarga,
      rubroData,
      servicioData,
      metodoData,
    }) => {
      const key = String(codServicio ?? "");
      const normalizedNombre = String(nombre ?? "").trim();
      if (!key || !normalizedNombre || seen.has(key)) return;

      seen.add(key);
      result.push({
        key,
        codServicio,
        codRubro,
        nombre: normalizedNombre,
        siglas: siglas ?? "",
        venta: venta ?? "",
        metodoDes: metodoDes ?? "",
        codTipoCalculo,
        entidadId: entidadId ?? Number(dueAgentEntidadId),
        rubroNombre: rubroNombre ?? "Servicios",
        codClasificacionCarga: codClasificacionCarga ?? null,
        rubroData: rubroData ?? null,
        servicioData: servicioData ?? null,
        metodoData: metodoData ?? null,
        searchText: [nombre, siglas, metodoDes, rubroNombre]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    };

    tarifaRubros.forEach((rubro) => {
      const serviciosRubro = rubro.SERVICIOS ?? rubro.servicios ?? [];
      if (!Array.isArray(serviciosRubro) || serviciosRubro.length === 0) return;

      hasTarifaServices = true;

      const rubroNombre = rubro.NOMBRE_RUBRO ?? rubro.nombre_rubro ?? rubro.nombre ?? "Servicios";
      const codRubro = rubro.COD_RUBRO ?? rubro.cod_rubro ?? null;

      serviciosRubro.forEach((srv) => {
        const metodo = srv.METODO ?? srv.metodo ?? {};
        const metodoVenta = metodo.VENTA ?? metodo.venta ?? "";
        const metodoDescripcion = metodo.TIPO_TARIFA_DESC ?? metodo.TIPO_METODO_DESC ?? "";

        pushOption({
          codServicio: srv.COD_SERVICIO ?? srv.cod_servicio,
          codRubro: srv.COD_RUBRO ?? srv.cod_rubro ?? codRubro,
          nombre: srv.NOMBRE ?? srv.nombre,
          siglas: srv.SIGLAS ?? srv.siglas,
          venta: metodoVenta,
          metodoDes: metodoDescripcion,
          codTipoCalculo: srv.COD_TIPO_CALCULO ?? srv.cod_tipo_calculo ?? metodo.COD_TIPO_METODO ?? metodo.cod_tipo_metodo ?? null,
          entidadId: srv.ENTIDAD_ID ?? srv.entidad_id ?? Number(dueAgentEntidadId),
          rubroNombre,
          codClasificacionCarga: srv.COD_CLASIFICACION_CARGA ?? srv.cod_clasificacion_carga ?? null,
          rubroData: rubro,
          servicioData: srv,
          metodoData: metodo,
        });
      });
    });

    if (!hasTarifaServices) {
      servicios.forEach((servicio) => {
        const entidadId = servicio.entidad_id;
        const servicioClasificacion = `${servicio.clasificacion ?? ""}`.toUpperCase();

        if (String(entidadId ?? "") !== dueAgentEntidadId && servicioClasificacion !== "DUE AGENT") return;
        if (!matchesContext(servicio.cod_empresa, expectedEmpresa)) return;
        if (!matchesContext(servicio.cod_cc, expectedCentroCosto)) return;
        if (!matchesContext(servicio.cod_tipo_servicio, expectedTipoServicio)) return;
        if (!matchesContext(servicio.cod_tipo_transporte, expectedTipoTransporte)) return;

        pushOption({
          codServicio: servicio.cod_servicio ?? servicio.value,
          codRubro: servicio.cod_rubro,
          nombre: servicio.nombre ?? servicio.label,
          siglas: servicio.siglas,
          metodoDes: "",
          codTipoCalculo: servicio.cod_tipo_calculo ?? null,
          entidadId: servicio.entidad_id ?? Number(dueAgentEntidadId),
          rubroNombre: servicio.clasificacion ?? "Servicios",
          codClasificacionCarga: servicio.cod_clasificacion_carga ?? null,
          rubroData: {
            COD_RUBRO: servicio.cod_rubro,
            NOMBRE_RUBRO: servicio.clasificacion ?? "Servicios",
          },
          servicioData: servicio,
          metodoData: servicio.METODO ?? servicio.metodo ?? null,
        });
      });
    }

    return result.sort((a, b) => {
      const groupCompare = String(a.rubroNombre ?? "").localeCompare(String(b.rubroNombre ?? ""), "es", { sensitivity: "base" });
      if (groupCompare !== 0) return groupCompare;
      return String(a.nombre ?? "").localeCompare(String(b.nombre ?? ""), "es", { sensitivity: "base" });
    });
  }, [calcularTarifaParams.cod_cc, calcularTarifaParams.cod_empresa, calcularTarifaParams.cod_tipo_servicio, calcularTarifaParams.cod_tipo_transporte, dueAgentEntidadId, servicios, tarifaRubros]);

  const dueAgentServiceSearchState = useMemo(
    () => getDueAgentServiceSearchState(dueAgentServiceOptions, dueAgentServiceSearch),
    [dueAgentServiceOptions, dueAgentServiceSearch],
  );

  const dueAgentServiceHelperText = useMemo(() => {
    if (dueAgentServiceSearch.trim() && dueAgentServiceSearch.trim().length < DUE_AGENT_SERVICE_MIN_SEARCH_LENGTH) {
      return `Escribe al menos ${DUE_AGENT_SERVICE_MIN_SEARCH_LENGTH} caracteres para buscar`;
    }

    if (dueAgentServiceSearch.trim()) {
      const visibleCount = dueAgentServiceSearchState.options.length;
      const totalMatches = dueAgentServiceSearchState.totalMatches;
      const isTruncated = totalMatches > visibleCount;

      return isTruncated
        ? `${visibleCount} de ${totalMatches} coincidencias`
        : `${totalMatches} coincidencias`;
    }

    return `${Math.min(dueAgentServiceOptions.length, DUE_AGENT_SERVICE_DEFAULT_LIMIT)} de ${dueAgentServiceOptions.length} servicios`;
  }, [dueAgentServiceOptions.length, dueAgentServiceSearch, dueAgentServiceSearchState]);

  const handleAddDueAgent = async () => {
    if (!selectedDueAgentService || !embarqueId) return;

    setIsAddingDueAgent(true);
    try {
      const rubro = selectedDueAgentService.rubroData ?? {};
      const servicio = selectedDueAgentService.servicioData ?? {};
      const metodo = selectedDueAgentService.metodoData ?? servicio.METODO ?? servicio.metodo ?? {};
      const metodoDetalles = firstDefined(metodo.DETALLES, metodo.detalles);

      await insertarCoordinacionGasto({
        embarque_id: Number(embarqueId),
        embarque_version: resolvedVersion ?? undefined,
        cod_rubro: toNumberOrFallback(
          firstDefined(rubro.COD_RUBRO, rubro.cod_rubro, selectedDueAgentService.codRubro),
          selectedDueAgentService.codRubro,
        ),
        gruporubro_nombre: firstDefined(
          rubro.NOMBRE_RUBRO,
          rubro.nombre_rubro,
          selectedDueAgentService.rubroNombre,
          selectedDueAgentService.nombre,
          "DUE AGENT",
        ),
        costo_rubro: toNumberOrFallback(firstDefined(metodo.COSTO, metodo.costo), 0),
        costo_grupo: toNumberOrFallback(firstDefined(metodo.COSTO, metodo.costo), 0),
        cod_servicio: toNumberOrFallback(
          firstDefined(servicio.COD_SERVICIO, servicio.cod_servicio, selectedDueAgentService.codServicio),
          selectedDueAgentService.codServicio,
        ),
        entidad_id: toNumberOrFallback(
          firstDefined(servicio.ENTIDAD_ID, servicio.entidad_id, selectedDueAgentService.entidadId),
          selectedDueAgentService.entidadId,
        ),
        venta_rubro: toNumberOrFallback(firstDefined(metodo.VENTA, metodo.venta), 0),
        venta_grupo: toNumberOrFallback(firstDefined(metodo.VENTA, metodo.venta), 0),
        cod_moneda_costo: toNumberOrFallback(firstDefined(metodo.COD_MONEDA_COSTO, metodo.cod_moneda_costo), Number(defaultMoneda)),
        cod_moneda_venta: toNumberOrFallback(firstDefined(metodo.COD_MONEDA_VENTA, metodo.cod_moneda_venta), Number(defaultMoneda)),
        cod_tipo_pago: toNumberOrFallback(selectedPagoType ?? tipoIdPagoCoordinacion, Number(defaultTipoPago)),
        cod_tipo_facturacion: toNumberOrFallback(
          firstDefined(servicio.SERVICIO_CLASIFICACION, servicio.servicio_clasificacion),
          1,
        ),
        cod_tipo_calculo: toNumberOrFallback(
          firstDefined(servicio.COD_TIPO_CALCULO, servicio.cod_tipo_calculo, selectedDueAgentService.codTipoCalculo),
          1,
        ),
        gasto_facturado: firstDefined(servicio.OBLIGATORIO, servicio.obligatorio, 0),
        cod_metodo: toNumberOrFallback(firstDefined(metodo.COD_METODO, metodo.cod_metodo), undefined),
        rate_costo: toNumberOrFallback(firstDefined(metodo.rate_costo, metodo.RATE_COSTO), undefined),
        rate_venta: toNumberOrFallback(firstDefined(metodo.rate_venta, metodo.RATE_VENTA), undefined),
        clasificacion: firstDefined(
          servicio.cod_clasificacion_carga,
          servicio.COD_CLASIFICACION_CARGA,
          selectedDueAgentService.codClasificacionCarga,
        ),
        json_calculo: metodoDetalles == null ? undefined : JSON.stringify(metodoDetalles),
      });
      await handleRefresh();
      setSelectedDueAgentService(null);
      setDueAgentServiceSearch("");
    } catch (error) {
      console.error("Error al añadir Due Agent:", error);
    } finally {
      setIsAddingDueAgent(false);
    }
  };

  const { data: entidades = [], isLoading: isLoadingEntidades } = useFetchEntidades(
    dueCarrierEntidadId ? { tipo_entidad: "PROVEEDOR", entidad_id: dueCarrierEntidadId } : { tipo_entidad: "PROVEEDOR" },
    { enabled: Boolean(dueCarrierEntidadId) },
  );

  useEffect(() => {
    onLoadingChange?.(
      isLoadingVersion ||
      isLoadingGastos ||
      isLoadingMonedas ||
      isLoadingServicios ||
      isLoadingCriterios ||
      isLoadingTiposPago ||
      isLoadingEntidades,
    );
  }, [
    isLoadingVersion,
    isLoadingGastos,
    isLoadingMonedas,
    isLoadingServicios,
    isLoadingCriterios,
    isLoadingTiposPago,
    isLoadingEntidades,
    onLoadingChange,
  ]);

  const entidadesMap = useMemo(() => {
    const map = new Map();
    entidades.forEach((e) => {
      const id = String(e.entidad_id ?? e.value ?? e.ENTIDAD_ID ?? e.id ?? "");
      const label = e.entidad_nombre ?? e.ENTIDAD_NOMBRE ?? e.label ?? "";
      if (id) map.set(id, label);
    });
    return map;
  }, [entidades]);

  const datos = useMemo(() => {
    if (!Array.isArray(gastos)) return [];
    return gastos.map((item) => {
      const codMonedaCosto = item?.cod_moneda_costo;
      const codMonedaVenta = item?.cod_moneda_venta;

      const monedaCosto = monedasMap.get(String(codMonedaCosto));
      const monedaVenta = monedasMap.get(String(codMonedaVenta));
      const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
      const servicio = serviciosMap.get(String(codServicio)) ?? {};
      const servicioNombre = servicio.label;
      const servicioSiglas = servicio.siglas;

      const codTipoPago = item?.cod_tipo_pago ?? item?.COD_TIPO_PAGO;
      const tipoPagoLabel = tipoPagoMap.get(String(codTipoPago)) ?? codTipoPago;

      const entidadId = item?.entidad_id ?? item?.ENTIDAD_ID ?? item?.codigo_entidad ?? item?.cod_proveedor ?? null;
      const entidadNombre =
        entidadId && entidadesMap.has(String(entidadId))
          ? entidadesMap.get(String(entidadId))
          : item?.entidad_nombre ?? item?.ENTIDAD_NOMBRE ?? String(entidadId ?? "");

      const o = {};
      Object.keys(item).forEach((d) => {
        o[d] = { color: undefined, bold: undefined };
      });

      return {
        ...item,
        entidad_id: entidadId,
        entidad_nombre: entidadNombre,
        moneda_costo_nombre: monedaCosto?.simbolo_moneda ?? monedaCosto?.nom_moneda ?? codMonedaCosto,
        moneda_venta_nombre: monedaVenta?.simbolo_moneda ?? monedaVenta?.nom_moneda ?? codMonedaVenta,
        servicio_nombre: servicioNombre ?? codServicio,
        servicio_siglas: servicioSiglas ?? "",
        cod_tipo_pago: codTipoPago,
        tipo_pago_label: tipoPagoLabel,
        rate_venta: item?.rate_venta ?? item?.RATE_VENTA ?? null,
        accionesDeTabla: {
          add: false,
          view: false,
          go: false,
          copy: false,
          paste: false,
          auth: false,
          edit: false,
          excel: false,
          pdf: false,
          download: false,
          delete: false,
        },
        propiedadesDeTabla: o,
      };
    });
  }, [gastos, monedasMap, serviciosMap, tipoPagoMap, entidadesMap]);

  const dueAgentItems = useMemo(
    () =>
      datos
        .filter((item) => String(item.entidad_id) === "13624")
        .map((item) => ({
          key: item.emb_gasto_id ?? item.id ?? item.key ?? `${item.entidad_id}-${item.servicio_nombre}`,
          seccion: item.gruporubro_nombre ?? null,
          nombre: item.servicio_siglas ?? item.servicio_nombre ?? "",
          nombreProveedor: item.entidad_nombre ?? "",
          monedaSimbolo: item.moneda_venta_nombre ?? "",
          codMoneda: item.cod_moneda_venta ?? item.codMoneda ?? item.cod_moneda_venta,
          costo: Number(item.costo_rubro ?? 0),
          valor: Number(item.venta_rubro ?? 0),
          cod_tipo_pago: item.cod_tipo_pago,
          tipo_pago_label: item.tipo_pago_label,
          detalles: [],
        })),
    [datos]
  );

  const dueCarrierItems = useMemo(
    () =>
      datos
        .filter((item) => String(item.entidad_id) !== "13624")
        .map((item) => ({
          key: item.emb_gasto_id ?? item.id ?? item.key ?? `${item.entidad_id}-${item.servicio_nombre}`,
          seccion: item.gruporubro_nombre ?? null,
          nombre: item.servicio_siglas ?? item.servicio_nombre ?? "",
          nombreProveedor: item.entidad_nombre ?? "",
          monedaSimbolo: item.moneda_venta_nombre ?? "",
          codMoneda: item.cod_moneda_venta ?? item.codMoneda ?? item.cod_moneda_venta,
          costo: Number(item.costo_rubro ?? 0),
          valor: Number(item.venta_rubro ?? 0),
          cod_tipo_pago: item.cod_tipo_pago,
          tipo_pago_label: item.tipo_pago_label,
          detalles: [],
        })),
    [datos]
  );

  const dueCarrierEntidadNombre = useMemo(() => {
    const nombres = datos
      .filter((item) => String(item.entidad_id) !== "13624")
      .map((item) => item.entidad_nombre)
      .filter(Boolean);

    return [...new Set(nombres)].join(" / ") || "Carrier";
  }, [datos]);

  return (
    <Box sx={{ p: 1, m: 0, width: "100%", minWidth: 0 }}>
      {mostrarAgregarServicio && (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 2, width: "100%", flexWrap: "nowrap", px: 1 }}>
        <Autocomplete
          size="small"
          sx={{ minWidth: 0, flex: "1 1 85%" }}
          value={selectedDueAgentService}
          inputValue={dueAgentServiceSearch}
          onInputChange={(_, value) => {
            setDueAgentServiceSearch(value);
          }}
          onChange={(_, value) => {
            setSelectedDueAgentService(value);
          }}
          options={dueAgentServiceOptions}
          isOptionEqualToValue={(option, value) => option.key === value?.key}
          getOptionLabel={(option) =>
            option
              ? `${option.nombre ?? ""}`.trim()
              : ""
          }
          filterOptions={(options, state) => getDueAgentServiceSearchState(options, state.inputValue).options}
          groupBy={(option) => option.rubroNombre ?? "Servicios"}
          noOptionsText={
            dueAgentServiceSearchState.needsMoreChars
              ? `Escribe al menos ${DUE_AGENT_SERVICE_MIN_SEARCH_LENGTH} caracteres`
              : "No se encontraron servicios"
          }
          openOnFocus
          autoHighlight
          clearOnBlur={false}
          selectOnFocus
          handleHomeEndKeys
          slotProps={{
            popper: {
              sx: { minWidth: 520 },
            },
            paper: {
              sx: {
                mt: 0.5,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 4,
                bgcolor: themeMode === "dark" ? "background.paper" : "background.default",
              },
            },
            listbox: {
              sx: {
                maxHeight: DUE_AGENT_SERVICE_LISTBOX_MAX_HEIGHT,
                py: 0.5,
                [`& .MuiAutocomplete-groupUl`]: {
                  padding: 0,
                },
              },
            },
          }}
          renderGroup={(params) => (
            <Box key={params.key} component="li" sx={{ listStyle: "none" }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 1.5,
                  py: 0.75,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  color: "text.secondary",
                  bgcolor: themeMode === "dark" ? "rgba(255,255,255,0.05)" : "grey.100",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                {params.group}
              </Typography>
              <Box component="ul" sx={{ m: 0, p: 0 }}>
                {params.children}
              </Box>
            </Box>
          )}
          renderOption={({ key, ...props }, option) => {
            return (
              <Box
                key={key}
                component="li"
                {...props}
                sx={{
                  alignItems: "flex-start",
                  py: 0.75,
                  px: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, width: "100%", minWidth: 0 }}>
                  <Box sx={{ minWidth: 0, pr: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                      {option.nombre ?? ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", whiteSpace: "normal", wordBreak: "break-word" }}>
                      {option.metodoDes || option.siglas || "Sin detalle"}
                    </Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0, textAlign: "right", minWidth: 92 }}>
                    <Typography variant="body1" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.15 }}>
                      {formatVentaDisplay(option.venta)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Servicios"
              placeholder="Buscar servicio"
              helperText={dueAgentServiceHelperText}
              autoComplete="off"
            />
          )}
        />
        <FormControl size="small" sx={{ width: 99, minWidth: 99, mt: "2px", alignSelf: "flex-start" }}>
          <InputLabel id="pago-type-label" shrink={Boolean(pagoTypeValue)}>
            Tipo de Pago
          </InputLabel>
          <Select
            labelId="pago-type-label"
            label="Tipo de Pago"
            value={pagoTypeValue ?? ""}
            onChange={(event) => setSelectedPagoType(Number(event.target.value))}
            notched={Boolean(pagoTypeValue)}
            disabled={isPagoTypeReadOnly}
          >
            {pagoTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          size="small"
          sx={{ mt: "2px", alignSelf: "flex-start" }}
          disabled={!selectedDueAgentService || !embarqueId || isAddingDueAgent || selectedPagoType == null}
          onClick={handleAddDueAgent}
        >
          {isAddingDueAgent ? "Añadiendo..." : "Añadir"}
        </Button>
      </Box>
      )}
      <Grid container spacing={2} sx={{ width: "100%", minWidth: 0 }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <TablaDue
            titulo="DUE AGENT"
            subtituloParte=""
            entidadNombre="CROPA, S.A."
            colorBarra="#104f9c"
            items={dueAgentItems}
            mostrarCodTipoPago={true}
            mostrarCosto={true}
            mostrarDetalle={false}
            mostrarCabecera={true}
            onRefresh={handleRefresh}
            refreshDisabled={!embarqueId}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <TablaDue
            titulo="DUE CARRIER"
            subtituloParte=""
            entidadNombre={dueCarrierEntidadNombre}
            colorBarra="#104f9c"
            items={dueCarrierItems}
            mostrarCodTipoPago={true}
            mostrarCosto={true}
            mostrarDetalle={false}
            mostrarCabecera={true}
            onRefresh={handleRefresh}
            refreshDisabled={!embarqueId}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

TablaGastosCoordinacion.propTypes = {
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  embarqueVersion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  embarqueData: PropTypes.object,
  onLoadingChange: PropTypes.func,
  mostrarAgregarServicio: PropTypes.bool,
};

export default TablaGastosCoordinacion;
