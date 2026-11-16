"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getCamposInvalidosCargaFormulario,
  isCargaFormularioValido,
} from "@/features/embarques/components/public/secciones/validation";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Button } from "@/shared/components/ui/button";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { asNumber } from "@/shared/lib/text";
import { useCargasCoordinacion } from "../../hooks/use-cargas-coordinacion";
import { SeccionHeader } from "../public/seccion-header";
import { CargasPublicasEliminarDialog } from "../public/secciones/cargas-publicas-eliminar-dialog";
import { type CargaData, normalizeCargaRows } from "../public/secciones/cargas-publicas-model";
import { CargasPublicasTabla } from "../public/secciones/cargas-publicas-tabla";
import { CargaFormDialog } from "./carga-form-dialog";

interface CargasSectionProps {
  readonly onValidityChange?: (valid: boolean | string) => void;
  readonly onLoadingChange?: (loading: boolean) => void;
}

/**
 * Producto de gestión-embarques: misma tabla/diseño que la sección homóloga
 * de CTS (`CargasPublicas`: mismas columnas, iconos de estado y diálogo de
 * confirmación al eliminar), pero editable y persistida vía los endpoints
 * propios de la coordinación (`useCargasCoordinacion`), no el JSON de carta.
 */
export function CargasSection({ onValidityChange, onLoadingChange }: CargasSectionProps) {
  const c = useCargasCoordinacion(onValidityChange, onLoadingChange);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const filas = useMemo(
    () => normalizeCargaRows(c.cargas as unknown as CargaData[], c.unidadesMedida),
    [c.cargas, c.unidadesMedida],
  );
  const totalCw = useMemo(() => filas.reduce((sum, it) => sum + asNumber(it.cw), 0), [filas]);

  const handleDeleteConfirmado = () => {
    if (deleteIndex === null) return;
    const carga = c.cargas[deleteIndex];
    setDeleteIndex(null);
    if (carga) void c.handleDelete(carga);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <BannerInformativo
          ocultar={c.loadingCargas || (c.hasCargas && !c.tieneFaltantes)}
          severidad="warning"
          titulo={c.hasCargas ? "Campos incompletos" : "Faltan productos"}
          mensaje={
            c.hasCargas
              ? "Complete los campos obligatorios de los productos marcados."
              : "Agregue al menos un producto para continuar."
          }
        />

        <SeccionHeader titulo="Producto" />

        {c.loadingCargas ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Cargando productos...</div>
          </div>
        ) : (
          <CargasPublicasTabla
            filas={filas}
            readOnly={false}
            onEdit={(index) => {
              const carga = c.cargas[index];
              if (carga) c.handleOpenEdit(carga);
            }}
            onDelete={setDeleteIndex}
            extraActions={
              <Button size="sm" onClick={c.handleOpenAdd}>
                <Plus className="mr-1 size-4" />
                Agregar producto
              </Button>
            }
            footer={
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <span>
                  CW total: <strong className="text-foreground">{totalCw.toFixed(2)} kg</strong>
                </span>
              </div>
            }
          />
        )}

        <CargaFormDialog
          open={c.dialogOpen}
          onOpenChange={c.setDialogOpen}
          isEditing={Boolean(c.editingId)}
          saving={c.saving}
          formValido={isCargaFormularioValido(c.formData)}
          camposInvalidos={getCamposInvalidosCargaFormulario(c.formData)}
          formData={c.formData}
          dimensiones={c.dimensiones}
          embalajeOptions={c.embalajeOptions}
          regimenOptions={c.regimenOptions}
          unidadMedidaOptions={c.unidadMedidaOptions}
          paises={c.paises as Array<{ cod_pais: string | number; nombre_pais: string }>}
          onFieldChange={c.handleFieldChange}
          onSave={c.handleSave}
        />

        <CargasPublicasEliminarDialog
          open={deleteIndex !== null}
          onCancel={() => setDeleteIndex(null)}
          onConfirm={handleDeleteConfirmado}
        />
      </div>
    </TooltipProvider>
  );
}
