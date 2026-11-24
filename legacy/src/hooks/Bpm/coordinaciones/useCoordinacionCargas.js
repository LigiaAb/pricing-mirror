import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

const mapCarga = (item) => ({
  embCargaId: item.EMB_CARGA_ID,
  embarqueId: item.EMBARQUE_ID,
  codFile: item.COD_FILE,
  embLegsId: item.EMB_LEGS_ID,
  rubroId: item.RUBRO_ID,
  rubroNombre: item.RUBRO_NOMBRE,
  bultos: item.BULTOS,
  tipoUnidadMedidaId: item.TIPO_ID_UNIDAD_MEDIDA,
  tipoDescripcion: item.TIPO_DESCRIPCION,
  peso: item.PESO,
  volumen: item.VOLUMEN,
  metrosCubicos: item.METROS_CUBICOS,
  cw: item.CW,
  valor: item.VALOR,
  pesoTotal: item.PESO_TOTAL ?? item.PESO ?? item.peso ?? 0,
  estadoId: item.ESTADO_ID,
  estadoDescripcion: item.ESTADO_DESCRIPCION,
  fechaRegistro: item.FECHA_REGISTRO,
  descripcionCarga: item.DESCRIPCION_CARGA,
  paisOrigenId: item.PAIS_ID_ORIGEN,
  partidaArancelaria: item.PARTIDA_ARANCELARIA,
  regimenAduanal: item.REGIMEN_ADUANAL,
  definitivoGeneral: item.DEFINITIVO_GENERAL,
  codTipoEmbalaje: item.COD_TIPO_EMBALAJE ?? item.TIPO_EMBALAJE ?? null,
  valorDeclaradoAduana: item.VALOR_DECLARADO_ADUANA,
  repeso: item.REPESO,
  largo: item.LARGO ?? item.largo ?? item.LARGO_CM ?? item.largo_cm ?? null,
  alto: item.ALTO ?? item.alto ?? item.ALTO_CM ?? item.alto_cm ?? null,
  ancho: item.ANCHO ?? item.ancho ?? item.ANCHO_CM ?? item.ancho_cm ?? null,
});

export const fetchCoordinacionCargas = async (embarque_id) => {
  const { data } = await api.get("/api/appweb/listar-coordinacion-carga", {
    params: { embarque_id },
  });
  return extractFromData(data).map(mapCarga);
};

/**
 * Hook para obtener cargas de una coordinación.
 * Nota: los campos `rubroId` y `cw` pueden ser nulos/ausentes (ahora opcionales en la API/frontend).
 * @param {string|number} embarque_id - ID del embarque
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con cargas mapeadas
 */
export function useCoordinacionCargas(embarque_id, options = {}) {
  return useQuery({
    queryKey: ["coordinacion-cargas", String(embarque_id)],
    queryFn: () => fetchCoordinacionCargas(embarque_id),
    enabled: !!embarque_id,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
