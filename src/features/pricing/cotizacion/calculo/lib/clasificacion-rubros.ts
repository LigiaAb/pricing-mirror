export const CLASIFICACIONES_DUE_CARRIER = [274, 276, 278, 347] as const;

export const CLASIFICACIONES_DUE_AGENT = [275, 277] as const;

export type RubroClasificable = {
  clasificacion?: string | number | null;

  servicio_clasificacion?: string | number | null;

  servicio?: {
    clasificacion?: string | number | null;

    servicio_clasificacion?: string | number | null;
  } | null;
};

export function getClasificacionServicio(item?: RubroClasificable | null) {
  return (
    item?.servicio?.clasificacion ??
    item?.clasificacion ??
    item?.servicio?.servicio_clasificacion ??
    item?.servicio_clasificacion ??
    null
  );
}

export function esRubroDueAgent(item?: RubroClasificable | null) {
  const clasificacion = getClasificacionServicio(item);

  if (clasificacion == null || clasificacion === "") {
    return false;
  }

  return CLASIFICACIONES_DUE_AGENT.includes(
    Number(clasificacion) as (typeof CLASIFICACIONES_DUE_AGENT)[number],
  );
}

export function esRubroDueCarrier(item?: RubroClasificable | null) {
  const clasificacion = getClasificacionServicio(item);

  if (clasificacion == null || clasificacion === "") {
    return true;
  }

  return CLASIFICACIONES_DUE_CARRIER.includes(
    Number(clasificacion) as (typeof CLASIFICACIONES_DUE_CARRIER)[number],
  );
}
export function esClasificacionDueAgent(clasificacion?: string | number | null) {
  if (clasificacion == null || clasificacion === "") {
    return false;
  }

  return CLASIFICACIONES_DUE_AGENT.includes(
    Number(clasificacion) as (typeof CLASIFICACIONES_DUE_AGENT)[number],
  );
}

export function esClasificacionDueCarrier(clasificacion?: string | number | null) {
  /*
   * Regla tomada de GridVersionesDetalles:
   * clasificación null => Due Carrier.
   */
  if (clasificacion == null || clasificacion === "") {
    return true;
  }

  return CLASIFICACIONES_DUE_CARRIER.includes(
    Number(clasificacion) as (typeof CLASIFICACIONES_DUE_CARRIER)[number],
  );
}
