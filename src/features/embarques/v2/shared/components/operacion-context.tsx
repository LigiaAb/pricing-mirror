"use client";

import { createContext, use } from "react";
import type { DefinicionOperacion } from "../lib/operacion";

/**
 * Operación del embarque seleccionado (pasos, actividades, tabs…).
 * La entrega `VistaGeneral`; null = no hay embarque o su operación no está definida.
 */
export const OperacionContext = createContext<DefinicionOperacion | null>(null);

/** Operación del embarque seleccionado (dentro de `VistaGeneral`, con operación definida). */
export function useOperacion(): DefinicionOperacion {
  const operacion = use(OperacionContext);
  if (!operacion) throw new Error("useOperacion: no hay operación del embarque seleccionado");
  return operacion;
}
