"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useCoordinacion, useUpdateCoordinacion } from "@/features/coordinaciones";
import { useEmbarqueContext } from "@/features/embarques/components/context";
import { useCatalogosCartaPrivada } from "@/features/embarques/components/cts-detalle/use-catalogos-carta-privada";
import {
  parseJsonOpcionales,
  resolveCatalogValue,
  toNum,
} from "@/features/embarques/lib/commit-engine/helpers";
import { CLASIFICACION_CARGA_PELIGROSA, CROPA_DOCS } from "@/features/embarques/lib/constantes";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { logger } from "@/shared/lib/logger";
import {
  buildCoordPayload,
  getEmbarqueId,
  refreshCoordinationSharedData,
} from "@/shared/lib/payload-utils";
import { useAuthStore } from "@/shared/stores/auth-store";
import DetallesPublica from "../public/secciones/detalles-publica";
import type { DetallesData, DetallesValues } from "../public/secciones/detalles-publica-model";

interface DetallesSectionProps {
  onValidityChange?: (valid: boolean | string) => void;
  onValuesChange?: (values: Record<string, unknown>) => void;
  showCropaDocs?: boolean;
}

/**
 * Detalles de gestión-embarques: mismos campos/diseño que la sección homóloga
 * de CTS (`DetallesPublica`, apiMode="private"), incluyendo los mismos
 * catálogos (`useCatalogosCartaPrivada`, clasificaciónCarga + 2 opciones de
 * peligrosidad en vez de estaciónDsv + 3 opciones). A diferencia de CTS —que
 * guarda como borrador de carta— esta sección persiste directo a la
 * coordinación, así que se le agrega `readOnly={false}` y un guardado propio.
 */
export function DetallesSection({
  onValidityChange,
  onValuesChange,
  showCropaDocs = true,
}: Readonly<DetallesSectionProps>) {
  const { embarque_id } = useEmbarqueContext();
  const { data: embarqueData } = useCoordinacion(embarque_id);
  const { user } = useAuthStore();
  const codUsuario = (user as Record<string, unknown>)?.cod_usuario ?? null;
  const queryClient = useQueryClient();
  const { mutateAsync: actualizarCoordinacion, isPending: saving } = useUpdateCoordinacion();

  const [mensaje, setMensaje] = useState<string | null>(null);

  const catalogosPrivada = useCatalogosCartaPrivada({
    tipoIdEmbarque: embarqueData?.tipo_id_embarque ?? null,
  });

  const embarqueRaw = embarqueData as unknown as Record<string, unknown> | null;

  const catalogos = useMemo(
    () => ({
      tipoPago: catalogosPrivada.tipoPago,
      tipoCarga: catalogosPrivada.tipoCarga,
      servicios: catalogosPrivada.servicios,
      incoterm: catalogosPrivada.incoterm,
      clasificacionCarga: catalogosPrivada.clasificacionCarga,
    }),
    [catalogosPrivada],
  );

  const data: DetallesData = useMemo(
    () => ({
      tipoPago: embarqueData?.tipo_id_pago ?? null,
      tipoCarga: embarqueData?.tipo_id_carga ?? null,
      incoterm: embarqueData?.incoterm_id ?? null,
      servicio: embarqueData?.id_servicio ?? null,
      clasificacionCarga: embarqueData?.clasificacionCargaId ?? null,
      peligrosidad: embarqueData?.peligrosidad ?? false,
      cargaValiosa: parseJsonOpcionales(embarqueRaw).cargaValiosa === true,
      coberturaSeguro: parseJsonOpcionales(embarqueRaw).coberturaSeguro === true,
      documentosCropa: Object.entries(
        (parseJsonOpcionales(embarqueRaw).documentosCropa as Record<string, unknown>) ?? {},
      )
        .filter(([, checked]) => checked === true)
        .map(([key]) => key),
      instruccionesManejo: embarqueData?.observaciones ?? "",
    }),
    [embarqueData, embarqueRaw],
  );

  const handleGuardar = async (values: { detalles: Record<string, unknown> }) => {
    if (!embarqueData) return;
    const embarqueId = getEmbarqueId(embarqueData);
    if (!embarqueId) return;

    const detalles = values.detalles as DetallesValues;

    try {
      const overrides = {
        cod_tipo_pago: resolveCatalogValue(detalles.tipoPago, catalogosPrivada.tipoPago),
        cod_tipo_carga: resolveCatalogValue(detalles.tipoCarga, catalogosPrivada.tipoCarga),
        cod_servicio: resolveCatalogValue(detalles.servicio, catalogosPrivada.servicios),
        incoterm_id: toNum(detalles.incoterm),
        cod_clasificacion_carga: toNum(detalles.clasificacionCarga),
        observacion: detalles.instruccionesManejo || "",
        // Igual que el motor de commit de CTS: "carga peligrosa" ya no es un
        // checkbox propio, se deriva de la clasificación de carga.
        peligrosidad: Number(detalles.clasificacionCarga) === CLASIFICACION_CARGA_PELIGROSA,
        json_datos_opcionales: {
          ...parseJsonOpcionales(embarqueRaw),
          cargaValiosa: detalles.peligrosidad.includes("V"),
          coberturaSeguro: detalles.peligrosidad.includes("C"),
          documentosCropa: CROPA_DOCS.reduce(
            (acc, { key }) => {
              acc[key] = detalles.documentosCropa.includes(key);
              return acc;
            },
            {} as Record<string, boolean>,
          ),
        },
      };

      const payload = buildCoordPayload(
        embarqueData,
        overrides,
        codUsuario as string | number | null,
      );
      await actualizarCoordinacion(payload);
      await refreshCoordinationSharedData(queryClient, embarqueId, overrides);
      setMensaje("Datos guardados correctamente");
    } catch (err) {
      logger.error("Error guardando detalles:", err);
      setMensaje("Error guardando información");
    }
  };

  return (
    <div className="space-y-4">
      <BannerInformativo
        ocultar={!mensaje}
        severidad={mensaje?.includes("Error") ? "warning" : "success"}
        mensaje={mensaje}
      />
      <DetallesPublica
        data={data}
        {...(onValidityChange ? { onValidityChange } : {})}
        {...(onValuesChange ? { onValuesChange } : {})}
        onSave={handleGuardar}
        isSaving={saving}
        catalogos={catalogos}
        showCropaDocs={showCropaDocs}
        apiMode="private"
        readOnly={false}
      />
    </div>
  );
}
