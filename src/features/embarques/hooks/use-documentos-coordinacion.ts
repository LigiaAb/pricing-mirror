"use client";

import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGuardarArchivo, useRecuperarArchivo } from "@/features/archivos";
import {
  useCoordinacion,
  useCoordinacionDocumentos,
  useCreateCoordinacionDocumento,
  useUpdateCoordinacionDocumento,
} from "@/features/coordinaciones";
import { useEmbarqueContext } from "@/features/embarques/components/context";
import { CROPA_DOCS } from "@/features/embarques/lib/constantes";
import { logger } from "@/shared/lib/logger";
import { asNumber, asText } from "@/shared/lib/text";
import {
  combinarConServidor,
  DOCUMENTOS_INICIALES,
  type DocumentoEntry,
  esClasificacionPeligrosa,
  esCoberturaSeguroActiva,
  isPdfFile,
  mergeServerDocs,
  parseDocumentosCropaSeleccionados,
} from "../lib/documentos-coordinacion";

/** Estado, sincronización con servidor y handlers de los documentos de la coordinación. */
export function useDocumentosCoordinacion(
  onValidityChange?: ((valid: boolean) => void) | undefined,
  onLoadingChange?: ((loading: boolean) => void) | undefined,
) {
  const { embarque_id, cod_file: contextCodFile } = useEmbarqueContext();
  const { data: embarqueData } = useCoordinacion(embarque_id);
  const {
    data: serverDocsRaw,
    isLoading: isLoadingDocs,
    refetch: refetchDocs,
  } = useCoordinacionDocumentos(embarque_id);

  const serverDocs = useMemo(
    () =>
      (serverDocsRaw ?? []).map((doc) => ({
        tipoDocumentoId: asNumber(doc.tipoIdDocumento),
        tipoDescripcion: doc.tipoDescripcion,
        urlDocumento: doc.urlArchivo || "",
        documentoIdCoord: asNumber(doc.documentoIdCoord),
        descripcion: doc.descripcion || "",
        codFile: doc.codFile || "",
      })),
    [serverDocsRaw],
  );

  const { mutateAsync: guardarArchivo } = useGuardarArchivo();
  const { mutateAsync: crearDocumento } = useCreateCoordinacionDocumento();
  const { mutateAsync: actualizarDocumento } = useUpdateCoordinacionDocumento();
  const { mutateAsync: recuperarArchivo } = useRecuperarArchivo();
  const queryClient = useQueryClient();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);
  const showSuccess = (msg: string) => setSuccessMessage(msg);

  const isRefreshingRef = useRef(false);
  const handleRefreshDocuments = async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["coordinacion", String(embarque_id)] }),
        queryClient.invalidateQueries({
          queryKey: ["coordinacion-documentos", String(embarque_id)],
        }),
      ]);
    } catch (error) {
      logger.error("Error refrescando documentos de coordinación:", error);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const codFile = contextCodFile ?? serverDocs.find((doc) => doc.codFile)?.codFile ?? "";
  const codFileRef = useRef("");
  useEffect(() => {
    if (codFile) codFileRef.current = codFile;
  }, [codFile]);

  const [documentos, setDocumentos] =
    useState<Record<string, DocumentoEntry>>(DOCUMENTOS_INICIALES);

  // Obligatorios condicionales (D.2): Hoja de Seguridad si la clasificación
  // de carga es PELIGROSA (122); Factura Cobertura Seguro si la cobertura está
  // activa. `visible=false` solo oculta el placeholder de carga pendiente — un
  // documento ya subido sigue listado aunque deje de ser obligatorio.
  useEffect(() => {
    const isPeligroso = esClasificacionPeligrosa(embarqueData);
    const tieneCobertura = esCoberturaSeguroActiva(embarqueData);
    setDocumentos((prev) => {
      const peligrosidadEntry = prev.documento_peligrosidad;
      const coberturaEntry = prev.factura_cobertura_seguro;
      if (!peligrosidadEntry || !coberturaEntry) return prev;
      return {
        ...prev,
        documento_peligrosidad: {
          ...peligrosidadEntry,
          obligatorio: isPeligroso,
          visible: isPeligroso,
        },
        factura_cobertura_seguro: {
          ...coberturaEntry,
          obligatorio: tieneCobertura,
          visible: tieneCobertura,
        },
      };
    });
  }, [embarqueData]);

  useEffect(() => {
    setDocumentos((prev) => mergeServerDocs(prev, serverDocs));
  }, [serverDocs]);

  const setArchivo = (key: string, archivo: File | null) => {
    setDocumentos((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return { ...prev, [key]: { ...existing, archivo } };
    });
  };

  const handleFileUpload = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isPdfFile(file)) return;
    setArchivo(key, file);
    try {
      event.target.value = "";
    } catch (e) {
      logger.error("Error limpiando input de archivo:", e);
    }
  };

  const persistirDocumento = async (doc: DocumentoEntry, archivo: File) => {
    const rawRuta = await guardarArchivo({
      archivo,
      tipo_documento: "coordinaciones",
      ubicacion: "coordinaciones",
      embarque_id,
      cod_file: codFileRef.current || codFile || "",
      descripcion: doc.descripcion || undefined,
    });
    const rutaArchivo = asText(rawRuta);
    const serverDoc = serverDocs.find(
      (sd) => String(sd.tipoDocumentoId) === String(doc.tipoDocumentoId),
    );
    const payload = {
      embarque_id: embarque_id ?? 0,
      cod_tipo_documento: doc.tipoDocumentoId,
      ubicacion: "coordinaciones",
      url_archivo: rutaArchivo,
      descripcion: doc.descripcion || null,
      estado_cod: 1,
    };
    if (serverDoc) {
      await actualizarDocumento({ documento_id_coord: serverDoc.documentoIdCoord, ...payload });
    } else {
      await crearDocumento(payload);
    }
    await refetchDocs();
  };

  const handleUpdateFileUpload = async (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
    doc: DocumentoEntry,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !isPdfFile(file)) return;
    setDocumentos((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return { ...prev, [key]: { ...existing, ...doc, archivo: file } };
    });
    try {
      event.target.value = "";
    } catch (e) {
      logger.error("Error limpiando input de archivo:", e);
    }
    try {
      await persistirDocumento(doc, file);
      showSuccess(`${doc.nombre} actualizado con éxito`);
    } catch (e: unknown) {
      logger.error("Error al actualizar el documento:", e);
    }
  };

  const handleRemoveFile = (key: string) => setArchivo(key, null);

  const handleDescripcionChange = (key: string, value: string) => {
    setDocumentos((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return { ...prev, [key]: { ...existing, descripcion: value } };
    });
  };

  const documentosConServidor = combinarConServidor(documentos, serverDocs);

  const handleFileSave = async (key: string, fileOverride?: File | null) => {
    const doc =
      documentos[key] ?? documentosConServidor.find(([entryKey]) => entryKey === key)?.[1];
    const archivo = fileOverride ?? doc?.archivo;
    if (!archivo || !doc) return;
    try {
      await persistirDocumento(doc, archivo);
      setArchivo(key, null);
      showSuccess(`${doc.nombre} subido con éxito`);
    } catch (error: unknown) {
      logger.error("Error al guardar documento:", error);
    }
  };

  // Un documento con archivo en servidor se lista SIEMPRE, aunque `visible`
  // sea false (p. ej. el MSDS cuando la carga dejó de ser peligrosa).
  const documentosSubidos = documentosConServidor.filter(([, doc]) => !!doc.urlServidor);
  const documentosObligatorios = Object.entries(documentos).filter(
    ([, doc]) => doc.visible !== false && doc.obligatorio,
  );
  const documentosObligatoriosPendientes = documentosObligatorios.filter(
    ([, doc]) => !doc.urlServidor,
  );
  const documentosCropaSeleccionados = parseDocumentosCropaSeleccionados(embarqueData);
  const documentosCropaPendientes = CROPA_DOCS.filter(({ key }) => {
    const doc = documentos[key];
    return documentosCropaSeleccionados.has(String(key)) && !doc?.urlServidor;
  }).map(({ key }) => [key, documentos[key]] as [string, DocumentoEntry]);

  const totalObligatorios = documentosObligatorios.length;
  const subidosObligatorios = documentosObligatorios.filter(
    ([, doc]) => doc.archivo || doc.urlServidor,
  ).length;
  const isValid = subidosObligatorios === totalObligatorios;
  const pendingCount = totalObligatorios - subidosObligatorios;

  const onValidityChangeRef = useRef(onValidityChange);
  useEffect(() => {
    onValidityChangeRef.current = onValidityChange;
  }, [onValidityChange]);
  useEffect(() => {
    if (onValidityChangeRef.current) onValidityChangeRef.current(isValid);
  }, [isValid]);
  useEffect(() => {
    onLoadingChange?.(!embarque_id || isLoadingDocs);
  }, [embarque_id, isLoadingDocs, onLoadingChange]);

  return {
    isLoadingDocs,
    successMessage,
    isValid,
    pendingCount,
    documentosSubidos,
    documentosObligatoriosPendientes,
    documentosCropaPendientes,
    handleRefreshDocuments,
    handleFileUpload,
    handleUpdateFileUpload,
    handleRemoveFile,
    handleDescripcionChange,
    handleFileSave,
    recuperarArchivo,
  };
}
