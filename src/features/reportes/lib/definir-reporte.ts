import type { ComboboxOption } from "@/shared/components/ui/combobox";

/**
 * CONTRATO DE UN REPORTE
 *
 * Un reporte = un archivo en `definiciones/` que llama a `definirReporte` + 1 línea en
 * `definiciones/index.ts`. La pantalla (`VistaReportes`) arma todo lo demás: selector,
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
  /** Se puede sumar en el "Resumen agrupado" (medida). */
  sumable?: boolean;
  /** Alineada a la derecha (números). Por defecto, igual que `sumable`. */
  numerica?: boolean;
  /** El buscador de la tabla busca en ella. */
  buscable?: boolean;
}

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
  /** Filtros que se limpian cuando este cambia (ej. CC → usuario). */
  limpia?: readonly string[];
}

export interface ContenidoReporteProps<TFila> {
  filas: readonly TFila[];
  columnas: readonly ColumnaReporte<TFila>[];
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
  /** Filtros extra (además de fechas). Atajos en `lib/filtros.ts`. */
  filtros?: readonly FiltroReporte[];
  /** Consulta al backend. Atajo: `consultarApi(endpoint, schema)`. */
  consultar: (params: ParamsReporte) => Promise<TFila[]>;
  /** Columnas de la tabla, del PDF y del Excel; también las agrupables y sumables. */
  columnas: readonly ColumnaReporte<TFila>[];
  /** Agrupación inicial de "Personaliza tu reporte" (ids de columnas agrupables). */
  agrupacion?: { filas?: readonly string[]; columna?: string; medida?: string };
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
