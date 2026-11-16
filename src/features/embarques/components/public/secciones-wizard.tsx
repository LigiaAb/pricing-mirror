"use client";

/**
 * Render de los pasos del wizard público por label (igual que el detalle CTS
 * privado): "Documentos" y "Fechas" son condicionales, así que el caller pasa
 * los pasos ya filtrados. Todas las secciones visibles se montan siempre (la
 * validación corre aunque el paso no esté activo); solo la activa es visible.
 */

import { type Dispatch, type JSX, memo, type SetStateAction, useCallback } from "react";
import type { CliInfo } from "@/features/embarques/lib/cli-info";
import CargasPublicas from "./secciones/cargas-publicas";
import ConsignatarioPublicas from "./secciones/consignatario-publicas";
import DetallesPublica from "./secciones/detalles-publica";
import DocumentosPublicas from "./secciones/documentos-publicas";
import FacturacionPublica from "./secciones/facturacion-publica";
import FechasPublicas from "./secciones/fechas-publicas";
import NotificacionesPublicas from "./secciones/notificaciones-publicas";
import ShipperPublicas from "./secciones/shipper-publicas";
import type { useDatosCartaPublica } from "./use-datos-carta-publica";

type JsonRecord = Record<string, unknown>;

export type Validez = boolean | "pending" | "pre-cliente";

export interface FacturacionValues {
  cliente?: JsonRecord;
  detalles?: JsonRecord;
}

interface Props {
  readonly estado: number;
  readonly filteredSteps: readonly string[];
  readonly datos: ReturnType<typeof useDatosCartaPublica>;
  readonly cliInfo: CliInfo | null;
  /** El token público se setea async en el padre; sin esto los fetch públicos disparan sin Authorization. */
  readonly tokenReady: boolean;
  readonly isSaving: boolean;
  readonly guardarSeccion: (filas?: JsonRecord[]) => Promise<unknown>;
  readonly validityHandlers: readonly ((valid: Validez) => void)[];
  readonly cargasPublicasValues: JsonRecord[];
  readonly setShipperValues: Dispatch<SetStateAction<JsonRecord>>;
  readonly setConsignatarioValues: Dispatch<SetStateAction<JsonRecord>>;
  readonly setNotificacionesValues: Dispatch<SetStateAction<JsonRecord>>;
  readonly setFechasValues: Dispatch<SetStateAction<JsonRecord>>;
  readonly setFacturacionValues: Dispatch<SetStateAction<FacturacionValues>>;
  readonly setCargasPublicasValues: Dispatch<SetStateAction<JsonRecord[]>>;
}

function SeccionesWizardBase({
  estado,
  filteredSteps,
  datos,
  cliInfo,
  tokenReady,
  isSaving,
  guardarSeccion,
  validityHandlers,
  cargasPublicasValues,
  setShipperValues,
  setConsignatarioValues,
  setNotificacionesValues,
  setFechasValues,
  setFacturacionValues,
  setCargasPublicasValues,
}: Props) {
  const noop = () => undefined;

  const handleFacturacionValuesChange = useCallback(
    (vals: FacturacionValues) => setFacturacionValues((prev) => ({ ...prev, ...vals })),
    [setFacturacionValues],
  );

  const renderSeccion = (label: string, idx: number): JSX.Element | null => {
    const onValidity = validityHandlers[idx] ?? noop;
    switch (label) {
      case "Shipper":
        return (
          <ShipperPublicas
            data={datos.entidadesPublicas.exportador}
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={setShipperValues}
            onSave={() => void guardarSeccion()}
            isSaving={isSaving}
            cliInfo={cliInfo}
            selectedEntidadId={datos.entidadIdShipperCoord as string | number | null}
            tokenReady={tokenReady}
          />
        );
      case "Consignatario":
        return (
          <ConsignatarioPublicas
            data={datos.entidadesPublicas.consignatario}
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={setConsignatarioValues}
            onSave={() => void guardarSeccion()}
            isSaving={isSaving}
            cliInfo={cliInfo}
            selectedEntidadId={datos.entidadIdConsignatarioCoord as string | number | null}
            tokenReady={tokenReady}
          />
        );
      case "Notificacion":
        return (
          <NotificacionesPublicas
            data={datos.notificacionesPublica}
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={setNotificacionesValues}
            onSave={() => void guardarSeccion()}
            isSaving={isSaving}
            consignatarioData={datos.consignatarioParaNotificaciones}
          />
        );
      case "Producto":
        return (
          <CargasPublicas
            data={(cargasPublicasValues.length > 0 ? cargasPublicasValues : datos.cargas) as never}
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={setCargasPublicasValues as never}
            onSave={(filas) => void guardarSeccion(filas as JsonRecord[])}
            isSaving={isSaving}
            tokenReady={tokenReady}
          />
        );
      case "Facturacion":
        return (
          <FacturacionPublica
            data={datos.facturacionPublica}
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={handleFacturacionValuesChange}
            cliInfo={cliInfo}
            apiMode="public"
            selectedEntidadId={datos.entidadIdClienteCoord as string | number | null}
            contactoIdCliente={datos.contactoIdClienteCoord as string | number | null}
            tokenReady={tokenReady}
          />
        );
      case "Detalles":
        return (
          <DetallesPublica
            data={datos.detallesData}
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={handleFacturacionValuesChange}
            onSave={() => void guardarSeccion()}
            isSaving={isSaving}
            catalogos={datos.catalogos}
            showCropaDocs={datos.showCropaDocs}
          />
        );
      case "Documentos":
        return (
          <DocumentosPublicas
            embarqueId={cliInfo?.embarque_id}
            codFile={String(datos.listaCoordinacion?.codFile ?? datos.codFile ?? "")}
            onValidityChange={onValidity}
            showPeligrosidad={datos.showDocumentosPeligrosidad}
            showCoberturaSeguro={datos.showDocumentosCoberturaSeguro}
          />
        );
      case "Fechas":
        return (
          <FechasPublicas
            data={datos.entidadesPublicas.exportador}
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={setFechasValues}
            onSave={() => void guardarSeccion()}
            isSaving={isSaving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {filteredSteps.map((label, idx) => (
        <div key={label} className={estado === idx ? "block p-2" : "hidden"}>
          {renderSeccion(label, idx)}
        </div>
      ))}
    </>
  );
}

export const SeccionesWizard = memo(SeccionesWizardBase);
