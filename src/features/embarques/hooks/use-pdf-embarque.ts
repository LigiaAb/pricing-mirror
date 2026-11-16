"use client";

import { useState } from "react";
import {
  type PuntoEnlace,
  puntosEnlace as puntosEnlaceCatalogo,
  servicios as serviciosCatalogo,
  tipos,
} from "@/features/catalogos";
import {
  useCoordinacion,
  useCoordinacionCargas,
  useCoordinacionLegs,
} from "@/features/coordinaciones";
import { useFetchGuiasCoordinacion } from "@/features/correlativos";
import generarPdf from "@/features/embarques/lib/pdf-generator-embarques";
import { detectTransportMode } from "@/features/embarques/lib/pdf-info-helpers";
import {
  useEntidad,
  useFetchEntidadContacto,
  useFetchEntidadesDireccion,
  useFetchEntidadIdentificacion,
} from "@/features/entidades";
import {
  useListarCoordinacionGastos,
  useObtenerUltimaVersionCoordinacionGastos,
} from "@/features/gastos";
import { logger } from "@/shared/lib/logger";
import { asText, safeString } from "@/shared/lib/text";

export interface UsePdfEmbarqueInputs {
  embarque_id: number | null;
  isDraft?: boolean;
}

export function usePdfEmbarque(inputs: UsePdfEmbarqueInputs) {
  const { embarque_id, isDraft: draftProp } = inputs;

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: embarqueData = null } = useCoordinacion(embarque_id ?? undefined);
  const { data: cargas = [] } = useCoordinacionCargas(
    embarque_id ? String(embarque_id) : undefined,
  );

  const { data: versionData } = useObtenerUltimaVersionCoordinacionGastos(embarque_id ?? undefined);
  const embarqueVersion = versionData?.embarque_version ?? null;

  const gastosParams = {
    embarque_id: Number(embarque_id) || 0,
    embarque_version: Number(embarqueVersion) || 0,
    enabled: Boolean(embarque_id && versionData),
  };

  const { data: gastos = [] } = useListarCoordinacionGastos(gastosParams);

  const { data: guiasData = [] } = useFetchGuiasCoordinacion(
    { embarque_id: Number(embarque_id) },
    { enabled: Boolean(embarque_id) },
  );
  const correlativoGuia = guiasData[0]?.correlativoGuia ?? "";
  const correlativoGuiaMaster = guiasData[0]?.correlativoGuiaMaster ?? "";

  const codFile = embarqueData?.cod_file ?? "";
  const embarqueId = Number(embarqueData?.embarqueId ?? 0);
  const codCc = Number(embarqueData?.centroId ?? 16) || 16;
  const codEmpresa = Number(embarqueData?.empresaId ?? 1) || 1;

  const { data: legsData = [] } = useCoordinacionLegs(
    embarqueId > 0 ? embarqueId : undefined,
    codCc || undefined,
    codEmpresa || undefined,
  );

  const { data: servicios = [] } = serviciosCatalogo.useLista({});
  const { data: puntosEnlace = [] } = puntosEnlaceCatalogo.useLista({});
  const { data: tiposPago = [] } = tipos.useLista({ tipo_tabla: "PAGO" });

  const entityIdShipper = Number(embarqueData?.entidadIdShipper ?? 0);
  const entityIdConsignatario = Number(embarqueData?.entidadIdConsignatario ?? 0);

  const shipperEntityEnabled = entityIdShipper > 0;
  const consignatarioEntityEnabled = entityIdConsignatario > 0;

  const { data: shipperEntity } = useEntidad(entityIdShipper, "shipper", {
    enabled: shipperEntityEnabled,
  });
  const { data: consignatarioEntity } = useEntidad(entityIdConsignatario, "consignatario", {
    enabled: consignatarioEntityEnabled,
  });

  const shipperCodTipo = shipperEntity?.cod_tipo ? Number(shipperEntity.cod_tipo) : 0;
  const consignatarioCodTipo = consignatarioEntity?.cod_tipo
    ? Number(consignatarioEntity.cod_tipo)
    : 0;

  const detailEnabledShipper = Boolean(shipperCodTipo && entityIdShipper);
  const detailEnabledConsignatario = Boolean(consignatarioCodTipo && entityIdConsignatario);

  const { data: shipperContactResp } = useFetchEntidadContacto(
    { cod_tipo: shipperCodTipo, entidad_id: entityIdShipper },
    { enabled: detailEnabledShipper },
  );
  const { data: consignatarioContactResp } = useFetchEntidadContacto(
    { cod_tipo: consignatarioCodTipo, entidad_id: entityIdConsignatario },
    { enabled: detailEnabledConsignatario },
  );

  const { data: shipperDirecciones = [] } = useFetchEntidadesDireccion(
    { cod_tipo: shipperCodTipo, entidad_id: entityIdShipper },
    { enabled: detailEnabledShipper },
  );
  const { data: consignatarioDirecciones = [] } = useFetchEntidadesDireccion(
    { cod_tipo: consignatarioCodTipo, entidad_id: entityIdConsignatario },
    { enabled: detailEnabledConsignatario },
  );

  const { data: consignatarioIdentResp } = useFetchEntidadIdentificacion(
    {
      cod_tipo: consignatarioCodTipo,
      entidad_id: entityIdConsignatario,
      cod_identificacion: 49,
      cod_estado: 1,
    },
    { enabled: detailEnabledConsignatario },
  );

  const shipperContact = shipperContactResp?.data?.[0];
  const consignatarioContact = consignatarioContactResp?.data?.[0];

  const shipperAddress = (() => {
    const dirs = shipperDirecciones;
    const delivery = dirs.find(
      (d) =>
        safeString(d.tipo_descripcion).toLowerCase() === "entrega y recoleccion" ||
        d.cod_tipo === 145,
    );
    return delivery?.direccion ?? dirs[0]?.direccion ?? "";
  })();
  const consignatarioAddress = (() => {
    const dirs = consignatarioDirecciones;
    const delivery = dirs.find(
      (d) =>
        safeString(d.tipo_descripcion).toLowerCase() === "entrega y recoleccion" ||
        d.cod_tipo === 145,
    );
    return delivery?.direccion ?? dirs[0]?.direccion ?? "";
  })();

  const consignatarioNit = consignatarioIdentResp?.data?.[0]?.entidadidentificacion_numero ?? "";

  const servicioSiglasMap = (() => {
    const map = new Map<string, string>();
    for (const s of servicios) {
      const key = safeString(s.value ?? s.cod_servicio);
      const siglas = s.siglas ?? "";
      if (key) map.set(key, String(siglas));
    }
    return map;
  })();

  const puntoEnlaceMap = (() => {
    const map = new Map<number, PuntoEnlace>();
    for (const pe of puntosEnlace) {
      if (pe.cod_puntoenlace != null) {
        map.set(Number(pe.cod_puntoenlace), pe);
      }
    }
    return map;
  })();

  const buildPdfPayload = (): Parameters<typeof generarPdf>[0] => {
    const shipperName = embarqueData?.entidadShipperNombre ?? "";
    const pdfShipperAddress = shipperAddress || (embarqueData?.direccionRecoleccion ?? "");
    const pdfShipperPhone =
      shipperContact?.entidadcontacto_telefono || (embarqueData?.telefono ?? "");
    const pdfShipperEmail = shipperContact?.entidadcontacto_email || (embarqueData?.email ?? "");
    const consigneeName = embarqueData?.entidadConsignatarioNombre ?? "";
    const pdfConsigneeAddress = consignatarioAddress || (embarqueData?.consDireccion ?? "");
    const pdfConsigneePhone =
      consignatarioContact?.entidadcontacto_telefono || (embarqueData?.consTelefono ?? "");
    const pdfConsigneeAccount = consignatarioNit || (embarqueData?.consIdentificacionNumero ?? "");

    const items = cargas.map((item) => ({
      pieces: item.bultos,
      noPieces: item.bultos,
      // Unidad de medida de la carga como dato del item (§7.D.4).
      pesoUnidad: safeString(item.tipoDescripcion || item.tipoUnidadMedidaId).trim() || "Kg",
      volumen: Number(item.volumen ?? item.metrosCubicos ?? 0) || 0,
      grossWeight: Number(item.peso ?? 0) || 0,
      chargeableWeight: (() => {
        const cw = Number(item.cw ?? item.chargeableWeight ?? 0);
        if (Number.isFinite(cw) && cw > 0) return cw;
        return Number(item.volumen ?? item.metrosCubicos ?? 0) || 0;
      })(),
      total: item.valor ?? item.total ?? 0,
      descripcion: item.descripcionCarga ?? item.natureOfGoods ?? "",
      dimensiones: (() => {
        const l = item.largo ?? 0;
        const a = item.ancho ?? 0;
        const h = item.alto ?? 0;
        return l > 0 && a > 0 && h > 0 ? `${l} x ${a} x ${h}` : "";
      })(),
    }));

    const resolvedRutas = (() => {
      if (legsData.length > 0) {
        return legsData.map((r) => {
          const codOrigen = Number(r.puntoenlaceIdOrigen ?? "");
          const codDestino = Number(r.puntoenlaceIdDestino ?? "");
          const peOrigen = Number.isFinite(codOrigen) ? puntoEnlaceMap.get(codOrigen) : undefined;
          const peDestino = Number.isFinite(codDestino)
            ? puntoEnlaceMap.get(codDestino)
            : undefined;
          return {
            origenCodigo: peOrigen?.codigo ?? (codOrigen ? String(codOrigen) : ""),
            destinoCodigo: peDestino?.codigo ?? (codDestino ? String(codDestino) : ""),
            origenNombre: peOrigen?.nombre ?? r.puntoenlaceNombreOrigen ?? "",
            destinoNombre: peDestino?.nombre ?? r.puntoenlaceNombreDestino ?? "",
            entidadNombreProv: r.entidadNombreProv ?? "",
            flightNumber: r.flightNumber ?? "",
          };
        });
      }

      try {
        const rawJson = embarqueData?.jsonDatosOpcionales ?? null;
        if (rawJson) {
          const parsed = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
          if (Array.isArray(parsed?.rutas)) {
            return (parsed.rutas as Record<string, unknown>[]).map((r) => ({
              origenCodigo: asText(r.origenCodigo ?? ""),
              destinoCodigo: asText(r.destinoCodigo ?? ""),
              origenNombre: asText(r.puntoEnlaceOrigen ?? r.origenNombre ?? ""),
              destinoNombre: asText(r.puntoEnlaceDestino ?? r.destinoNombre ?? ""),
              entidadNombreProv: asText(r.entidadNombreProv ?? r.entidad_nombre_prov ?? ""),
              flightNumber: asText(r.flightNumber ?? r.flight_number ?? ""),
            }));
          }
        }
      } catch (e) {
        logger.error("Error mapeando datos de ruta:", e);
      }
      return [];
    })();

    const firstLeg = resolvedRutas[0];
    const lastLeg = resolvedRutas.at(-1);
    const handlingInformation = embarqueData?.observaciones ?? "";
    const tipoIdPago = embarqueData?.tipo_id_pago ?? embarqueData?.tipoPago ?? "";
    const tipoPagoInfo = tiposPago.find((t) => safeString(t.value) === safeString(tipoIdPago));
    const tipoPagoLabel = safeString(tipoPagoInfo?.label).toUpperCase();
    const chgsPPD = tipoPagoLabel.includes("PREPAID");
    const chgsCOLL = tipoPagoLabel.includes("COLLECT");

    const afRateCosto: number | null = (() => {
      if (!Array.isArray(gastos) || gastos.length === 0) return null;
      const afGasto = gastos.find((item) => {
        const siglas =
          servicioSiglasMap.get(safeString(item.codServicio)) ?? item.servicioSiglas ?? "";
        return safeString(siglas).trim().toUpperCase() === "A/F";
      });
      if (!afGasto) return null;
      const val = afGasto.rateVenta;
      return val !== null && val !== undefined ? Number(val) : null;
    })();

    const afTipoPagoCodigo: number | null = (() => {
      if (!Array.isArray(gastos) || gastos.length === 0) return null;
      const afGasto = gastos.find((item) => item.codRubro === 11);
      if (!afGasto) return null;
      return afGasto.codTipoPago ?? null;
    })();

    const taxFromGastos = (() => {
      if (!Array.isArray(gastos) || gastos.length === 0) return { venta: 0, tipoPago: "" };
      const ivaGasto = gastos.find((item) => item.codRubro === 133);
      if (!ivaGasto) return { venta: 0, tipoPago: "" };
      const venta = ivaGasto.ventaRubro;
      const codTipoPago = ivaGasto.codTipoPago;
      const tipoPagoData = tiposPago.find((t) => safeString(t.value) === safeString(codTipoPago));
      return {
        venta: Number(venta) || 0,
        tipoPago: safeString(tipoPagoData?.label).toUpperCase(),
      };
    })();

    const DUE_AGENT_ENTIDAD_ID = 13624;
    const gastosParaPdf = Array.isArray(gastos)
      ? gastos
          .map((item) => {
            const siglas =
              servicioSiglasMap.get(safeString(item.codServicio)) ?? item.servicioSiglas ?? "";
            const normalSiglas = safeString(siglas).trim().toUpperCase();
            if (normalSiglas === "A/F" || normalSiglas === "") return null;
            const venta = item.ventaRubro ?? 0;
            const entidadId = item.entidadId;
            const codTipoPago = item.codTipoPago;
            const tipoPagoData = tiposPago.find(
              (t) => safeString(t.value) === safeString(codTipoPago),
            );
            const tipoPago = safeString(tipoPagoData?.label).toUpperCase();
            return {
              siglas: safeString(siglas).trim(),
              venta: Number(venta) || 0,
              isDueAgent: entidadId === DUE_AGENT_ENTIDAD_ID,
              isDueCarrier: entidadId !== null && entidadId !== DUE_AGENT_ENTIDAD_ID,
              tipoPago,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      : [];

    const otherChargesFromGastos = (() => {
      if (!Array.isArray(gastos) || gastos.length === 0) return "";
      return gastos
        .map((item) => {
          const siglas =
            servicioSiglasMap.get(String(item.codServicio)) ?? item.servicioSiglas ?? "";
          if (String(siglas).trim().toUpperCase() === "A/F") return "";
          const venta = item.ventaRubro;
          const parts: string[] = [];
          if (siglas) parts.push(String(siglas));
          if (venta != null) parts.push(String(venta));
          return parts.join(" ").trim();
        })
        .filter(Boolean)
        .join("\n");
    })();

    const incoterm = embarqueData?.incoterm ?? "";
    const _isDraftValue = draftProp ?? !correlativoGuiaMaster.trim();

    return {
      transportMode: detectTransportMode(embarqueData?.tipoEmbarque),
      shipperName: shipperName || "No especificado",
      shipperAddress: pdfShipperAddress,
      shipperPhone: pdfShipperPhone,
      shipperEmail: pdfShipperEmail,
      consigneeName: consigneeName || "No especificado",
      consigneeAddress: pdfConsigneeAddress,
      consigneePhone: pdfConsigneePhone,
      consigneeAccount: pdfConsigneeAccount,
      items,
      rutas: resolvedRutas,
      enlaceOrigen: firstLeg?.origenNombre
        ? String(firstLeg.origenNombre)
        : (embarqueData?.puntoEnlaceOrigen ?? ""),
      enlaceDestino: lastLeg?.destinoNombre
        ? String(lastLeg.destinoNombre)
        : (embarqueData?.puntoEnlaceDestino ?? ""),
      airportDepartureRouting: embarqueData?.puntoEnlaceOrigen ?? "",
      handlingInformation: String(handlingInformation),
      currency: "USD",
      declaredValueCarriage: "",
      declaredValueCustoms: "",
      chgsPPD,
      chgsCOLL,
      wtValPPD: chgsPPD,
      wtValCOLL: chgsCOLL,
      ...(afRateCosto == null ? {} : { afRateCosto }),
      ...(afTipoPagoCodigo == null ? {} : { afTipoPagoCodigo }),
      valuationCharge: "",
      tax: taxFromGastos.venta,
      taxTipoPago: taxFromGastos.tipoPago,
      gastosParaPdf,
      otherCharges: otherChargesFromGastos,
      referenceNumber: codFile || "",
      correlativoGuia,
      correlativoGuiaMaster,
      incoterm,
      executedAtPlace: "GUATEMALA",
      executedOnDate: new Date(),
    };
  };

  const handleDownloadPdf = async (copias?: string[]) => {
    if (!embarque_id) return;

    setIsGeneratingPdf(true);
    const previewTab = window.open("about:blank", "_blank");
    if (previewTab) {
      previewTab.document.title = "Generando PDF...";
      previewTab.document.body.innerHTML =
        "<p style='font-family: Arial, sans-serif; padding: 16px;'>Generando PDF...</p>";
    }

    try {
      const payload = buildPdfPayload();
      if (copias && copias.length > 0) {
        payload.copias = copias;
      }
      const isDraftValue = draftProp ?? !correlativoGuiaMaster.trim();
      const result = await generarPdf(payload, isDraftValue, "blob");
      const pdfUrl = URL.createObjectURL(result);

      if (previewTab) {
        previewTab.location.replace(pdfUrl);
      } else {
        window.open(pdfUrl, "_blank");
      }

      setTimeout(() => {
        try {
          URL.revokeObjectURL(pdfUrl);
        } catch (error) {
          logger.debug("Error liberando URL del PDF de embarque:", error);
        }
      }, 10000);
    } catch (error) {
      if (previewTab) previewTab.close();
      logger.error("Error al generar PDF de embarque:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadHousePdf = async (copias?: string[]) => {
    if (!embarque_id) return;
    setIsGeneratingPdf(true);
    const previewTab = window.open("about:blank", "_blank");
    if (previewTab) {
      previewTab.document.title = "Generando PDF...";
      previewTab.document.body.innerHTML =
        "<p style='font-family: Arial, sans-serif; padding: 16px;'>Generando PDF...</p>";
    }
    try {
      const payload = buildPdfPayload();
      if (copias && copias.length > 0) {
        payload.copias = copias;
      }
      const result = await generarPdf(payload, false, "blob");
      const pdfUrl = URL.createObjectURL(result);
      if (previewTab) {
        previewTab.location.replace(pdfUrl);
      } else {
        window.open(pdfUrl, "_blank");
      }
      setTimeout(() => {
        try {
          URL.revokeObjectURL(pdfUrl);
        } catch (error) {
          logger.debug("Error liberando URL del PDF de embarque:", error);
        }
      }, 10000);
    } catch (error) {
      if (previewTab) previewTab.close();
      logger.error("Error al generar PDF de embarque:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return { handleDownloadPdf, handleDownloadHousePdf, isGeneratingPdf };
}
