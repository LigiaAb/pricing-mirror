import type { CotizacionParaCalculo } from "./cabecera";
import type { Id } from "./tipos";

/** Props de `CalculoCotizacion` (components/calculo-cotizacion.tsx); las usan también sus hooks. */
export type CalculoCotizacionProps = {
  /** Cabecera de la cotización (campos definidos en lib/cabecera.ts). */
  cotizacion: CotizacionParaCalculo;

  plantillaSeleccionada?: {
    cod_tarifaplantilla?: Id | null;
    carrier_id?: Id | null;

    criterios?: Array<{
      campo: string;
      cod_tipo_dato?: string | number | null;
    }>;

    [key: string]: unknown;
  } | null;

  codUsuario?: Id | null;

  onActualizarEstadoCabecera?: (payload: {
    cod_cotizacion_cabecera: Id;
    cod_estado: Id;
  }) => Promise<unknown>;

  /*
   * Los catálogos ya NO llegan por props: se leen con useCatalogosCotizacion()
   * (ver hooks/use-catalogos-cotizacion.tsx).
   */

  /*
   * Servicios que la plantilla solicita seleccionar automáticamente
   * en Due Agent.
   */
  serviciosAutoSeleccion?: Id[];

  filtrosCalculo: Record<string, unknown>;

  /*
   * Permisos de la pantalla (opción "Información" de Cotizaciones). Por defecto
   * todo permitido: los lee GestionCotizacion y los pasa por aquí.
   *   - puedeAgregar: "Nuevo cálculo" y guardar la versión nueva.
   *   - puedeEditar: "Activar versión".
   */
  puedeAgregar?: boolean | undefined;
  puedeEditar?: boolean | undefined;
};
