"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  monedas as monedasCatalogo,
  servicios as serviciosCatalogo,
  tipos,
} from "@/features/catalogos";
import { useCoordinacion } from "@/features/coordinaciones";
import { useFetchEntidades } from "@/features/entidades";
import {
  type CalcularTarifaParams,
  DUE_AGENT_ENTIDAD_ID,
  mapCriteriosConValor,
  type Rubro,
  useCalcularTarifa,
  useInsertarCoordinacionGasto,
  useListarCoordinacionGastos,
  useListarCoordinacionGastosCriterio,
  useObtenerUltimaVersionCoordinacionGastos,
} from "@/features/gastos";
import { logger } from "@/shared/lib/logger";
import { asNumber, asText, safeString } from "@/shared/lib/text";
import {
  buildDueAgentServiceOptions,
  buildHelperText,
  firstDefined,
  type GastoMapeado,
  mapGastoToDueItem,
  type ServiceOption,
  toNumberOrFallback,
} from "../lib/gastos-due";

export function useGastosCoordinacion(embarqueId: string | number | null | undefined) {
  const { data: coordinacion } = useCoordinacion(embarqueId ? Number(embarqueId) : undefined);

  const codEmpresa = coordinacion?.empresaId ?? null;
  const codCc = coordinacion?.centroId ?? null;
  const codTipoServicio = coordinacion?.id_servicio ?? null;
  const codTipoTransporte = coordinacion?.tipo_id_embarque ?? null;
  const entidadIdCli = coordinacion?.entidadIdCli ?? null;

  const {
    data: ultimaVersionData,
    isSuccess: versionLoaded,
    isLoading: isLoadingVersion,
  } = useObtenerUltimaVersionCoordinacionGastos(embarqueId ?? undefined);
  const embarqueVersion = ultimaVersionData?.embarque_version ?? null;

  const gastosEnabled = Boolean(embarqueId && versionLoaded && embarqueVersion);
  const { data: gastos = [], isLoading: isLoadingGastos } = useListarCoordinacionGastos({
    embarque_id: asNumber(embarqueId),
    embarque_version: asNumber(embarqueVersion),
    enabled: gastosEnabled,
  });
  const isLoading = Boolean(embarqueId) && (isLoadingVersion || (gastosEnabled && isLoadingGastos));

  const { data: monedas = [] } = monedasCatalogo.useLista({ es_operativa: true });
  const { data: servicios = [] } = serviciosCatalogo.useLista();
  const { data: tiposPago = [] } = tipos.useLista({ tipo_tabla: "PAGO" });
  const { data: entidades = [] } = useFetchEntidades(
    { tipo_entidad: "PROVEEDOR" },
    { enabled: Boolean(embarqueId) },
  );

  const { data: criteriosRaw = [], isSuccess: criteriosLoaded } =
    useListarCoordinacionGastosCriterio({
      embarque_id: embarqueId ?? undefined,
      embarque_version: embarqueVersion,
      enabled: Boolean(embarqueId && versionLoaded),
    });

  const criteriosMap = mapCriteriosConValor(criteriosRaw, embarqueId ?? undefined);

  const codTarifaplantilla = criteriosMap?.cod_tarifaplantilla ?? 0;
  const codProveedor = 13624;
  const calcularTarifaParams: CalcularTarifaParams = {
    cod_tarifaplantilla: codTarifaplantilla,
    cod_empresa: codEmpresa,
    cod_cc: codCc,
    cod_tipo_servicio: codTipoServicio,
    cod_tipo_transporte: codTipoTransporte,
    entidad_id: entidadIdCli,
    cod_proveedor: codProveedor,
    ...criteriosMap,
  };

  const { data: tarifaRubros = [] } = useCalcularTarifa(calcularTarifaParams, {
    enabled: Boolean(
      codEmpresa &&
        codCc &&
        codTipoServicio &&
        codTipoTransporte &&
        entidadIdCli &&
        embarqueId &&
        versionLoaded &&
        criteriosLoaded,
    ),
  });

  const monedasMap = (() => {
    const map = new Map<string, (typeof monedas)[number]>();
    monedas.forEach((m) => {
      map.set(String(m.cod_moneda), m);
    });
    return map;
  })();

  const serviciosMap = (() => {
    const map = new Map<string, { label: string; siglas: string }>();
    servicios.forEach((s) => {
      const key = safeString(s.value ?? s.cod_servicio);
      const label = s.label ?? s.descripcion ?? "";
      const siglas = s.siglas ?? "";
      map.set(key, { label, siglas });
    });
    return map;
  })();

  const tipoPagoMap = (() => {
    const map = new Map<string, string>();
    tiposPago.forEach((t) => {
      const tipoValue = toNumberOrFallback(firstDefined(t.value, t.codTipo), null);
      const tipoLabel = String(firstDefined(t.label, t.nomTipo, ""));
      if (tipoValue != null) map.set(String(tipoValue), tipoLabel);
    });
    return map;
  })();

  const entidadesMap = (() => {
    const map = new Map<string, string>();
    entidades.forEach((e) => {
      const id = asText(e.entidad_id);
      const label = e.entidad_nombre ?? "";
      if (id) map.set(id, label);
    });
    return map;
  })();

  const pagoTypeOptions = tiposPago
    .map((tipo) => ({
      value: toNumberOrFallback(firstDefined(tipo.value, tipo.codTipo), null),
      label: String(firstDefined(tipo.label, tipo.nomTipo, "")).trim(),
    }))
    .filter((t): t is { value: number; label: string } => t.value != null && t.value !== 131);

  const [selectedDueAgentService, setSelectedDueAgentService] = useState<ServiceOption | null>(
    null,
  );
  const [dueAgentServiceSearch, setDueAgentServiceSearch] = useState("");
  const [selectedPagoType, setSelectedPagoType] = useState<number | null>(null);
  const [isAddingDueAgent, setIsAddingDueAgent] = useState(false);

  const queryClient = useQueryClient();

  const dueAgentServiceOptions = buildDueAgentServiceOptions(tarifaRubros as Rubro[], servicios, {
    codEmpresa,
    codCc,
    codTipoServicio,
    codTipoTransporte,
  });

  const dueAgentServiceHelperText = buildHelperText(dueAgentServiceSearch, dueAgentServiceOptions);

  const handleRefresh = async () => {
    if (!embarqueId) return;
    await queryClient.invalidateQueries({
      queryKey: ["ultima-version-coordinacion-gastos", embarqueId],
    });
    await queryClient.invalidateQueries({ queryKey: ["coordinacion-gastos", embarqueId] });
    await queryClient.invalidateQueries({
      queryKey: ["listar-coordinacion-gastos-criterio", embarqueId],
    });
    await queryClient.invalidateQueries({ queryKey: ["calcular-tarifa"] });
  };

  const insertarGasto = useInsertarCoordinacionGasto();

  const tipoIdPagoCoordinacion = toNumberOrFallback(
    coordinacion?.tipoPago ?? coordinacion?.tipo_id_pago,
    null,
  );
  const isPagoTypeReadOnly = tipoIdPagoCoordinacion === 127 || tipoIdPagoCoordinacion === 128;

  const handleAddDueAgent = async () => {
    if (!selectedDueAgentService || !embarqueId) return;

    setIsAddingDueAgent(true);
    try {
      const rubro = selectedDueAgentService.rubroData ?? {};
      const metodo = selectedDueAgentService.metodoData ?? {};
      const metodoDetalles = firstDefined(metodo.DETALLES, metodo.detalles);

      const defaultMoneda = monedas[0]?.cod_moneda ?? 1;
      const defaultTipoPagoVal =
        toNumberOrFallback(firstDefined(tiposPago[0]?.value, tiposPago[0]?.codTipo), 131) ?? 131;

      await insertarGasto.mutateAsync({
        embarque_id: Number(embarqueId),
        embarque_version: embarqueVersion ?? 0,
        cod_rubro: toNumberOrFallback(
          rubro.codRubro ?? selectedDueAgentService.codRubro,
          selectedDueAgentService.codRubro,
        ),
        gruporubro_nombre: firstDefined(
          rubro.nombreRubro,
          selectedDueAgentService.rubroNombre,
          selectedDueAgentService.nombre,
          "DUE AGENT",
        ),
        costo_rubro: toNumberOrFallback(firstDefined(metodo.COSTO, metodo.costo), 0),
        costo_grupo: toNumberOrFallback(firstDefined(metodo.COSTO, metodo.costo), 0),
        cod_servicio: toNumberOrFallback(
          selectedDueAgentService.codServicio,
          selectedDueAgentService.codServicio,
        ),
        entidad_id: toNumberOrFallback(
          selectedDueAgentService.entidadId,
          selectedDueAgentService.entidadId,
        ),
        venta_rubro: toNumberOrFallback(firstDefined(metodo.VENTA, metodo.venta), 0),
        venta_grupo: toNumberOrFallback(firstDefined(metodo.VENTA, metodo.venta), 0),
        cod_moneda_costo: toNumberOrFallback(
          firstDefined(metodo.COD_MONEDA_COSTO, metodo.cod_moneda_costo),
          Number(defaultMoneda),
        ),
        cod_moneda_venta: toNumberOrFallback(
          firstDefined(metodo.COD_MONEDA_VENTA, metodo.cod_moneda_venta),
          Number(defaultMoneda),
        ),
        cod_tipo_pago: toNumberOrFallback(
          selectedPagoType ?? tipoIdPagoCoordinacion,
          Number(defaultTipoPagoVal),
        ),
        cod_tipo_facturacion: null,
        cod_tipo_calculo: toNumberOrFallback(selectedDueAgentService.codTipoCalculo, 1),
        gasto_facturado: 0,
        cod_metodo: toNumberOrFallback(firstDefined(metodo.COD_METODO, metodo.cod_metodo)),
        rate_costo: toNumberOrFallback(firstDefined(metodo.rate_costo, metodo.RATE_COSTO)),
        rate_venta: toNumberOrFallback(firstDefined(metodo.rate_venta, metodo.RATE_VENTA)),
        clasificacion: selectedDueAgentService.codClasificacionCarga,
        json_calculo: metodoDetalles == null ? undefined : JSON.stringify(metodoDetalles),
      });

      await handleRefresh();
      setSelectedDueAgentService(null);
      setDueAgentServiceSearch("");
    } catch (error) {
      logger.error("Error al añadir Due Agent:", error);
    } finally {
      setIsAddingDueAgent(false);
    }
  };

  useEffect(() => {
    if (tipoIdPagoCoordinacion === 127 || tipoIdPagoCoordinacion === 128) {
      setSelectedPagoType(tipoIdPagoCoordinacion);
      return;
    }
    if (tipoIdPagoCoordinacion === 131) {
      setSelectedPagoType((currentValue) =>
        pagoTypeOptions.some((o) => o.value === currentValue) ? currentValue : null,
      );
    }
  }, [pagoTypeOptions, tipoIdPagoCoordinacion]);

  const datos: GastoMapeado[] = (() => {
    if (!Array.isArray(gastos)) return [];
    return gastos.map((item): GastoMapeado => {
      const monedaCosto = monedasMap.get(String(item.codMonedaCosto));
      const monedaVenta = monedasMap.get(String(item.codMonedaVenta));
      const servicio = serviciosMap.get(String(item.codServicio)) ?? {
        label: asText(item.codServicio),
        siglas: "",
      };
      const tipoPagoLabel = tipoPagoMap.get(String(item.codTipoPago)) ?? item.codTipoPago;
      const entidadNombre = entidadesMap.get(asText(item.entidadId)) ?? asText(item.entidadId);

      return {
        ...item,
        entidad_nombre: entidadNombre,
        moneda_costo_nombre:
          monedaCosto?.simbolo_moneda ?? monedaCosto?.nom_moneda ?? item.codMonedaCosto,
        moneda_venta_nombre:
          monedaVenta?.simbolo_moneda ?? monedaVenta?.nom_moneda ?? item.codMonedaVenta,
        servicio_nombre: servicio.label ?? asText(item.codServicio),
        servicio_siglas: servicio.siglas ?? item.servicioSiglas ?? "",
        tipo_pago_label: tipoPagoLabel,
      };
    });
  })();

  const dueAgentItems = datos
    .filter((item) => String(item.entidadId) === DUE_AGENT_ENTIDAD_ID)
    .map(mapGastoToDueItem);

  const dueCarrierItems = datos
    .filter((item) => String(item.entidadId) !== DUE_AGENT_ENTIDAD_ID)
    .map(mapGastoToDueItem);

  const dueCarrierEntidadNombre = (() => {
    const nombres = datos
      .filter((item) => String(item.entidadId) !== DUE_AGENT_ENTIDAD_ID)
      .map((item) => item.entidad_nombre)
      .filter(Boolean);
    return [...new Set(nombres)].join(" / ") || "Carrier";
  })();

  return {
    isLoading,
    dueAgentItems,
    dueCarrierItems,
    dueCarrierEntidadNombre,
    dueAgentServiceOptions,
    dueAgentServiceHelperText,
    selectedDueAgentService,
    setSelectedDueAgentService,
    dueAgentServiceSearch,
    setDueAgentServiceSearch,
    selectedPagoType,
    setSelectedPagoType,
    pagoTypeOptions,
    isPagoTypeReadOnly,
    isAddingDueAgent,
    handleAddDueAgent,
    handleRefresh,
  };
}
