"use client";

/**
 * Render de los 10 pasos del detalle CTS privado (Fase A.2). Las secciones
 * públicas de la Fase C se montan con `apiMode="private"` alimentadas desde la
 * carta fusionada; Gastos/Documentos/Rutas/Seguimiento siguen siendo las
 * secciones privadas (leen el EmbarqueProvider del caller). Todas se montan
 * siempre (la validación corre aunque el paso no esté activo); solo la del
 * paso activo es visible.
 */

import { type Dispatch, type JSX, memo, type SetStateAction, useCallback } from "react";
import { SEGUIMIENTO_COD_TIPO_CTS } from "@/features/embarques/lib/constantes";
import CargasPublicas from "../public/secciones/cargas-publicas";
import ConsignatarioPublicas from "../public/secciones/consignatario-publicas";
import DetallesPublica from "../public/secciones/detalles-publica";
import type { CambioClienteRow } from "../public/secciones/entidad-public-form/cambios-cliente";
import FacturacionPublica from "../public/secciones/facturacion-publica";
import FechasPublicas from "../public/secciones/fechas-publicas";
import NotificacionesPublicas from "../public/secciones/notificaciones-publicas";
import ShipperPublicas from "../public/secciones/shipper-publicas";
import { DocumentosSection } from "../secciones/documentos";
import { GastosSection } from "../secciones/gastos";
import { RutasSection } from "../secciones/rutas";
import { SeguimientoSection } from "../secciones/seguimiento";
import type { useDatosCartaPrivada } from "./use-datos-carta-privada";

type JsonRecord = Record<string, unknown>;

export type ValidezPrivada = boolean | "pending" | "pre-cliente";

export const STEPS_CTS = [
  "Shipper",
  "Consignatario",
  "Notificacion",
  "Producto",
  "Facturacion",
  "Detalles",
  "Gastos",
  "Documentos",
  "Fechas",
  "Rutas",
  "Seguimiento",
] as const;

/** Pasos que no bloquean "Crear Coordinación". */
export const STEPS_NO_BLOQUEANTES = new Set(["Rutas", "Fechas", "Seguimiento"]);

export interface FacturacionValuesPrivada {
  cliente?: JsonRecord;
  detalles?: JsonRecord;
}

interface Props {
  readonly estado: number;
  readonly filteredSteps: readonly string[];
  readonly datos: ReturnType<typeof useDatosCartaPrivada>;
  readonly isSaving: boolean;
  readonly guardarSeccion: (filas?: JsonRecord[]) => Promise<unknown>;
  readonly validityHandlers: readonly ((valid: ValidezPrivada) => void)[];
  /** D.7: las secciones privadas reportan su carga al loader global del detalle. */
  readonly loadingHandlers?: Partial<Record<string, (loading: boolean) => void>>;
  readonly cargasPublicasValues: JsonRecord[];
  readonly setShipperValues: Dispatch<SetStateAction<JsonRecord>>;
  readonly setConsignatarioValues: Dispatch<SetStateAction<JsonRecord>>;
  readonly setFechasValues: Dispatch<SetStateAction<JsonRecord>>;
  readonly setFacturacionValues: Dispatch<SetStateAction<FacturacionValuesPrivada>>;
  readonly setCargasPublicasValues: Dispatch<SetStateAction<JsonRecord[]>>;
  /** D.8: el panel "Historial de cambios" se muestra fuera del formulario. */
  readonly onShipperCompareRows?: (rows: CambioClienteRow[]) => void;
  readonly onConsignatarioCompareRows?: (rows: CambioClienteRow[]) => void;
}

function SeccionesWizardPrivadoBase({
  estado,
  filteredSteps,
  datos,
  isSaving,
  guardarSeccion,
  validityHandlers,
  loadingHandlers = {},
  cargasPublicasValues,
  setShipperValues,
  setConsignatarioValues,
  setFechasValues,
  setFacturacionValues,
  setCargasPublicasValues,
  onShipperCompareRows,
  onConsignatarioCompareRows,
}: Props) {
  const noop = () => undefined;

  const handleFacturacionValuesChange = useCallback(
    (vals: FacturacionValuesPrivada) => setFacturacionValues((prev) => ({ ...prev, ...vals })),
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
            cliInfo={datos.cliInfoPrivado}
            apiMode="private"
            selectedEntidadId={datos.entidadIdShipperCoord as string | number | null}
            {...(onShipperCompareRows ? { onCompareRows: onShipperCompareRows } : {})}
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
            cliInfo={datos.cliInfoPrivado}
            apiMode="private"
            selectedEntidadId={datos.entidadIdConsignatarioCoord as string | number | null}
            {...(onConsignatarioCompareRows ? { onCompareRows: onConsignatarioCompareRows } : {})}
          />
        );
      case "Notificacion":
        return (
          <NotificacionesPublicas
            data={datos.notificacionesPublica}
            isLoading={datos.seccionesLoading}
            readOnly
            onValidityChange={onValidity}
          />
        );
      case "Producto":
        return (
          <CargasPublicas
            data={
              (cargasPublicasValues.length > 0 ? cargasPublicasValues : datos.cargasCarta) as never
            }
            apiMode="private"
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={setCargasPublicasValues as never}
            onSave={(filas) => void guardarSeccion(filas as JsonRecord[])}
            isSaving={isSaving}
          />
        );
      case "Facturacion":
        return (
          <FacturacionPublica
            data={datos.facturacionPublica}
            isLoading={datos.seccionesLoading}
            onValidityChange={onValidity}
            onValuesChange={handleFacturacionValuesChange}
            cliInfo={datos.cliInfoPrivado}
            apiMode="private"
            selectedEntidadId={datos.entidadIdClienteFacturacion as string | number | null}
            contactoIdCliente={datos.contactoIdCliente as string | number | null}
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
            apiMode="private"
          />
        );
      case "Gastos":
        return (
          <GastosSection
            onValidityChange={onValidity}
            onLoadingChange={loadingHandlers.Gastos}
            mostrarAgregarServicio={false}
          />
        );
      case "Documentos":
        return (
          <DocumentosSection
            onValidityChange={onValidity}
            onLoadingChange={loadingHandlers.Documentos}
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
      case "Rutas":
        return (
          <RutasSection
            onValidityChange={onValidity}
            onLoadingChange={loadingHandlers.Rutas}
            mostrarBotonAgregar={false}
            required={false}
          />
        );
      case "Seguimiento":
        return (
          <SeguimientoSection
            embarqueData={datos.embarqueData as JsonRecord | null}
            onValidityChange={onValidity}
            onLoadingChange={loadingHandlers.Seguimiento}
            codTipo={SEGUIMIENTO_COD_TIPO_CTS}
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

export const SeccionesWizardPrivado = memo(SeccionesWizardPrivadoBase);
