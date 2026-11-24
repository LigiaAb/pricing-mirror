import { useQuery } from "@tanstack/react-query";
import { CACHE_DYNAMIC } from "../utils";
import {
  recuperarFilaCartaInstruccionesPrivado,
  recuperarFilaCartaInstruccionesPublico,
  extraerJsonCartaInstrucciones,
  extraerFilaCartaInstrucciones,
} from "./useCartaInstrucciones";

// Constantes del módulo de carta de instrucciones (CTS).
const COD_MODULO = 12;
const COD_CC = 16;
const COD_EMPRESA = 1;

/**
 * Lectura UNIFICADA de la carta de instrucciones para ambas vistas.
 *
 * Recupera la fila (`fila-carta-instrucciones` privado o público según `apiMode`)
 * y la pasa por `extraerJsonCartaInstrucciones`, que fusiona json_data +
 * json_data_usuario en un único `jsonCarta`. Así las dos vistas comparten exactamente
 * la misma ruta de lectura/fusión y muestran las modificaciones del cliente.
 *
 * En modo público el token va en localStorage (header) — el caller debe pasar
 * `enabled: tokenReady` para no disparar el fetch antes de tiempo.
 *
 * @returns { jsonCarta, filaCarta, codLinkPublico, refetch, isFetched, isLoading, isFetching }
 */
export function useCartaInstruccionesData({
  cotizacionCabeceraId,
  apiMode = "private",
  enabled = true,
} = {}) {
  const habilitado =
    Boolean(enabled) && cotizacionCabeceraId !== undefined && cotizacionCabeceraId !== null && cotizacionCabeceraId !== "";

  const query = useQuery({
    queryKey: ["carta-instrucciones-data", apiMode, cotizacionCabeceraId],
    queryFn: async () => {
      const recuperar =
        apiMode === "private"
          ? recuperarFilaCartaInstruccionesPrivado
          : recuperarFilaCartaInstruccionesPublico;

      const response = await recuperar({
        cod_cotizacion_cabecera: Number(cotizacionCabeceraId),
        cod_modulo: COD_MODULO,
        cod_cc: COD_CC,
        cod_empresa: COD_EMPRESA,
      });

      return {
        jsonCarta: extraerJsonCartaInstrucciones(response) ?? null,
        filaCarta: extraerFilaCartaInstrucciones(response) ?? null,
      };
    },
    enabled: habilitado,
    ...CACHE_DYNAMIC,
    // El cliente edita desde el link público en una sesión completamente aparte:
    // si el operador ya tenía esta carta en cache (p.ej. navegó a la lista y
    // volvió a entrar dentro de los 5 min de staleTime), React Query no
    // refetchea al montar porque los datos aún no están "stale". Forzar
    // refetch en cada montaje evita que el operador vea la carta desactualizada
    // sin tener que recargar la página completa.
    refetchOnMount: "always",
  });

  const filaCarta = query.data?.filaCarta ?? null;
  const codLinkPublico = filaCarta?.cod_link_publico ?? filaCarta?.COD_LINK_PUBLICO ?? null;

  // El backend reutiliza `cod_mensaje: 1002` (token vencido) para indicar que
  // la gestión CTS ya culminó: la fila vuelve con `{ success: false, cod_mensaje:
  // 1002, mensaje: "La gestion ya culmino..." }` y sin `json_data`. El caller
  // (CTS/[id]/page.jsx) usa este flag para mostrar la SuccessScreen en vez del
  // formulario vacío, y para suprimir el modal global de "Sesión finalizada".
  const yaCulmino = Number(filaCarta?.cod_mensaje) === 1002;

  // `cod_mensaje: 1003` indica que el token de interacción del link público
  // expiró: la fila vuelve con `{ success: false, cod_mensaje: 1003, mensaje:
  // "Token expirado" }`. El caller (public/page.jsx) usa este flag para
  // reemplazar el formulario por un aviso pidiéndole al cliente que solicite
  // un nuevo link, en vez de mostrar el formulario vacío o el modal global de
  // "Sesión finalizada".
  const tokenExpirado = Number(filaCarta?.cod_mensaje) === 1003;

  return {
    jsonCarta: query.data?.jsonCarta ?? null,
    filaCarta,
    codLinkPublico,
    yaCulmino,
    mensajeCulmino: yaCulmino ? filaCarta?.mensaje ?? "" : "",
    tokenExpirado,
    mensajeTokenExpirado: tokenExpirado ? filaCarta?.mensaje ?? "" : "",
    refetch: query.refetch,
    isFetched: query.isFetched,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
