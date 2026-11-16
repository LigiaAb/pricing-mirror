"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { construirEntidadesPublicas, resolveEntidadId } from "@/features/carta-instrucciones";
import { useCoordinacion } from "@/features/coordinaciones";
import { useEmbarqueContext } from "@/features/embarques/components/context";
import { adaptarCoordinacionParaCarta } from "@/features/embarques/lib/carta-privada";
import { NIT_COD_IDENTIFICACION, TIPO_ENTIDAD } from "@/features/embarques/lib/constantes";
import {
  NuevaDireccionEntidad,
  NuevaIdentificacionEntidad,
  NuevoContactoEntidad,
} from "@/features/entidades";
import { DialogComponent } from "@/shared/components/dialog-component";
import { Button } from "@/shared/components/ui/button";
import { SeccionHeader } from "../public/seccion-header";
import ConsignatarioPublicas from "../public/secciones/consignatario-publicas";

interface ConsignatarioSectionProps {
  readonly onValidityChange?: (valid: boolean | string) => void;
  readonly onValuesChange?: (values: Record<string, unknown>) => void;
}

/**
 * Consignatario de gestión-embarques: mismos campos/diseño que la sección
 * homóloga de CTS (`ConsignatarioPublicas`, apiMode="private" — solo lectura,
 * igual que en `/cts`). El consignatario asignado no se reasigna a otra
 * entidad desde aquí; lo que gestion-embarques agrega son los mismos botones
 * "Agregar" NIT/Dirección/Contacto que ya usa Facturación para completar
 * datos faltantes.
 */
export function ConsignatarioSection({
  onValidityChange,
  onValuesChange,
}: ConsignatarioSectionProps) {
  const { embarque_id } = useEmbarqueContext();
  const { data: embarqueData, isLoading } = useCoordinacion(embarque_id);
  const queryClient = useQueryClient();

  const listaCoordinacion = useMemo(
    () => adaptarCoordinacionParaCarta(embarqueData),
    [embarqueData],
  );
  const cliInfo = embarqueData?.entidadIdCli ? { entidad_id: embarqueData.entidadIdCli } : null;
  const data = useMemo(
    () => construirEntidadesPublicas({}, listaCoordinacion).consignatario,
    [listaCoordinacion],
  );
  const selectedEntidadId = useMemo(
    () =>
      (resolveEntidadId({}, listaCoordinacion, "consignatario") as string | number | null) ?? null,
    [listaCoordinacion],
  );

  const [dirDialogOpen, setDirDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [nitDialogOpen, setNitDialogOpen] = useState(false);

  const invalidarDatosEntidad = () => {
    queryClient.invalidateQueries({ queryKey: ["datos-entidad-relacionada-privado"] });
  };
  const closeAndRefresh = (close: () => void) => () => {
    close();
    invalidarDatosEntidad();
  };

  return (
    <div className="space-y-4">
      <SeccionHeader
        titulo="Consignatario"
        acciones={
          selectedEntidadId ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNitDialogOpen(true)}
              >
                Agregar NIT
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDirDialogOpen(true)}
              >
                Agregar Dirección
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setContactDialogOpen(true)}
              >
                Agregar Contacto
              </Button>
            </div>
          ) : undefined
        }
      />
      <ConsignatarioPublicas
        data={data}
        isLoading={isLoading}
        {...(onValidityChange ? { onValidityChange } : {})}
        {...(onValuesChange ? { onValuesChange } : {})}
        cliInfo={cliInfo}
        apiMode="private"
        selectedEntidadId={selectedEntidadId}
      />

      <DialogComponent
        open={nitDialogOpen}
        titulo="NIT"
        onClose={closeAndRefresh(() => setNitDialogOpen(false))}
      >
        <NuevaIdentificacionEntidad
          entidadId={Number(selectedEntidadId)}
          codTipo={TIPO_ENTIDAD.consignatario}
          codIdentificacion={NIT_COD_IDENTIFICACION.consignatario}
          identificacion="NIT"
          readOnly={false}
        />
      </DialogComponent>

      <DialogComponent
        open={dirDialogOpen}
        titulo="Dirección"
        onClose={closeAndRefresh(() => setDirDialogOpen(false))}
      >
        <NuevaDireccionEntidad
          entidadId={Number(selectedEntidadId)}
          tipo={TIPO_ENTIDAD.consignatario}
        />
      </DialogComponent>

      <DialogComponent
        open={contactDialogOpen}
        titulo="Contacto"
        onClose={closeAndRefresh(() => setContactDialogOpen(false))}
      >
        <NuevoContactoEntidad
          entidadId={Number(selectedEntidadId)}
          codTipo={TIPO_ENTIDAD.consignatario}
        />
      </DialogComponent>
    </div>
  );
}
