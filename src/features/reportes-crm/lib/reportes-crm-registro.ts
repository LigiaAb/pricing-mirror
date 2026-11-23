export type ReporteCrmId =
  | "visitas-historico"
  | "visitas"
  | "actividades-pdf"
  | "objetivos"
  | "graficas"
  | "seguimiento";

type CamposReporte = {
  empresaCentroCosto?: boolean;
  asesor?: boolean;
  estado?: boolean;
  tipoActividad?: boolean;
  fechas?: "opcionales" | "requeridas";
  tipoAsignacion?: "seleccion" | "puesto-del-asesor";
  cliente?: boolean;
};

type ConfiguracionReporte = {
  id: ReporteCrmId;
  label: string;
  vista: "visitas" | "calendario" | "objetivos" | "graficas" | "seguimiento";
  campos: CamposReporte;
};

/**
 * La pantalla legacy montaba una vista distinta para cada tipo de reporte. Esta
 * configuración mantiene esa diferencia explícita y evita que un filtro global
 * termine apareciendo en un reporte que no lo utiliza.
 */
const REPORTE_INICIAL: ConfiguracionReporte = {
  id: "visitas-historico",
  label: "Reporte de visitas — histórico",
  vista: "visitas",
  campos: {
    empresaCentroCosto: true,
    asesor: true,
    estado: true,
    tipoActividad: true,
    fechas: "opcionales",
  },
};

export const REPORTES_CRM: readonly ConfiguracionReporte[] = [
  REPORTE_INICIAL,
  {
    id: "visitas",
    label: "Reporte de visitas",
    vista: "visitas",
    campos: {
      empresaCentroCosto: true,
      asesor: true,
      estado: true,
      tipoActividad: true,
      fechas: "opcionales",
    },
  },
  {
    id: "actividades-pdf",
    label: "Actividades",
    vista: "calendario",
    campos: { fechas: "opcionales" },
  },
  {
    id: "objetivos",
    label: "Objetivos de actividades",
    vista: "objetivos",
    campos: { empresaCentroCosto: true, fechas: "requeridas", tipoAsignacion: "seleccion" },
  },
  {
    id: "graficas",
    label: "Gráficas de objetivos de semana actual",
    vista: "graficas",
    campos: { empresaCentroCosto: true, asesor: true, tipoAsignacion: "puesto-del-asesor" },
  },
  {
    id: "seguimiento",
    label: "Seguimiento",
    vista: "seguimiento",
    campos: { empresaCentroCosto: true, cliente: true },
  },
];

export function obtenerConfiguracionReporte(id: ReporteCrmId): ConfiguracionReporte {
  return REPORTES_CRM.find((reporte) => reporte.id === id) ?? REPORTE_INICIAL;
}
