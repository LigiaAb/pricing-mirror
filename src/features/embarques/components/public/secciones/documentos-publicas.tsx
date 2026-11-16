"use client";

/**
 * Paso "Documentos" del wizard público (delta 2026-07-16): documentos
 * obligatorios condicionales — Hoja de Seguridad (MSDS, 343) si la
 * clasificación de carga es peligrosa y Factura Cobertura Seguro (315) si la
 * cobertura está activa. Validez del paso = todos los requeridos con archivo
 * en servidor. CRUD contra los endpoints públicos con token de interacción.
 */

import { Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useGuardarArchivoPublico, useRecuperarArchivoPublico } from "@/features/archivos";
import {
  useCoordinacionDocumentosPublico,
  useCreateCoordinacionDocumentoPublico,
  useUpdateCoordinacionDocumentoPublico,
} from "@/features/coordinaciones";
import {
  TIPO_DOCUMENTO_FACTURA_COBERTURA_SEGURO,
  TIPO_DOCUMENTO_HOJA_SEGURIDAD,
} from "@/features/embarques/lib/constantes";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { asText } from "@/shared/lib/text";
import { DocumentoRequeridoCard, type PersistirDocumentoInput } from "./documento-requerido-card";

const DOCUMENTOS_REQUERIDOS = {
  peligrosidad: {
    tipoDocumentoId: TIPO_DOCUMENTO_HOJA_SEGURIDAD,
    nombre: "Hoja de Seguridad",
    mensaje: "Al tratarse de una carga peligrosa, debe cargar la Hoja de Seguridad (MSDS).",
  },
  coberturaSeguro: {
    tipoDocumentoId: TIPO_DOCUMENTO_FACTURA_COBERTURA_SEGURO,
    nombre: "Factura Cobertura Seguro",
    mensaje: "Al tener cobertura de seguro, debe cargar la Factura de Cobertura de Seguro.",
  },
} as const;

type DocKey = keyof typeof DOCUMENTOS_REQUERIDOS;

interface DocumentosPublicasProps {
  readonly embarqueId: string | number | null | undefined;
  readonly codFile: string;
  readonly onValidityChange?: (valid: boolean) => void;
  readonly showPeligrosidad?: boolean;
  readonly showCoberturaSeguro?: boolean;
}

function DocumentosPublicas({
  embarqueId,
  codFile,
  onValidityChange,
  showPeligrosidad = false,
  showCoberturaSeguro = false,
}: DocumentosPublicasProps) {
  const {
    data: serverDocs = [],
    isLoading: isLoadingDocs,
    refetch: refetchDocs,
  } = useCoordinacionDocumentosPublico(embarqueId ?? null);

  const { mutateAsync: guardarArchivo } = useGuardarArchivoPublico();
  const { mutateAsync: recuperarArchivo } = useRecuperarArchivoPublico();
  const { mutateAsync: crearDocumento } = useCreateCoordinacionDocumentoPublico();
  const { mutateAsync: actualizarDocumento } = useUpdateCoordinacionDocumentoPublico();

  const [validityByDoc, setValidityByDoc] = useState<Record<string, boolean>>({});
  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;

  const handleDocValidity = useCallback((key: DocKey, valid: boolean) => {
    setValidityByDoc((prev) => (prev[key] === valid ? prev : { ...prev, [key]: valid }));
  }, []);

  useEffect(() => {
    const keys: DocKey[] = [
      ...(showPeligrosidad ? (["peligrosidad"] as const) : []),
      ...(showCoberturaSeguro ? (["coberturaSeguro"] as const) : []),
    ];
    const isValid = keys.every((key) => validityByDoc[key]);
    onValidityChangeRef.current?.(isValid);
  }, [validityByDoc, showPeligrosidad, showCoberturaSeguro]);

  const persistirDocumento = useCallback(
    async ({ archivo, descripcion, serverDoc, tipoDocumentoId }: PersistirDocumentoInput) => {
      const rawRuta = await guardarArchivo({
        archivo,
        tipo_documento: "coordinaciones",
        embarque_id: embarqueId,
        cod_file: codFile || "",
        descripcion: descripcion || undefined,
      });
      const payload = {
        embarque_id: embarqueId ?? 0,
        cod_tipo_documento: tipoDocumentoId,
        ubicacion: "coordinaciones",
        tipo_documento: "coordinaciones",
        url_archivo: asText(rawRuta),
        descripcion: descripcion || null,
        estado_cod: 1,
      };
      if (serverDoc) {
        await actualizarDocumento({
          documento_id_coord: serverDoc.documentoIdCoord,
          ...payload,
        });
      } else {
        await crearDocumento(payload);
      }
      await refetchDocs();
    },
    [guardarArchivo, crearDocumento, actualizarDocumento, refetchDocs, embarqueId, codFile],
  );

  const verDocumento = useCallback(
    async (urlArchivo: string) => {
      if (!urlArchivo) return;
      const blob = await recuperarArchivo({ ruta_archivo: urlArchivo });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    },
    [recuperarArchivo],
  );

  const visibles: DocKey[] = [
    ...(showPeligrosidad ? (["peligrosidad"] as const) : []),
    ...(showCoberturaSeguro ? (["coberturaSeguro"] as const) : []),
  ];

  return (
    <div className="relative space-y-3">
      {isLoadingDocs && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-card/70">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}

      {visibles.map((key) => (
        <BannerInformativo
          key={`banner-${key}`}
          ocultar={Boolean(validityByDoc[key])}
          severidad="warning"
          titulo="Documento obligatorio pendiente"
          mensaje={DOCUMENTOS_REQUERIDOS[key].mensaje}
        />
      ))}

      <div className="flex flex-wrap items-start gap-4">
        {visibles.map((key) => (
          <DocumentoRequeridoCard
            key={key}
            tipoDocumentoId={DOCUMENTOS_REQUERIDOS[key].tipoDocumentoId}
            nombre={DOCUMENTOS_REQUERIDOS[key].nombre}
            serverDocs={serverDocs}
            onPersistir={persistirDocumento}
            onVer={verDocumento}
            onValidityChange={(valid) => handleDocValidity(key, valid)}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(DocumentosPublicas);
