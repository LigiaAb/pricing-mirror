import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";
import { createDataMutationHook } from "../../Fetch/useFunctions";

/**
 * Hook para obtener lista de incoterms desde el backend BPM.
 * @param {Object} filters - Filtros opcionales (por ejemplo incoterm_id, codigo)
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con incoterms mapeados
 */
export function useFetchIncoterms(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["incoterms", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-incoterm", {
        params: filters,
      });
      return extractResponseData(response)
        .map((item) => {
          const codigo = item.CODIGO ?? item.codigo ?? "";
          const nombreEng = item.NOMBRE_ENG ?? item.nombre_eng ?? "";
          const nombre = item.NOMBRE ?? item.nombre ?? "";
          const incotermId = item.INCOTERM_ID ?? item.incoterm_id;

          // build label as "codigo (nombre_eng): nombre" – matches UI change
          const codePart = codigo || "";
          const engPart = nombreEng || "";
          const namePart = nombre || "";
          let fullLabel = "";
          if (codePart || engPart) {
            fullLabel = `${codePart} (${engPart})`;
            if (namePart) {
              fullLabel += `: ${namePart}`;
            }
          } else if (namePart) {
            fullLabel = namePart;
          }

          return {
            incoterm_id: incotermId,
            codigo,
            nombre,
            nombre_eng: nombreEng,
            descripcion: item.DESCRIPCION ?? item.descripcion,
            value: incotermId,
            label: fullLabel,
          };
        })
        .filter((opt) => opt.value != null && opt.label !== "");

    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}

// Mutations para incoterms
// las claves de caché se alinean con el queryKey usado arriba para permitir
// invalidación automática cuando se realizan operaciones.
export const useInsertarIncoterm = createDataMutationHook(
  ["incoterms"],
  "/api/appweb/insertar-incoterm",
  (res) => res,
);

export const useActualizarIncoterm = createDataMutationHook(
  ["incoterms"],
  "/api/appweb/actualizar-incoterm",
  (res) => res,
);

export const useEliminarIncoterm = createDataMutationHook(
  ["incoterms"],
  "/api/appweb/eliminar-incoterm",
  (res) => res,
);
