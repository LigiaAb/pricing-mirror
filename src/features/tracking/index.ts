/* STUB del repo espejo: solo tipos de lo que embarques usa de @/features/tracking.
 * NO copiar al proyecto real (allá existe el módulo completo).
 * Tomado del uso en la pantalla original y de la interfaz enviada por el usuario. */

import type * as React from "react";

/** En el proyecto real es un tipo propio; aquí basta como texto. */
export type DireccionTracking = string;

/** Movimiento normalizado que el host traduce al endpoint de su dominio. */
export interface ActualizarEstadoTrackingPayload {
  direccion: DireccionTracking;
  /** Índice base cero del nuevo paso. */
  codEstado: number;
  /** Fecha de seguimiento en formato ISO 8601. */
  fechaSeguimiento: string;
  observacion?: string;
  notificarPasoActual: boolean;
  descripcionPasoActual?: string;
  descripcionPasoNuevo?: string;
  finalizando: boolean;
}

export interface TrackingDetalleProps {
  codInterno: number;
  codTipo: number;
  estadoActual: number;
  puedeRetroceder?: boolean;
  renderEncabezadoProceso?: (props: unknown) => React.ReactNode;
  etiqueta?: string;
  ocupado?: boolean;
  onActualizarEstado: (payload: ActualizarEstadoTrackingPayload) => void | Promise<void>;
  coordinacionId: string | number;
}

export declare function TrackingDetalle(props: TrackingDetalleProps): React.ReactNode;
