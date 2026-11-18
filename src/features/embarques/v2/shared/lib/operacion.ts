/* ==========================================================================
 * DEFINICIÓN DE UNA OPERACIÓN (transporte × expo/impo)
 *
 * Todo lo que cambia entre operaciones vive en una `DefinicionOperacion`:
 * pasos del tracking, actividades, tabs, responsables (perfil y gestión),
 * formularios propios y los campos de Información que dependen del transporte.
 * Los componentes la leen del embarque seleccionado (`useOperacion()`), nunca
 * de una lista fija.
 *
 * Las definiciones son la fuente de verdad (no hay Excel para todas las
 * operaciones): `validarOperacion` revisa que sean consistentes.
 * Registro de operaciones: `general/lib/registro-operaciones.ts`.
 * ========================================================================== */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { PropsActividad } from "../components/tarjeta-actividad";
import type { ActividadTracking } from "./actividades-tracking";
import {
  CAMPOS_CONSIGNATARIO,
  CAMPOS_DETALLES,
  CAMPOS_FACTURACION,
  CAMPOS_NOTIFICACION,
  CAMPOS_SHIPPER,
  type CampoEmbarque,
} from "./campos-embarque";
import type { DefinicionesGestion, GestionActividad } from "./gestion-actividades";
import type {
  InformacionEmbarque,
  PasoTracking,
  PerfilEmbarque,
  ResponsableTracking,
} from "./tipos";

export type TransporteOperacion = "aereo" | "maritimo" | "terrestre";
export type SentidoOperacion = "expo" | "impo";

/** Clave de la operación, ej. `"aereo-expo"`. */
export type ClaveOperacion = `${TransporteOperacion}-${SentidoOperacion}`;

/** Tab de gestión del embarque. */
export type PasoEmbarque = {
  /** Único dentro de la operación. `informacion`, `archivos` y `bitacora` tienen su propio contenido. */
  value: string;
  label: string;
  /** Subtítulo corto en la tab. */
  detalle: string;
  /** Descripción en el encabezado del contenido. */
  descripcion: string;
  icono: LucideIcon;
  /**
   * Actividades que se trabajan en esta tab (ids de `actividades` de la
   * operación). De aquí salen el paso y los perfiles.
   */
  actividades: readonly string[];
  /** Tabs que van separadas al final (siempre disponibles u opcionales). */
  grupo: "flujo" | "extra";
  /** Aviso destacado arriba del contenido. */
  aviso?: string;
  /** Tab sin actividades que ven todos los perfiles (Información, Archivos). */
  paraTodos?: boolean;
  /** Tab en rojo (ej. Cancelación). */
  destructiva?: boolean;
};

/** Formulario de una actividad (tarjeta común o uno propio del actor). */
export type FormularioActividad = (
  props: PropsActividad & { gestion: GestionActividad },
) => ReactNode;

/** Área responsable dentro de la operación. */
export type ResponsableOperacion = {
  /** Pantalla (perfil) que trabaja sus actividades. */
  perfil: PerfilEmbarque;
  /** Cómo se trabaja cada una de sus actividades, por id. */
  gestion: DefinicionesGestion;
};

export type DefinicionOperacion = {
  clave: ClaveOperacion;
  /** Nombre para mostrar (ej. "Exportación Aérea"). */
  nombre: string;
  /** Pasos del tracking general (ids 1..n, en orden). */
  pasos: readonly PasoTracking[];
  /** Actividades de la operación; `id` único dentro de ella. */
  actividades: readonly ActividadTracking[];
  /** Tabs de gestión, en orden. */
  tabs: readonly PasoEmbarque[];
  /** Áreas responsables (las que usen sus actividades). */
  responsables: Partial<Record<ResponsableTracking, ResponsableOperacion>>;
  /** Formularios propios por id de actividad (sin entrada: la tarjeta común). */
  formularios?: Readonly<Record<string, FormularioActividad>>;
  /** Campos de Información que dependen del transporte. */
  informacion: {
    rutas: readonly CampoEmbarque[];
    fechas: readonly CampoEmbarque[];
    producto: readonly CampoEmbarque[];
    /** Icono de la card Rutas (ej. avión, barco, camión). */
    iconoRutas: LucideIcon;
  };
};

/* --------------------------------------------------------------------------
 * CONSULTAS
 * ------------------------------------------------------------------------ */

/** Actividades de esos ids, en el orden de `ids` (los que no existen se omiten). */
export function actividadesPorId(
  operacion: DefinicionOperacion,
  ids: readonly string[],
): ActividadTracking[] {
  return ids.flatMap((id) => operacion.actividades.find((actividad) => actividad.id === id) ?? []);
}

export function actividadesDelPaso(
  operacion: DefinicionOperacion,
  paso: number,
): ActividadTracking[] {
  return operacion.actividades.filter((actividad) => actividad.paso === paso);
}

/** Paso del tracking por id. */
export function pasoTrackingDe(
  operacion: DefinicionOperacion,
  id: number | undefined,
): PasoTracking | undefined {
  return operacion.pasos.find((paso) => paso.id === id);
}

/** Perfil del área responsable (undefined si la operación no la define). */
export function perfilDeResponsable(
  operacion: DefinicionOperacion,
  responsable: ResponsableTracking,
): PerfilEmbarque | undefined {
  return operacion.responsables[responsable]?.perfil;
}

/** Áreas responsables de la operación, en el orden en que se definen. */
export function responsablesDe(operacion: DefinicionOperacion): ResponsableTracking[] {
  return (Object.keys(operacion.responsables) as ResponsableTracking[]).filter(
    (responsable) => operacion.responsables[responsable] != null,
  );
}

/** Gestión de la actividad (la de su responsable en esta operación). */
export function gestionDeActividad(
  operacion: DefinicionOperacion,
  actividad: ActividadTracking,
): GestionActividad | undefined {
  return operacion.responsables[actividad.responsable]?.gestion[actividad.id];
}

/* --------------------------------------------------------------------------
 * VALIDACIÓN DE CONSISTENCIA
 *
 * Reemplaza al Excel como control. Devuelve la lista de problemas
 * (vacía = consistente). Una operación a medias (pocos pasos o actividades)
 * es válida si lo que tiene es consistente.
 * ------------------------------------------------------------------------ */

/** Tabs con contenido propio (no llevan actividades). */
const TABS_PROPIAS = new Set(["informacion", "archivos", "bitacora"]);

function repetidos(valores: readonly string[]): string[] {
  const vistos = new Set<string>();
  const repetidos = new Set<string>();
  for (const valor of valores) {
    if (vistos.has(valor)) repetidos.add(valor);
    vistos.add(valor);
  }
  return [...repetidos];
}

export function validarOperacion(operacion: DefinicionOperacion): string[] {
  const errores: string[] = [];
  const error = (mensaje: string) => errores.push(`${operacion.clave}: ${mensaje}`);

  const idsActividades = new Set(operacion.actividades.map((actividad) => actividad.id));
  const idsPasos = new Set(operacion.pasos.map((paso) => paso.id));
  const responsables = new Set(responsablesDe(operacion));

  // Pasos del tracking: 1..n en orden.
  operacion.pasos.forEach((paso, indice) => {
    if (paso.id !== indice + 1) error(`el paso "${paso.corto}" debe tener id ${indice + 1}`);
    for (const responsable of paso.responsables) {
      if (!responsables.has(responsable)) {
        error(`el paso ${paso.id} usa el responsable ${responsable}, que no está definido`);
      }
    }
  });

  // Actividades: ids únicos, paso existente, responsable con perfil y gestión.
  for (const id of repetidos(operacion.actividades.map((actividad) => actividad.id))) {
    error(`la actividad "${id}" está repetida`);
  }
  for (const actividad of operacion.actividades) {
    if (!idsPasos.has(actividad.paso)) {
      error(`la actividad "${actividad.id}" usa el paso ${actividad.paso}, que no existe`);
    }
    if (!responsables.has(actividad.responsable)) {
      error(`la actividad "${actividad.id}" es de ${actividad.responsable}, que no está definido`);
    } else if (!gestionDeActividad(operacion, actividad)) {
      error(`la actividad "${actividad.id}" no tiene gestión en ${actividad.responsable}`);
    }
  }

  // Tabs: values únicos, ids existentes, cada actividad en exactamente una tab.
  for (const value of repetidos(operacion.tabs.map((tab) => tab.value))) {
    error(`la tab "${value}" está repetida`);
  }
  const enTabs = operacion.tabs.flatMap((tab) => tab.actividades);
  for (const tab of operacion.tabs) {
    for (const id of tab.actividades) {
      if (!idsActividades.has(id)) error(`la tab "${tab.value}" usa "${id}", que no existe`);
    }
    if (TABS_PROPIAS.has(tab.value) && tab.actividades.length > 0) {
      error(`la tab "${tab.value}" tiene contenido propio y no lleva actividades`);
    }
  }
  for (const id of repetidos(enTabs)) error(`la actividad "${id}" está en más de una tab`);
  for (const id of idsActividades) {
    if (!enTabs.includes(id)) error(`la actividad "${id}" no está en ninguna tab`);
  }

  // Gestión: solo de actividades del responsable; `requiere` y `key` existentes.
  const camposPorSeccion: Record<keyof InformacionEmbarque, readonly CampoEmbarque[]> = {
    shipper: CAMPOS_SHIPPER,
    consignatario: CAMPOS_CONSIGNATARIO,
    notificacion: CAMPOS_NOTIFICACION,
    facturacion: CAMPOS_FACTURACION,
    detalles: CAMPOS_DETALLES,
    cargas: operacion.informacion.producto,
    rutas: operacion.informacion.rutas,
    fechas: operacion.informacion.fechas,
  };
  for (const responsable of responsables) {
    const gestion = operacion.responsables[responsable]?.gestion ?? {};
    for (const [id, definicion] of Object.entries(gestion)) {
      const actividad = operacion.actividades.find((item) => item.id === id);
      if (actividad?.responsable !== responsable) {
        error(`la gestión de ${responsable} define "${id}", que no es una actividad suya`);
      }
      for (const previa of definicion.requiere ?? []) {
        if (!idsActividades.has(previa)) error(`"${id}" requiere "${previa}", que no existe`);
      }
      for (const campo of definicion.campos ?? []) {
        if (!campo.key) continue;
        const [seccion, key] = campo.key.split(".") as [keyof InformacionEmbarque, string];
        if (!camposPorSeccion[seccion]?.some((item) => item.key === key)) {
          error(`"${id}" usa el dato "${campo.key}", que no está en los campos de Información`);
        }
      }
    }
  }

  // Formularios propios y fechas de Información: actividades existentes.
  for (const id of Object.keys(operacion.formularios ?? {})) {
    if (!idsActividades.has(id)) error(`hay un formulario propio para "${id}", que no existe`);
  }
  for (const campo of operacion.informacion.fechas) {
    if (campo.actividad && !idsActividades.has(campo.actividad)) {
      error(`la fecha "${campo.key}" la registra "${campo.actividad}", que no existe`);
    }
  }

  return errores;
}
