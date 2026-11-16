"use client";

import { Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  paises as paisesCatalogo,
  puntosEnlace as puntosEnlaceCatalogo,
} from "@/features/catalogos";
import {
  useActualizarCoordinacionLegs,
  useCoordinacion,
  useCoordinacionLegs,
  useInsertarCoordinacionLegs,
} from "@/features/coordinaciones";
import { useEmbarqueContext } from "@/features/embarques/components/context";
import { useFetchEntidadConfiguracion } from "@/features/entidades";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Button } from "@/shared/components/ui/button";
import { logger } from "@/shared/lib/logger";
import { asText, safeString } from "@/shared/lib/text";
import { TablaDue } from "../tablas/tabla-due";
import { RutaDialog } from "./ruta-dialog";

interface RutasSectionProps {
  onValidityChange?: (valid: boolean) => void;
  onLoadingChange?: ((loading: boolean) => void) | undefined;
  /** CTS (G5): el asesor no agrega rutas desde aquí — sólo las consulta. */
  mostrarBotonAgregar?: boolean;
  /** CTS (G5): sin rutas no bloquea el paso (a diferencia de la vista pública). */
  required?: boolean;
}

const FORM_EMPTY = {
  embLegsId: null,
  codEntidadProv: "",
  codPaisOrigen: "",
  puertoIdOrigen: "",
  codPaisDestino: "",
  puertoIdDestino: "",
  flightNumber: "",
  fechaSalida: "",
  fechaLlegada: "",
  costoEstimado: 0,
  costoReal: 0,
};

const parseDecimalValue = (value: unknown): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
};

export function RutasSection({
  onValidityChange,
  onLoadingChange,
  mostrarBotonAgregar = true,
  required = true,
}: Readonly<RutasSectionProps>) {
  const { embarque_id } = useEmbarqueContext();
  const { data: embarqueData } = useCoordinacion(embarque_id);

  const embarqueId = (embarqueData?.embarqueId ?? null) as number | null;
  const codEmpresa = (embarqueData?.empresaId ?? 1) as number;
  const codCc = (embarqueData?.centroId ?? 16) as number;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLeg, setEditingLeg] = useState<Record<string, unknown> | null>(null);

  const {
    data: legs = [],
    isLoading: isLoadingLegs,
    refetch: refetchLegs,
  } = useCoordinacionLegs(embarqueId ?? undefined, codCc, codEmpresa);
  const { mutateAsync: insertarLeg } = useInsertarCoordinacionLegs({
    meta: { successMessage: "Ruta agregada correctamente" },
  });
  const { mutateAsync: actualizarLeg } = useActualizarCoordinacionLegs({
    meta: { successMessage: "Ruta actualizada correctamente" },
  });

  const { data: aerolineas = [], isLoading: isLoadingAerolineas } = useFetchEntidadConfiguracion({
    configuracion_id: 8,
  });
  const { data: paises = [], isLoading: isLoadingPaises } = paisesCatalogo.useLista();
  const { data: puntosEnlace = [], isLoading: isLoadingPuntosEnlace } =
    puntosEnlaceCatalogo.useLista();

  const aerolineasOptions = aerolineas.map((a) => ({
    value: asText(a.entidadId),
    label: a.entidadNombre ?? a.configuracionDescripcion,
  }));

  const paisesOptions = paises.map((p) => ({ value: String(p.cod_pais), label: p.nombre_pais }));

  const puntosEnlaceOptions = puntosEnlace.map((p) => ({
    value: String(p.cod_puntoenlace),
    label: p.label ?? `${p.codigo} - ${p.nombre}`,
    cod_pais: String(p.cod_pais),
  }));

  const legsRef = useRef(legs);
  useEffect(() => {
    legsRef.current = legs;
  }, [legs]);

  const filterPuntosEnlaceByPais = (paisValue: unknown) => {
    if (!paisValue) return [];
    const codPais =
      paisValue && typeof paisValue === "object"
        ? (paisValue as Record<string, string>).value
        : paisValue;
    return puntosEnlaceOptions.filter((p) => safeString(p.cod_pais) === safeString(codPais));
  };

  useEffect(() => {
    onValidityChange?.(!required || legs.length > 0);
  }, [legs, onValidityChange, required]);

  useEffect(() => {
    onLoadingChange?.(
      !embarqueData ||
        isLoadingLegs ||
        isLoadingAerolineas ||
        isLoadingPaises ||
        isLoadingPuntosEnlace,
    );
  }, [
    embarqueData,
    isLoadingLegs,
    isLoadingAerolineas,
    isLoadingPaises,
    isLoadingPuntosEnlace,
    onLoadingChange,
  ]);

  const tipoIdEmbarque = (embarqueData?.tipo_id_embarque ?? null) as number | null;

  const tipoIdCarga = (embarqueData?.tipo_id_carga ?? null) as number | null;

  const codServicioDefault = (embarqueData?.id_servicio ?? 1) as number;

  const buildPayload = (row: Record<string, unknown>) => {
    const currentCodFile = (row.cod_file ??
      row.codFile ??
      legsRef.current.find((leg) => String(leg.embLegsId) === String(row.embLegsId))?.codFile ??
      embarqueData?.cod_file) as string;

    return {
      embarque_id: embarqueId,
      emb_legs_id: row.embLegsId ?? undefined,
      cod_file: currentCodFile,
      cod_tipo_transporte: tipoIdEmbarque ?? row.codTipoTransporte,
      cod_entidad_prov: row.codEntidadProv ?? row.entidadIdProvTrans ?? 1,
      cod_pais_origen:
        row.codPaisOrigen && typeof row.codPaisOrigen === "object"
          ? ((row.codPaisOrigen as Record<string, string>).value ?? row.codPaisOrigen)
          : (row.codPaisOrigen ?? row.paisIdOrigen),
      cod_pais_destino:
        row.codPaisDestino && typeof row.codPaisDestino === "object"
          ? ((row.codPaisDestino as Record<string, string>).value ?? row.codPaisDestino)
          : (row.codPaisDestino ?? row.paisIdDestino),
      puerto_id_origen: row.puertoIdOrigen ?? row.puntoenlaceIdOrigen,
      puerto_id_destino: row.puertoIdDestino ?? row.puntoenlaceIdDestino,
      cod_servicio: row.codServicio ?? row.cod_servicio ?? codServicioDefault,
      cod_tipo_carga: tipoIdCarga ?? row.codTipoCarga,
      estado_cod: asText(row.estadoCod ?? row.estado_cod ?? 1),
      flight_number: row.flightNumber ?? "",
      url_documento_soporte: row.urlDocumentoSoporte ?? "",
      fecha_salida: row.fechaSalida ?? row.fecha_salida ?? null,
      fecha_llegada: row.fechaLlegada ?? row.fecha_llegada ?? null,
      costo_estimado: parseDecimalValue(row.costoEstimado ?? 0),
      costo_real: parseDecimalValue(row.costoReal ?? 0),
    };
  };

  const handleOpenAdd = () => {
    setEditingLeg(FORM_EMPTY);
    setDialogOpen(true);
  };

  const handleOpenEdit = (leg: Record<string, unknown>) => {
    setEditingLeg({
      embLegsId: leg.embLegsId ?? null,
      codEntidadProv: asText(leg.codEntidadProv ?? leg.entidadIdProvTrans),
      codPaisOrigen: asText(leg.codPaisOrigen ?? leg.paisIdOrigen),
      puertoIdOrigen: asText(leg.puertoIdOrigen ?? leg.puntoenlaceIdOrigen),
      codPaisDestino: asText(leg.codPaisDestino ?? leg.paisIdDestino),
      puertoIdDestino: asText(leg.puertoIdDestino ?? leg.puntoenlaceIdDestino),
      flightNumber: leg.flightNumber ?? leg.flight_number ?? "",
      fechaSalida: leg.fechaSalida ?? leg.fecha_salida ?? "",
      fechaLlegada: leg.fechaLlegada ?? leg.fecha_llegada ?? "",
      costoEstimado: leg.costoEstimado ?? 0,
      costoReal: leg.costoReal ?? 0,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => setDialogOpen(false);

  const handleSaveDialog = async (formData: Record<string, unknown>) => {
    const payload = buildPayload(formData);
    try {
      if (formData.embLegsId) {
        await actualizarLeg(payload);
      } else {
        await insertarLeg(payload);
      }
      await refetchLegs();
      setDialogOpen(false);
    } catch (err) {
      logger.error("Error al guardar ruta:", err);
    }
  };

  const datosConId = legs.map((leg, index) => ({
    ...leg,
    _gridId: leg.embLegsId ?? `temp_${index}`,
    codPaisOrigen: leg.codPaisOrigen ?? leg.paisIdOrigen ?? "",
    codPaisDestino: leg.codPaisDestino ?? leg.paisIdDestino ?? "",
    puertoIdOrigen: leg.puntoenlaceIdOrigen ?? leg.puertoIdOrigen ?? "",
    puertoIdDestino: leg.puntoenlaceIdDestino ?? leg.puertoIdDestino ?? "",
    _nombrePuertoOrigen: leg.puntoenlaceNombreOrigen ?? "",
    _nombrePuertoDestino: leg.puntoenlaceNombreDestino ?? "",
    fechaSalida: leg.fechaSalida ?? leg.fecha_salida ?? "",
    fechaLlegada: leg.fechaLlegada ?? leg.fecha_llegada ?? "",
    fecha_salida: leg.fecha_salida ?? leg.fechaSalida ?? "",
    fecha_llegada: leg.fecha_llegada ?? leg.fechaLlegada ?? "",
    costoEstimado: parseDecimalValue(leg.costoEstimado ?? 0),
    costoReal: parseDecimalValue(leg.costoReal ?? 0),
  }));

  const formatPaisLabel = (val: unknown, row: Record<string, unknown>, campo: string) => {
    const found = paisesOptions.find((p) => String(p.value) === String(val));
    return found ? found.label : asText(row?.[campo] ?? val);
  };

  const rutasItems = datosConId.map((leg, index) => {
    const legRaw = leg as unknown as Record<string, unknown>;
    const nombrePaisOrigen = formatPaisLabel(leg.codPaisOrigen, leg, "nombrePaisOrigen");
    const nombrePaisDestino = formatPaisLabel(leg.codPaisDestino, leg, "nombrePaisDestino");
    const nombreAerolinea =
      aerolineasOptions.find(
        (a) => safeString(a.value) === safeString(leg.codEntidadProv ?? leg.entidadIdProvTrans),
      )?.label ??
      leg.entidadNombreProv ??
      "";
    const nombrePuertoOrigen = leg._nombrePuertoOrigen ?? leg.puntoenlaceNombreOrigen ?? "";
    const nombrePuertoDestino = leg._nombrePuertoDestino ?? leg.puntoenlaceNombreDestino ?? "";
    return {
      key: leg._gridId,
      nombre: String(
        (nombreAerolinea || leg.entidadNombreProv) ?? legRaw.entidad_nombre ?? `Leg ${index + 1}`,
      ),
      nombreProveedor: "",
      monedaSimbolo: "",
      valor: 0,
      detallesColumns: true,
      _leg: leg,
      detalles: [
        {
          tarifadetalle_id: `pais-origen-${index}`,
          tipo_desc: "País Origen",
          tarifadetalle_descripcion: asText(nombrePaisOrigen),
        },
        {
          tarifadetalle_id: `punto-origen-${index}`,
          tipo_desc: "Aeropuerto Origen",
          tarifadetalle_descripcion: asText(nombrePuertoOrigen),
        },
        {
          tarifadetalle_id: `pais-destino-${index}`,
          tipo_desc: "País Destino",
          tarifadetalle_descripcion: asText(nombrePaisDestino),
        },
        {
          tarifadetalle_id: `punto-destino-${index}`,
          tipo_desc: "Aeropuerto Destino",
          tarifadetalle_descripcion: asText(nombrePuertoDestino),
        },
        {
          tarifadetalle_id: `vuelo-${index}`,
          tipo_desc: "Vuelo",
          tarifadetalle_descripcion: asText(leg.flightNumber),
        },
      ],
    };
  });

  const renderAccionFila = (item: Record<string, unknown>) => (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleOpenEdit(item._leg as Record<string, unknown>)}
        aria-label="Editar ruta"
        title="Editar"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );

  if (!embarqueId) {
    return (
      <div className="p-4">
        <BannerInformativo
          severidad="warning"
          titulo="Faltan datos del embarque"
          mensaje="No hay datos del embarque disponibles."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-4/5">
      <BannerInformativo
        ocultar={!required || isLoadingLegs || legs.length > 0}
        severidad="warning"
        titulo="Faltan rutas"
        mensaje="Agregue al menos una ruta para continuar."
      />

      {isLoadingLegs ? (
        <div className="flex justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <TablaDue
          titulo="Rutas"
          subtituloParte=""
          subtituloTexto=""
          entidadNombre=""
          items={rutasItems}
          mostrarCodTipoPago={false}
          mostrarValor={false}
          usarEtiquetasDetalleComoCabecera
          renderAccionFila={renderAccionFila}
          columnaAccionAncho="1%"
          accionesHeader={
            mostrarBotonAgregar ? (
              <Button variant="outline" size="sm" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            ) : undefined
          }
        />
      )}

      <RutaDialog
        open={dialogOpen}
        initialData={editingLeg}
        onClose={handleCloseDialog}
        onSave={handleSaveDialog}
        aerolineasOptions={aerolineasOptions}
        paisesOptions={paisesOptions}
        filterPuntosEnlaceByPais={filterPuntosEnlaceByPais}
        isLoadingAerolineas={isLoadingAerolineas}
        isLoadingPaises={isLoadingPaises}
        isLoadingPuntosEnlace={isLoadingPuntosEnlace}
      />
    </div>
  );
}
