"use client";

import { AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import React from "react";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Badge } from "@/shared/components/ui/badge";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { useDocumentosCoordinacion } from "../../hooks/use-documentos-coordinacion";
import { DocumentoPendienteCard } from "./documento-pendiente-card";
import { DocumentoSubidoCard } from "./documento-subido-card";
import { DocumentosSeccionColapsable } from "./documentos-seccion-colapsable";

interface DocumentosSectionProps {
  onValidityChange?: ((valid: boolean) => void) | undefined;
  onLoadingChange?: ((loading: boolean) => void) | undefined;
}

export const DocumentosSection = React.memo(function DocumentosSection({
  onValidityChange,
  onLoadingChange,
}: DocumentosSectionProps) {
  const docs = useDocumentosCoordinacion(onValidityChange, onLoadingChange);
  const {
    isLoadingDocs,
    successMessage,
    isValid,
    pendingCount,
    documentosSubidos,
    documentosObligatoriosPendientes,
    documentosCropaPendientes,
  } = docs;

  const sinDocumentos =
    documentosSubidos.length === 0 &&
    documentosObligatoriosPendientes.length === 0 &&
    documentosCropaPendientes.length === 0 &&
    !isLoadingDocs;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative">
        {isLoadingDocs && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70 backdrop-blur-[1px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        <BannerInformativo
          ocultar={!successMessage}
          severidad="success"
          titulo="Éxito"
          mensaje={successMessage ?? ""}
        />

        <BannerInformativo
          ocultar={isLoadingDocs || isValid}
          severidad="warning"
          titulo="Documentos obligatorios pendientes"
          mensaje={`Faltan ${pendingCount} documento(s) obligatorio(s) por cargar.`}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {documentosSubidos.length > 0 && (
            <div className="lg:col-span-2">
              <DocumentosSeccionColapsable
                titulo="Documentos Subidos"
                subtitulo={`${documentosSubidos.length} documento${documentosSubidos.length === 1 ? "" : "s"} en servidor`}
                icono={CheckCircle2}
                iconoBg="bg-green-600 dark:bg-green-700"
                badge={
                  <Badge
                    variant="default"
                    className="ml-2 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                  >
                    {documentosSubidos.length}
                  </Badge>
                }
                isLoadingDocs={isLoadingDocs}
                onRefresh={docs.handleRefreshDocuments}
              >
                {documentosSubidos.map(([key, doc]) => (
                  <DocumentoSubidoCard
                    key={key}
                    rowKey={key}
                    doc={doc}
                    onUpdateFileUpload={docs.handleUpdateFileUpload}
                    onRemoveFile={docs.handleRemoveFile}
                    onDescripcionChange={docs.handleDescripcionChange}
                    recuperarArchivo={docs.recuperarArchivo}
                  />
                ))}
              </DocumentosSeccionColapsable>
            </div>
          )}

          {documentosObligatoriosPendientes.length > 0 && (
            <DocumentosSeccionColapsable
              titulo="Documentos Obligatorios"
              subtitulo="Estos documentos son requeridos para continuar"
              icono={AlertCircle}
              iconoBg="bg-destructive "
              badge={
                <Badge variant="destructive" className="ml-2">
                  {documentosObligatoriosPendientes.length}
                </Badge>
              }
              isLoadingDocs={isLoadingDocs}
              onRefresh={docs.handleRefreshDocuments}
            >
              {documentosObligatoriosPendientes.map(([key, doc]) => (
                <DocumentoPendienteCard
                  key={key}
                  rowKey={key}
                  doc={doc}
                  onFileUpload={docs.handleFileUpload}
                  onDescripcionChange={docs.handleDescripcionChange}
                  onFileSave={docs.handleFileSave}
                  tipo="obligatorio"
                />
              ))}
            </DocumentosSeccionColapsable>
          )}

          {documentosCropaPendientes.length > 0 && (
            <DocumentosSeccionColapsable
              titulo="Documentos Pendientes"
              subtitulo="Documentos adicionales pendientes de subir"
              icono={Clock}
              iconoBg="bg-amber-600 dark:bg-amber-700"
              badge={
                <Badge variant="secondary" className="ml-2">
                  {documentosCropaPendientes.length}
                </Badge>
              }
              isLoadingDocs={isLoadingDocs}
              onRefresh={docs.handleRefreshDocuments}
            >
              {documentosCropaPendientes.map(([key, doc]) => (
                <DocumentoPendienteCard
                  key={key}
                  rowKey={key}
                  doc={doc}
                  onFileUpload={docs.handleFileUpload}
                  onDescripcionChange={docs.handleDescripcionChange}
                  onFileSave={docs.handleFileSave}
                  tipo="cropa"
                />
              ))}
            </DocumentosSeccionColapsable>
          )}

          {sinDocumentos && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                No hay documentos para mostrar
              </p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});
