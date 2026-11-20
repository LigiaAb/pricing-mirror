import type { Actividad } from "../api/actividades";

interface TipoActividad {
  codTipo: string | number;
  nomTipo: string;
}
interface EstadoActividad {
  cod_estado: string | number;
  estado_desc: string;
}

interface ActividadVista extends Actividad {
  nombreTipo: string;
  nombreEstado: string;
}

export function componerActividadVista(
  actividad: Actividad,
  tipos: TipoActividad[],
  estados: EstadoActividad[],
): ActividadVista {
  return {
    ...actividad,
    nombreTipo:
      actividad.nom_tipo ||
      tipos.find((tipo) => String(tipo.codTipo) === String(actividad.cod_tipo))?.nomTipo ||
      "",
    nombreEstado:
      actividad.estado_desc ||
      estados.find((estado) => String(estado.cod_estado) === String(actividad.cod_estado))
        ?.estado_desc ||
      "",
  };
}
