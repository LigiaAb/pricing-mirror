"use client";

import { Plus } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import {
  paises as paisesCatalogo,
  paisesPublico,
  relacionTipo,
  relacionTipoPublico,
  tipos,
  tiposPublico,
} from "@/features/catalogos";
import {
  computeDimensiones,
  formatPartidaArancelaria,
  getFactorCmPorUnidadMedida,
  normalizarCantidadCarga,
} from "@/features/embarques/lib/cargas-calculos";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Button } from "@/shared/components/ui/button";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { asNumber, asText } from "@/shared/lib/text";
import { CargaFormDialog } from "../../secciones/carga-form-dialog";
import { CargasPublicasEliminarDialog } from "./cargas-publicas-eliminar-dialog";
import {
  type CargaData,
  type CargaRow,
  EMPTY_ROW,
  normalizeCargaRows,
  type Option,
} from "./cargas-publicas-model";
import { CargasPublicasTabla } from "./cargas-publicas-tabla";
import {
  areCargaRowsValid,
  getCamposInvalidosCargaFormulario,
  isCargaFormularioValido,
} from "./validation";

interface CargasPublicasProps {
  readonly data?: CargaData[];
  readonly isLoading?: boolean;
  readonly onValidityChange?: (valid: boolean) => void;
  readonly onValuesChange?: (values: CargaRow[]) => void;
  readonly onSave?: (filas: CargaRow[]) => void;
  readonly isSaving?: boolean;
  readonly apiMode?: "public" | "private";
  /** El token público se setea async en el padre; sin esto los fetch públicos disparan sin Authorization. */
  readonly tokenReady?: boolean;
}

const FILTRO_UNIDADES_MEDIDA = { tipo_tabla: "coordinacion_carga", cod_tipo_padre: 296 };

/**
 * Los catálogos público y privado devuelven la misma información con distinta
 * convención de nombres (camelCase vs snake_case), así que para construir las
 * opciones se leen como registros sueltos y se resuelve el primer alias que
 * exista.
 */
type CatalogoRaw = Record<string, unknown>;

function CargasPublicas({
  data = [],
  isLoading = false,
  onValidityChange,
  onValuesChange,
  onSave,
  isSaving = false,
  apiMode = "public",
  tokenReady = true,
}: CargasPublicasProps) {
  // En modo privado (detalle CTS) la tabla es de solo lectura: se muestra la
  // carga fusionada sin permitir alta/edición/eliminación desde aquí.
  const readOnly = apiMode === "private";
  const habilitarPublico = !readOnly && tokenReady;

  const [filas, setFilas] = useState<CargaRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...EMPTY_ROW });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // G21: eliminar una carga pide confirmación (paridad `tablaEditableMod.jsx`).
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Catálogos: variante pública o privada según el flujo. El value de la unidad
  // de medida es cod_tipo (lo que guarda tipo_id_unidad_medida), NO
  // cod_relacion_tipo (plan §7.D.4).
  const paisesPrivadoQ = paisesCatalogo.useLista(undefined, { enabled: readOnly });
  const paisesPublicoQ = paisesPublico.useLista(undefined, { enabled: habilitarPublico });
  const embalajePrivadoQ = tipos.useLista({ tipo_tabla: "embalaje" }, { enabled: readOnly });
  const embalajePublicoQ = tiposPublico.useLista(
    { tipo_tabla: "embalaje" },
    { enabled: habilitarPublico },
  );
  const unidadesPrivadoQ = relacionTipo.useLista(FILTRO_UNIDADES_MEDIDA, { enabled: readOnly });
  const unidadesPublicoQ = relacionTipoPublico.useLista(FILTRO_UNIDADES_MEDIDA, {
    enabled: habilitarPublico,
  });
  // G12: régimen aduanal es el mismo catálogo dinámico del backend que
  // alimenta el <select> del formulario (no una lista estática hardcodeada).
  const regimenPrivadoQ = tipos.useLista({ tipo_tabla: "REGIMEN_ADUANAL" }, { enabled: readOnly });
  const regimenPublicoQ = tiposPublico.useLista(
    { tipo_tabla: "REGIMEN_ADUANAL" },
    { enabled: habilitarPublico },
  );

  const paises = (readOnly ? paisesPrivadoQ.data : paisesPublicoQ.data) ?? [];
  const paisesLoading = readOnly ? paisesPrivadoQ.isLoading : paisesPublicoQ.isLoading;
  const tiposEmbalaje = (readOnly ? embalajePrivadoQ.data : embalajePublicoQ.data) ?? [];
  const unidadesMedida = (readOnly ? unidadesPrivadoQ.data : unidadesPublicoQ.data) ?? [];
  const regimenAduanalCatalog = (readOnly ? regimenPrivadoQ.data : regimenPublicoQ.data) ?? [];

  const embalajeOptions: Option[] = useMemo(
    () =>
      (tiposEmbalaje as unknown as CatalogoRaw[]).map((t) => ({
        value: asText(t.value ?? t.codTipo ?? t.cod_tipo),
        label: asText(t.label ?? t.nomTipo ?? t.nom_tipo),
      })),
    [tiposEmbalaje],
  );

  const unidadMedidaOptions: Option[] = useMemo(
    () =>
      (unidadesMedida as unknown as CatalogoRaw[]).map((u) => ({
        value: asText(u.codTipo ?? u.cod_tipo ?? u.value),
        label: asText(u.label ?? u.tipo_desc),
      })),
    [unidadesMedida],
  );

  const regimenOptions: Option[] = useMemo(
    () =>
      (regimenAduanalCatalog as unknown as CatalogoRaw[]).map((t) => ({
        value: asText(t.value ?? t.codTipo ?? t.cod_tipo),
        label: asText(t.label ?? t.nomTipo ?? t.nom_tipo),
      })),
    [regimenAduanalCatalog],
  );

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) {
      setFilas((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const mapped = normalizeCargaRows(data, unidadesMedida);
    setFilas((prev) => (JSON.stringify(prev) === JSON.stringify(mapped) ? prev : mapped));
  }, [data, unidadesMedida]);

  // Cada alta/edición/eliminación persiste vía `onSave`, así que no hay estado
  // "sin guardar": la validez se reporta como booleano y los valores actuales
  // se propagan al contenedor.
  useEffect(() => {
    onValidityChange?.(areCargaRowsValid(filas));
    onValuesChange?.(filas);
  }, [filas, onValidityChange, onValuesChange]);

  const totalCw = useMemo(() => filas.reduce((sum, it) => sum + asNumber(it.cw), 0), [filas]);

  const embalajeLabel =
    embalajeOptions.find((o) => o.value === asText(formData.tipoEmbalaje))?.label ?? "";
  const factorCmForm = getFactorCmPorUnidadMedida(formData.unidadMedida, unidadesMedida);
  const dimensiones = computeDimensiones(formData, embalajeLabel, factorCmForm);

  const handleOpenAdd = () => {
    setFormData({ ...EMPTY_ROW });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setFormData({ ...filas[index] });
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const persistir = (next: CargaRow[]) => {
    setFilas(next);
    onSave?.(next);
  };

  const handleDeleteConfirmado = () => {
    if (deleteIndex === null) return;
    persistir(filas.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  // El peso volumétrico y el CW se derivan en vivo desde `dimensiones`
  // (computeDimensiones), así que aquí solo se actualiza el campo editado.
  // G22/G11: cantidad se trunca a entero y la partida arancelaria se
  // autoformatea en pares con puntos, igual que el legacy.
  const handleFieldChange = (field: string, value: unknown) => {
    let valorNormalizado = value;
    if (field === "cantidad") valorNormalizado = normalizarCantidadCarga(value);
    else if (field === "partidaArancelaria") valorNormalizado = formatPartidaArancelaria(value);
    setFormData((prev) => ({ ...prev, [field]: valorNormalizado }));
  };

  const formValido = isCargaFormularioValido(formData);
  const camposInvalidos = getCamposInvalidosCargaFormulario(formData);

  const handleSaveDialog = () => {
    if (!formValido) return;
    const nuevaFila: CargaRow = {
      ...EMPTY_ROW,
      ...formData,
      definitivoGeneral:
        asText(formData.definitivoGeneral ?? "N").toUpperCase() === "S" ? "S" : "N",
      volumenTotal: dimensiones.pesoVolumetrico > 0 ? dimensiones.pesoVolumetrico : "",
      cw: dimensiones.cw > 0 ? dimensiones.cw : "",
      _gridId:
        editingIndex !== null
          ? (filas[editingIndex]?._gridId ?? `temp_id_${filas.length}`)
          : `temp_id_${filas.length}`,
    } as CargaRow;

    const next =
      editingIndex !== null
        ? filas.map((f, i) => (i === editingIndex ? nuevaFila : f))
        : [...filas, nuevaFila];
    persistir(next);
    setDialogOpen(false);
    setEditingIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const hayIncompletas = filas.length > 0 && !areCargaRowsValid(filas);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full min-w-0 space-y-3">
        {!readOnly && (
          <BannerInformativo
            ocultar={!hayIncompletas}
            severidad="warning"
            titulo="Datos incompletos"
            mensaje="Complete los campos obligatorios de los productos marcados antes de continuar."
          />
        )}

        <CargasPublicasTabla
          filas={filas}
          readOnly={readOnly}
          onEdit={handleOpenEdit}
          onDelete={setDeleteIndex}
          extraActions={
            !readOnly && (
              <Button size="sm" onClick={handleOpenAdd} disabled={isSaving || paisesLoading}>
                <Plus className="mr-1 size-4" />
                {paisesLoading ? "Cargando..." : "Agregar producto"}
              </Button>
            )
          }
          footer={
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              {readOnly ? (
                <span className="font-medium text-foreground">
                  {filas.length} producto{filas.length === 1 ? "" : "s"}
                </span>
              ) : null}
              <span>
                CW total: <strong className="text-foreground">{totalCw.toFixed(2)} kg</strong>
              </span>
            </div>
          }
        />

        <CargaFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isEditing={editingIndex !== null}
          saving={isSaving}
          formValido={formValido}
          camposInvalidos={camposInvalidos}
          formData={formData}
          dimensiones={dimensiones}
          embalajeOptions={embalajeOptions}
          regimenOptions={regimenOptions}
          unidadMedidaOptions={unidadMedidaOptions}
          paises={paises as Array<{ cod_pais: string | number; nombre_pais: string }>}
          onFieldChange={handleFieldChange}
          onSave={handleSaveDialog}
          readOnly={readOnly}
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

export default memo(CargasPublicas);
