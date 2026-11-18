import type {
  CentroCosto,
  ConfiguracionActividades,
  Empresa,
  Estado,
  Periodicidad,
  Tipo,
} from "@/features/catalogos";
import type { FieldOption } from "@/shared/components/form/types";
import type { Objetivo } from "../api/objetivos";

const ESTADO_ACTIVO = 1;

export interface ObjetivoFila extends Objetivo {
  nombreEmpresa: string;
  nombreCentroCosto: string;
  nombreTipoActividad: string;
  nombrePeriodicidad: string;
  nombreTipoAsignacion: string;
  nombreEstado: string;
}

export interface CatalogosObjetivo {
  empresas: Empresa[];
  centrosCosto: CentroCosto[];
  actividades: ConfiguracionActividades[];
  tiposAsignacion: Tipo[];
  periodicidades: Periodicidad[];
  estados: Estado[];
}

/**
 * Cruza la lista cruda de objetivos (sin nombres, §2 del plan) con los
 * catálogos de apoyo. Reemplaza el cruce triplicado y disperso del legacy
 * (`ListaObjetivos`/`VistaObjetivos`) por una sola función pura y testeable.
 */
export function componerFilasObjetivo(
  lista: Objetivo[],
  catalogos: CatalogosObjetivo,
): ObjetivoFila[] {
  return lista.map((objetivo) => {
    const empresa = catalogos.empresas.find(
      (e) => String(e.cod_empresa) === String(objetivo.codEmp),
    );
    const centroCosto = catalogos.centrosCosto.find(
      (c) => String(c.codCc) === String(objetivo.codCc),
    );
    const actividad = catalogos.actividades.find(
      (a) => String(a.cod_tipo_actividad) === String(objetivo.codTipoActividad),
    );
    const tipoAsignacion = catalogos.tiposAsignacion.find(
      (t) => String(t.codTipo) === String(objetivo.codTipoAsignacion),
    );
    const periodicidad = catalogos.periodicidades.find(
      (p) => String(p.cod_periodicidad) === String(objetivo.codPeriodicidad),
    );
    const estado = catalogos.estados.find(
      (e) => String(e.cod_estado) === String(objetivo.codEstado),
    );

    return {
      ...objetivo,
      nombreEmpresa: empresa?.nombre_emp ?? "",
      nombreCentroCosto: centroCosto?.nombreCc ?? "",
      nombreTipoActividad: actividad?.nom_tipo_actividad ?? "",
      nombrePeriodicidad: periodicidad?.descripcion ?? "",
      nombreTipoAsignacion: tipoAsignacion?.nomTipo ?? "",
      nombreEstado: estado?.estado_desc ?? "",
    };
  });
}

/**
 * Opciones de centro de costo filtradas por empresa (`cod_empresa_cc`).
 */
export function opcionesCentroCosto(
  centrosCosto: CentroCosto[],
  codEmp: string | undefined,
): FieldOption[] {
  if (!codEmp) return [];
  return centrosCosto
    .filter((cc) => String(cc.codEmpresaCc) === codEmp)
    .map((cc) => ({ value: String(cc.codCc), label: cc.nombreCc }));
}

/**
 * Opciones de tipo de actividad para empresa + centro de costo, deduplicadas
 * por `cod_tipo_actividad`: `lista-configuracion-actividad` trae una fila por
 * cada combinación con tipo de resultado (73 filas para 13 actividades
 * distintas en emp 1/cc 2), y el legacy las ofrecía todas repetidas (§3.8).
 */
export function opcionesTipoActividad(
  actividades: ConfiguracionActividades[],
  codEmp: string | undefined,
  codCc: string | undefined,
): FieldOption[] {
  if (!codEmp || !codCc) return [];

  const vistos = new Set<string>();
  const opciones: FieldOption[] = [];
  for (const actividad of actividades) {
    if (String(actividad.cod_emp) !== codEmp) continue;
    if (String(actividad.cod_cc) !== codCc) continue;
    if (actividad.cod_estado !== ESTADO_ACTIVO) continue;

    const clave = String(actividad.cod_tipo_actividad);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    opciones.push({ value: clave, label: actividad.nom_tipo_actividad });
  }
  return opciones;
}
