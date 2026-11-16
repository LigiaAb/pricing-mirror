/**
 * Adaptador de la coordinación privada (`Coordinacion`, mapeada por
 * features/coordinaciones) al shape camelCase que consumen los constructores
 * de la carta de instrucciones (`construirEntidadesPublicas`,
 * `construirDetallesData`, `resolveEntidadId`) — el mismo contrato que expone
 * `resumen-coordinacion` en la vista pública. Así el detalle CTS privado y el
 * wizard público comparten exactamente la misma capa de display.
 */

import type { Coordinacion } from "@/features/coordinaciones";

export type JsonRecord = Record<string, unknown>;

export function adaptarCoordinacionParaCarta(
  coordinacion: Coordinacion | null | undefined,
): JsonRecord {
  if (!coordinacion) return {};
  const c = coordinacion;
  return {
    codFile: c.cod_file ?? null,
    tipoIdEmbarque: c.tipo_id_embarque ?? null,
    entidadIdCli: c.entidadIdCli ?? null,
    idServicio: c.id_servicio ?? null,
    tipoIdCarga: c.tipo_id_carga ?? null,
    incotermId: c.incoterm_id ?? null,
    tipoIdPago: c.tipo_id_pago ?? null,
    estadoId: c.estadoId ?? null,
    observaciones: c.observaciones ?? null,
    entidadIdShipper: c.entidadIdShipper ?? null,
    entidadIdConsignatario: c.entidadIdConsignatario ?? null,
    contactoIdCliente: c.contactoIdCliente ?? null,
    clasificacionCargaId: c.clasificacionCargaId ?? null,
    peligrosidad: c.peligrosidad ?? null,
    entidadShipperNombre: c.entidadShipperNombre ?? null,
    entidadConsignatarioNombre: c.entidadConsignatarioNombre ?? null,
    nitExp: c.identificacionNumero ?? null,
    direccionExp: c.direccionRecoleccion ?? null,
    nitConsignatario: c.consIdentificacionNumero ?? null,
    direccionConsignatario: c.consDireccion ?? null,
    cliente: c.cliente ?? null,
  };
}
