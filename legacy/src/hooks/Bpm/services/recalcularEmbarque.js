import { useState } from "react";
import { useSelector } from "react-redux";
import useRecalcularEmbarque from "../Gastos/useRecalcularEmbarque";
import { mapCriteriosConValor } from "../Gastos/useObtenerCriteriosConValor";
import { fetchCoordinacionGastosCriterio } from "../Gastos/useListarCoordinacionGastosCriterio";
import { useObtenerUltimaVersionCoordinacionGastos } from "../Gastos/useObtenerUltimaVersionCoordinacionGastos";
import { useUpdateCoordinacionEstado } from "../coordinaciones/useCoordinacionMutations";

/**
 * Recalcula un embarque luego de guardar o insertar una coordinación de carga,
 * actualizando los criterios valor_por_peso y valor_cw con la suma de todas las cargas.
 *
 * @param {Object} params
 * @param {string|number} params.embarqueId - ID del embarque activo
 *
 * @returns {{ recalcularConCargas: (filas: Array) => Promise<void> }}
 */
const normalizeCodCc = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sumCargaValores = (cargas, selector) =>
  (Array.isArray(cargas) ? cargas : []).reduce((sum, carga) => {
    const value = selector(carga);
    return sum + toSafeNumber(value);
  }, 0);

export function useRecalcularEmbarqueConCargas({ embarqueId, cod_cc: codCcOverride = null }) {
  const recalcular = useRecalcularEmbarque();
  const currentCentroCosto = useSelector((state) => state.menu.currentCentroCosto);

  const codCc = normalizeCodCc(codCcOverride ?? currentCentroCosto?.cod_cc);

  const { data: ultimaVersionData, refetch: refetchUltimaVersion } =
    useObtenerUltimaVersionCoordinacionGastos(embarqueId, {
      enabled: !!embarqueId,
    });
  const ultimaVersion = ultimaVersionData?.embarque_version;

  /**
   * Dispara el recálculo del embarque con los totales de peso y CW calculados
   * a partir del array de filas (estado local del componente de cargas).
   *
   * Las filas deben tener los campos `pesoTotal` (kg) y `cw` tal como los
   * maneja el estado de CargasSection.
   *
   * @param {Array} filas - Array de filas del estado local (pesoTotal, cw)
   */
  const recalcularConCargas = async (filas) => {
    if (!embarqueId || !Array.isArray(filas)) return;

    const totalPeso = filas.reduce((sum, f) => sum + (Number(f.pesoTotal) || 0), 0);
    const totalCw = filas.reduce((sum, f) => sum + (Number(f.cw) || 0), 0);

    try {
      // Obtener la versión más reciente para evitar condición de carrera
      let nuevaVersion = ultimaVersion ?? 1;
      try {
        const refetchRes = await refetchUltimaVersion();
        if (refetchRes?.data?.embarque_version != null) {
          nuevaVersion = Number(refetchRes.data.embarque_version);
        }
      } catch (err) {
        console.error("useRecalcularEmbarqueConCargas: no se pudo obtener la última versión:", err);
      }

      // Recargar criterios de esa versión antes de recalcular
      let criteriosMapa = {};
      try {
        const criteriosArr = await fetchCoordinacionGastosCriterio(embarqueId, nuevaVersion);
        criteriosMapa = mapCriteriosConValor(criteriosArr, embarqueId, {
          exclude: ["valor_por_peso", "valor_cw"],
        });
      } catch (err) {
        console.warn("useRecalcularEmbarqueConCargas: no se pudo recargar criterios:", err);
      }

      // Calcular el mayor valor entre el peso total y el CW total actual
      const mayorValor = Math.max(totalPeso, totalCw);
      // Actualizar criterios con el mayor valor para valor_cw
      criteriosMapa.valor_cw = String(mayorValor);

      const payload = {
        embarque_id: Number(embarqueId),
        embarque_version: Number(nuevaVersion),
        cod_cc: codCc,
        criterios: {
          valor_por_peso: String(totalPeso),
          valor_cw: String(mayorValor),
          ...criteriosMapa,
        },
        guardar: true,
      };

      await recalcular.mutateAsync(payload);
      recalcular.queryClient.invalidateQueries({
        queryKey: ["ultima-version-coordinacion-gastos", embarqueId],
      });
      recalcular.queryClient.invalidateQueries({
        queryKey: ["listar-coordinacion-gastos", embarqueId, nuevaVersion],
      });
      recalcular.queryClient.invalidateQueries({
        queryKey: ["listar-coordinacion-gastos-criterio", embarqueId, nuevaVersion],
      });
    } catch (err) {
      console.error("useRecalcularEmbarqueConCargas: error al recalcular:", err);
    }
  };

  return { recalcularConCargas };
}

/**
 * Encapsula la secuencia completa para recalcular un embarque tras guardar un repeso:
 *   1. Calcular nuevo total de kilos a partir del array de cargas + el repeso aplicado
 *   2. Refetch de última versión de gastos (evita condición de carrera)
 *   3. Refetch y remapeo de criterios para esa versión
 *   4. Llamada al servicio de recálculo con el payload completo
 *   5. Actualización del estado de coordinación a REPESADO (cod: 66)
 *   6. Invalidación de caché relevante + recarga de cargas
 *
 * @param {Object}   params.registro      - Registro del embarque/coordinación activo
 * @param {Array}    params.cargas        - Array de cargas del embarque
 * @param {Function} [params.refetchCargas] - Callback para recargar la tabla de cargas
 *
 * @returns {{ handleRepesoBilladoSuccess, snackbar, cerrarSnackbar }}
 */
export function useRecalcularEmbarqueConRepeso({ registro, cargas, refetchCargas }) {
  const recalcular = useRecalcularEmbarque();
  const updateEstado = useUpdateCoordinacionEstado();
  const currentCentroCosto = useSelector((state) => state.menu.currentCentroCosto);

  const codCc = normalizeCodCc(
    registro?.cencod_id ??
    registro?.CENCOD_ID ??
    registro?.cencodId ??
    registro?.cod_cc ??
    registro?.COD_CC ??
    currentCentroCosto?.cod_cc,
  );

  const { data: ultimaVersionData, refetch: refetchUltimaVersion } =
    useObtenerUltimaVersionCoordinacionGastos(registro?.embarqueId, {
      enabled: !!registro?.embarqueId,
    });
  const ultimaVersion = ultimaVersionData?.embarque_version;

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const cerrarSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // Callback que recibe EditCargasTabla tras persistir el repeso.
  // La fase "before" se ignora; sólo actuamos en "after" cuando el backend
  // ya tiene el valor guardado.
  const handleRepesoBilladoSuccess = async (rowData, embCargaId, options = {}) => {
    const { phase } = options;
    if (phase === "before") return;

    // Paso 1: nuevo total de kilos considerando el repeso recién aplicado
    const resolverValor = (c) => {
      const esFilaActual = String(c?.embCargaId) === String(embCargaId);
      if (esFilaActual && rowData?.repeso == null) return c?.peso;
      if (esFilaActual) return rowData?.repeso;
      if (c?.repeso == null) return c?.peso;
      return c?.repeso;
    };
    const totalRepeso = sumCargaValores(cargas, resolverValor);
    const totalVolumen = sumCargaValores(cargas, (c) => c?.volumen);
    const mayorValor = Math.max(totalRepeso, totalVolumen);

    try {
      // Paso 2: versión más reciente para evitar condición de carrera
      let nuevaVersion = ultimaVersion ?? 1;
      try {
        const refetchRes = await refetchUltimaVersion();
        if (refetchRes?.data?.embarque_version != null) {
          nuevaVersion = Number(refetchRes.data.embarque_version);
        }
      } catch (err) {
        console.error("No se pudo obtener la última versión de coordinación de gastos:", err);
        setSnackbar({
          open: true,
          message: "No se pudo obtener la última versión de coordinación de gastos.",
          severity: "error",
        });
        throw err;
      }

      // Paso 3: recargar criterios de esa versión antes del recálculo
      let criteriosMapa = {};
      try {
        const criteriosArr = await fetchCoordinacionGastosCriterio(registro?.embarqueId, nuevaVersion);
        criteriosMapa = mapCriteriosConValor(criteriosArr, registro?.embarqueId, {
          exclude: ["valor_por_peso"],
        });
      } catch (err) {
        console.warn("No se pudo recargar criterios de gastos:", err);
      }

      // Paso 4: recalcular usando el mayor entre volumen total y repeso total
      criteriosMapa.valor_cw = String(mayorValor);

      const payload = {
        embarque_id: Number(registro?.embarqueId),
        embarque_version: Number(nuevaVersion),
        cod_cc: codCc,
        criterios: { valor_por_peso: String(totalRepeso), ...criteriosMapa },
        guardar: true,
      };

      recalcular.mutateAsync(payload)
        .then(async () => {
          // Paso 5: actualizar estado a REPESADO antes de invalidar caché
          try {
            await updateEstado.mutateAsync({
              embarque_id: Number(registro?.embarqueId),
              cod_file: rowData?.codFile || registro?.cod_file,
              cod_estado_actual: rowData?.estadoId || registro?.cod_estado_actual,
              cod_estado_siguiente: 66,
            });
            updateEstado.queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
          } catch (err) {
            console.error("Error actualizando estado de coordinación tras recálculo:", err);
          }

          // Paso 6: invalidar caché relevante
          recalcular.queryClient.invalidateQueries({
            queryKey: ["ultima-version-coordinacion-gastos", registro?.embarqueId],
          });
          recalcular.queryClient.invalidateQueries({
            queryKey: ["listar-coordinacion-gastos", registro?.embarqueId, nuevaVersion],
          });
          recalcular.queryClient.invalidateQueries({
            queryKey: ["listar-coordinacion-gastos-criterio", registro?.embarqueId, nuevaVersion],
          });
          recalcular.queryClient.invalidateQueries({
            queryKey: ["coordinacion-cargas", registro?.embarqueId],
          });

          setSnackbar({ open: true, message: "Re-cálculo completado correctamente.", severity: "success" });
          if (refetchCargas) refetchCargas();
        })
        .catch((err) => {
          console.error("Error al recalcular embarque:", err);
          setSnackbar({
            open: true,
            message: err?.message || "Error en re-cálculo",
            severity: "error",
          });
        });
    } catch (err) {
      console.error("Error al preparar recalculo:", err);
    }
  };

  return { handleRepesoBilladoSuccess, snackbar, cerrarSnackbar };
}
