"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { paises as paisesCatalogo, relacionTipo, tipos } from "@/features/catalogos";
import {
  type CoordinacionCarga,
  useActualizarCoordinacionCarga,
  useCoordinacionCargas,
  useEliminarCoordinacionCarga,
  useInsertarCoordinacionCarga,
} from "@/features/coordinaciones";
import {
  fetchCoordinacionGastosCriterio,
  fetchUltimaVersionCoordinacionGastos,
  recalcularEmbarque,
} from "@/features/gastos";
import { logger } from "@/shared/lib/logger";
import { asNumber, asText } from "@/shared/lib/text";
import { useEmbarqueContext } from "../components/context";
import {
  buildCargaPayload,
  cargaTieneFaltantes,
  cargaToFormData,
  computeCargaCW,
  computeDimensiones,
  EMPTY_ROW,
  getFactorCmPorUnidadMedida,
} from "../lib/cargas-calculos";

export function useCargasCoordinacion(
  onValidityChange?: ((valid: boolean | string) => void) | undefined,
  onLoadingChange?: ((loading: boolean) => void) | undefined,
) {
  const { embarque_id: embarqueId } = useEmbarqueContext();

  const {
    data: cargas = [],
    isLoading: loadingCargas,
    refetch,
  } = useCoordinacionCargas(embarqueId ? String(embarqueId) : undefined);

  const insertar = useInsertarCoordinacionCarga({
    meta: { successMessage: "Producto agregado correctamente" },
  });
  const actualizar = useActualizarCoordinacionCarga({
    meta: { successMessage: "Producto actualizado correctamente" },
  });
  const eliminar = useEliminarCoordinacionCarga({
    meta: { successMessage: "Producto eliminado correctamente" },
  });

  const { data: tiposEmbalaje = [] } = tipos.useLista({ tipo_tabla: "embalaje" });
  // Unidades de medida por carga: relación-tipo de
  // coordinacion_carga bajo el padre 296. El value de la opción es cod_tipo
  // (lo que guarda tipo_id_unidad_medida), no cod_relacion_tipo.
  const { data: unidadesMedida = [] } = relacionTipo.useLista({
    tipo_tabla: "coordinacion_carga",
    cod_tipo_padre: 296,
  });
  const { data: regimenAduanal = [] } = tipos.useLista({ tipo_tabla: "REGIMEN_ADUANAL" });
  const { data: paises = [] } = paisesCatalogo.useLista();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...EMPTY_ROW });
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState(false);
  const originalCwRef = useRef<number>(0);
  const queryClient = useQueryClient();

  const embalajeOptions = tiposEmbalaje.map((e) => ({
    value: asText(e.codTipo),
    label: asText(e.nomTipo),
  }));

  const regimenOptions = regimenAduanal.map((r) => ({
    value: asText(r.codTipo),
    label: asText(r.nomTipo),
  }));

  const unidadMedidaOptions = unidadesMedida.map((u) => ({
    value: asText(u.cod_tipo),
    label: asText(u.tipo_desc),
  }));

  const embalajeOpt = embalajeOptions.find((o) => o.value === asText(formData.tipoEmbalaje));
  const factorCm = getFactorCmPorUnidadMedida(formData.unidadMedida, unidadesMedida);
  const dimensiones = computeDimensiones(formData, embalajeOpt?.label ?? "", factorCm);

  const hasCargas = cargas.length > 0;
  const cargasConFaltantes = cargas.filter(cargaTieneFaltantes);
  const tieneFaltantes = cargasConFaltantes.length > 0;

  useEffect(() => {
    onLoadingChange?.(loadingCargas);
  }, [loadingCargas, onLoadingChange]);

  useEffect(() => {
    onValidityChange?.(!!(hasCargas && !tieneFaltantes));
  }, [hasCargas, tieneFaltantes, onValidityChange]);

  const handleOpenAdd = () => {
    setFormData({ ...EMPTY_ROW });
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (carga: CoordinacionCarga) => {
    setFormData(cargaToFormData(carga));
    setEditingId(carga.embCargaId);
    originalCwRef.current = computeCargaCW(carga, unidadesMedida);
    setDialogOpen(true);
  };

  const handleDelete = async (carga: CoordinacionCarga) => {
    const id = asNumber(carga.embCargaId);
    if (!id || !embarqueId) return;
    try {
      await eliminar.mutateAsync({ emb_carga_id: id });
      void refetch();
    } catch (err) {
      logger.error("Error eliminando carga:", err);
    }
  };

  const ejecutarRecalculoEmbarque = async () => {
    if (!embarqueId) return;
    try {
      const refResult = await refetch();
      const filas = (refResult.data ?? []) as CoordinacionCarga[];
      const totalPeso = filas.reduce((sum, c) => sum + (Number(c.peso) || 0), 0);
      const totalCw = filas.reduce((sum, c) => sum + computeCargaCW(c, unidadesMedida), 0);

      const ultima = await fetchUltimaVersionCoordinacionGastos(String(embarqueId));
      const version = ultima.embarque_version ?? 1;

      const criterios = await fetchCoordinacionGastosCriterio(Number(embarqueId), Number(version));

      const criteriosMap: Record<string, string> = {};
      for (const item of criterios) {
        if (item.criterioCampo) {
          criteriosMap[item.criterioCampo] = String(item.valor);
        }
      }

      await recalcularEmbarque({
        embarque_id: Number(embarqueId),
        embarque_version: Number(version),
        criterios: {
          ...criteriosMap,
          valor_por_peso: String(totalPeso),
          valor_cw: String(totalCw),
        },
        guardar: true,
      });

      queryClient.invalidateQueries({
        queryKey: ["ultima-version-coordinacion-gastos", String(embarqueId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["listar-coordinacion-gastos", String(embarqueId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["listar-coordinacion-gastos-criterio", String(embarqueId)],
      });
    } catch (err) {
      logger.warn("Recalculo de embarque falló:", err);
    }
  };

  const handleSave = async () => {
    if (!embarqueId) return;
    setSaving(true);
    try {
      const payload = buildCargaPayload(embarqueId, formData, dimensiones);

      if (editingId) {
        await actualizar.mutateAsync({ ...payload, emb_carga_id: Number(editingId) });
        const cwCambio = originalCwRef.current !== (dimensiones.cw || 0);
        if (cwCambio) {
          await ejecutarRecalculoEmbarque();
        }
      } else {
        await insertar.mutateAsync(payload);
      }
      setDialogOpen(false);
      void refetch();
    } catch (err) {
      logger.error("Error guardando carga:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    cargas,
    loadingCargas,
    refetch,
    hasCargas,
    tieneFaltantes,
    dialogOpen,
    setDialogOpen,
    formData,
    editingId,
    saving,
    dimensiones,
    embalajeOptions,
    regimenOptions,
    unidadMedidaOptions,
    unidadesMedida,
    paises,
    handleOpenAdd,
    handleOpenEdit,
    handleDelete,
    handleSave,
    handleFieldChange,
  };
}
