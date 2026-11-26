import type { ComboboxOption } from "@/shared/components/ui/combobox";

/**
 * CONTRATO DE UN REPORTE
 *
 * Un reporte = un archivo en `definiciones/<modulo>/` que llama a `definirReporte` + 1 línea
 * en la lista del módulo (`definiciones/<modulo>/index.ts`). La pantalla (`VistaReportes`) arma todo lo demás: selector,
 * fechas, filtros, "Personaliza tu reporte", "Resumen agrupado", tabla del reporte y
 * descargas (PDF y Excel). Ver `ARQUITECTURA.md`.
 */

/** Valor de una celda del reporte. */
export type ValorCelda = string | number | null;

/** Parámetros que recibe `consultar`: fechas, empresa, CC y el valor de cada filtro. */
export type ParamsReporte = Record<string, string>;

/** Valor elegido de cada filtro (por `id`); "" = sin filtro (todos). */
export type ValoresFiltros = Record<string, string>;

export interface ColumnaReporte<TFila> {
  /** Clave única de la columna. */
  id: string;
  /** Encabezado en pantalla, PDF y Excel. */
  label: string;
  /** Valor de la celda para una fila. */
  valor: (fila: TFila) => ValorCelda;
  /** Se puede agrupar por ella en "Personaliza tu reporte" (filas o columnas). */
  agrupable?: boolean;
  /** Se suma en el "Resumen agrupado" (medida, además de la cantidad de registros). */
  sumable?: boolean;
  /** Alineada a la derecha (números). Por defecto, si es `sumable` o `calculada`. */
  numerica?: boolean;
  /** El buscador de la tabla busca en ella. */
  buscable?: boolean;
  /**
   * Medida CALCULADA del Resumen agrupado (ej. HR % = cerradas / realizadas): se calcula en
   * cada grupo con las sumas del grupo, no sumando el valor de cada fila. Recibe
   * `{ cantidad, <id de cada columna sumable>: suma }`; `null` = celda vacía (ej. dividir
   * entre 0). Atajo: `porcentaje(parte, total)`.
   */
  calculada?: (sumas: Record<string, number>) => number | null;
}

/**
 * La fecha (texto ISO o `yyyy-MM-dd`) está dentro del período de la pantalla (`fecha_inicio` y
 * `fecha_fin` de `params`, por día local, cada una sola). Sin fechas en `params`, `true`. Para
 * `filtrar` de `consultarApi` cuando el endpoint no filtra por fecha.
 */
export function fechaEnRango(fecha: string | null | undefined, params: ParamsReporte): boolean {
  const { fecha_inicio: inicio, fecha_fin: fin } = params;
  if (!inicio && !fin) return true;
  const valor = fecha ? new Date(fecha).getTime() : Number.NaN;
  if (!Number.isFinite(valor)) return false;
  const desde = inicio ? new Date(`${inicio}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const hasta = fin ? new Date(`${fin}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  return valor >= desde && valor <= hasta;
}

/** Porcentaje con 2 decimales (ej. `porcentaje(5, 20)` = 25); `null` si `total` es 0. */
export const porcentaje = (parte: number | undefined, total: number | undefined): number | null =>
  total ? Math.round(((parte ?? 0) / total) * 10000) / 100 : null;

export interface FiltroReporte {
  /** Nombre del parámetro que recibe `consultar` (ej. `cod_usuario`). */
  id: string;
  label: string;
  /**
   * Hook con las opciones del select. Recibe los valores actuales de los filtros, por si
   * depende de otro (ej. usuarios del CC elegido). Ver los atajos de `lib/filtros.ts`.
   */
  useOpciones: (valores: ValoresFiltros) => {
    opciones: readonly ComboboxOption[];
    cargando?: boolean | undefined;
  };
  /** Valor inicial (ej. el CC del contexto operativo). Sin esto, "" (todos). */
  useValorInicial?: () => string;
  /** Este filtro se limpia cuando cambia alguno de estos (ej. usuario depende de `cod_cc`). */
  depende?: readonly string[];
  /** Selección múltiple (ej. Tipo en Reportes CRM): el valor va separado por comas (`"7,8"`). */
  multiple?: boolean;
  /** Obligatorio (ej. Tipo de asignación en Objetivos): sin valor no se puede consultar. */
  requerido?: boolean;
}

export interface ContenidoReporteProps<TFila> {
  filas: readonly TFila[];
  columnas: readonly ColumnaReporte<TFila>[];
  params: ParamsReporte;
  /**
   * Con `descargas: { pdf: "contenido" }`: sube cada vez que se pulsa el botón PDF; el
   * `Contenido` genera el PDF cuando cambia (ej. `descargar` de una vista de pricing).
   */
  solicitudPdf: number;
  /** Avisa al botón PDF que se está generando ("Generando PDF..."). */
  onGenerandoPdf: (generando: boolean) => void;
  /** Muestra el error del PDF junto a los de las demás descargas (`null` = sin error). */
  onErrorPdf: (mensaje: string | null) => void;
}

/** Lo que recibe una descarga propia de un reporte (`descargas` de la definición). */
export interface DescargaReporte<TFila> {
  filas: readonly TFila[];
  /** Nombre del reporte (`TIPO_DESCRIPCION`). */
  titulo: string;
  /** Filtros de la consulta con nombre (Período, Empresa, Centro de costo, Asesor…). */
  encabezado: Record<string, string>;
  params: ParamsReporte;
}

export interface DefinicionReporte<TFila> {
  /**
   * Une el reporte con la API de reportes disponibles: `NOMENCLATURA` del `TIPO`
   * (`TIPO_TABLA = 'REPORTE'`). El título sale del nombre del tipo.
   */
  nomenclatura: string;
  /** Subtítulo de la sección "Reporte". */
  descripcion?: string;
  /** "requeridas" (por defecto: el mes actual), "opcionales" o "ninguna". */
  fechas?: "requeridas" | "opcionales" | "ninguna";
  /**
   * Filtros extra (además de fechas, y de empresa y CC, que pone la pantalla con el permiso
   * "Filtrar Empresa Centro Costo"). Atajos en `lib/filtros.ts`.
   */
  filtros?: readonly FiltroReporte[];
  /**
   * `false`: el reporte no usa empresa ni CC (ej. Actividades, solo del usuario de la sesión): no
   * se muestran, no se envían y no van en el encabezado. Por defecto, sí.
   */
  empresaCentroCosto?: boolean;
  /** Consulta al backend. Atajo: `consultarApi(endpoint, schema)`. */
  consultar: (params: ParamsReporte) => Promise<TFila[]>;
  /** Columnas de la tabla, del PDF y del Excel; también las agrupables y sumables. */
  columnas: readonly ColumnaReporte<TFila>[];
  /** Agrupación inicial de "Personaliza tu reporte" (ids de columnas agrupables). */
  agrupacion?: { filas?: readonly string[]; columna?: string };
  /**
   * Descargas del reporte (opcionales: sin esto no tiene ninguna; en CRM unos tienen Excel,
   * otros PDF y otros ambos). `true` = el detalle con las columnas; una función = formato
   * propio (p. ej. el del legacy). En `pdf`, `"contenido"` = lo genera el `Contenido` del
   * reporte con `solicitudPdf` (mismo botón PDF). El "Excel agrupado" está siempre.
   */
  descargas?: {
    excel?: true | ((descarga: DescargaReporte<TFila>) => Promise<void>);
    pdf?: true | "contenido" | ((descarga: DescargaReporte<TFila>) => Promise<void>);
  };
  /**
   * Contenido propio de la sección "Reporte" (gráficas, tarjetas…). Sin esto, una tabla
   * con las columnas.
   */
  Contenido?: (props: ContenidoReporteProps<TFila>) => React.ReactNode;
}

/** Reporte con el tipo de fila borrado, para guardarlo en el registro. */
export type Reporte = DefinicionReporte<unknown>;

/** Define un reporte con su tipo de fila y lo deja listo para el registro. */
export function definirReporte<TFila>(definicion: DefinicionReporte<TFila>): Reporte {
  // Las funciones solo reciben filas que entrega el mismo `consultar` del reporte.
  return definicion as unknown as Reporte;
}
