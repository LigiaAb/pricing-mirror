"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useCoordinacion } from "@/features/coordinaciones";
import { useEmbarqueContext } from "@/features/embarques/components/context";
import {
  NuevaDireccionEntidad,
  NuevaIdentificacionEntidad,
  NuevoContactoEntidad,
  useFetchEntidades,
} from "@/features/entidades";
import { DialogComponent } from "@/shared/components/dialog-component";
import FacturacionPublica from "../public/secciones/facturacion-publica";

const COD_TIPO_PRE_CLIENTE = 5;
const COD_TIPO_CLIENTE = 3;

interface FacturacionSectionProps {
  readonly onValidityChange?: (valid: boolean | string) => void;
  readonly onValuesChange?: (values: Record<string, unknown>) => void;
}

const getFirst = (obj: unknown, keys: string[]): unknown => {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = record[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};

/**
 * Facturación de gestión-embarques: mismos campos/diseño que la sección
 * homóloga de CTS (`FacturacionPublica`, apiMode="private"), incluyendo el
 * mismo endpoint (`recuperar-datos-entidad`). Se le agrega lo que CTS no
 * necesita porque su entidad ya llega completa desde la carta: botones
 * "Agregar" para NIT/dirección fiscal/contacto faltantes y un "Recargar".
 */
export function FacturacionSection({ onValidityChange, onValuesChange }: FacturacionSectionProps) {
  const { embarque_id } = useEmbarqueContext();
  const { data: embarqueData } = useCoordinacion(embarque_id);
  const queryClient = useQueryClient();

  const clienteId = useMemo(
    () => getFirst(embarqueData, ["entidadIdCli", "entidad_id_cli", "ENTIDAD_ID_CLI"]),
    [embarqueData],
  );

  // Misma detección de pre-cliente que usa internamente FacturacionPublica en
  // apiMode="private": si la entidad no está clasificada como CLIENTE, los
  // diálogos "Agregar" deben crear el sub-registro bajo cod_tipo 5.
  const { data: clienteEntidades = [] } = useFetchEntidades(
    { tipo_entidad: "CLIENTE", entidad_id: clienteId },
    { enabled: Boolean(clienteId) },
  );
  const codTipo = clienteEntidades.length > 0 ? COD_TIPO_CLIENTE : COD_TIPO_PRE_CLIENTE;

  const [dirDialogOpen, setDirDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [nitDialogOpen, setNitDialogOpen] = useState(false);

  const invalidarDatosEntidad = () => {
    queryClient.invalidateQueries({ queryKey: ["datos-entidad"] });
  };

  const closeAndRefresh = (close: () => void) => () => {
    close();
    invalidarDatosEntidad();
  };

  return (
    <>
      <FacturacionPublica
        apiMode="private"
        selectedEntidadId={(clienteId as string | number | null) ?? null}
        onValidityChange={onValidityChange}
        onValuesChange={onValuesChange}
        onRefresh={invalidarDatosEntidad}
        quickCreate={{
          onAgregarNit: () => setNitDialogOpen(true),
          onAgregarDireccion: () => setDirDialogOpen(true),
          onAgregarContacto: () => setContactDialogOpen(true),
        }}
      />

      <DialogComponent
        open={nitDialogOpen}
        titulo="NIT"
        onClose={closeAndRefresh(() => setNitDialogOpen(false))}
      >
        <NuevaIdentificacionEntidad
          entidadId={Number(clienteId)}
          codTipo={codTipo}
          codIdentificacion={3}
          identificacion="NIT"
          readOnly={false}
        />
      </DialogComponent>

      <DialogComponent
        open={dirDialogOpen}
        titulo="Dirección fiscal"
        onClose={closeAndRefresh(() => setDirDialogOpen(false))}
      >
        <NuevaDireccionEntidad entidadId={Number(clienteId)} tipo={codTipo} />
      </DialogComponent>

      <DialogComponent
        open={contactDialogOpen}
        titulo="Contacto"
        onClose={closeAndRefresh(() => setContactDialogOpen(false))}
      >
        <NuevoContactoEntidad entidadId={Number(clienteId)} codTipo={codTipo} />
      </DialogComponent>
    </>
  );
}
