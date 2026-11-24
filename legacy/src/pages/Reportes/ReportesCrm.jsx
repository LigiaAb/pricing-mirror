import BandaAlertaComponent from "@/components/Alertas/BandaAlertaComponent";
import ReporteObjetiovsActividadesPorEmpleado from "../../views/ReporteObjetivosActividadesPorEmpleados/ReporteObjetiovsActividadesPorEmpleado";
import { ListaActividades2 } from "../Actividades/ListaActividades2";
import FiltrosGraficasPersonales from "./reports/CRM/FiltrosGraficasPersonales";
import SeguimientoDeCliente from "./reports/CRM/SeguimientoDeCliente";
import GenerarPdfActividades from "./reports/CRM/GenerarPdfActividades";

export const tipoReportesCrm = [
  { label: "Reporte de Visitas Historico", value: 1 },
  { label: "Reporte de Visitas", value: 2 },
  { label: "Actividades", value: 3 },
  { label: "Objetivos de Actividades", value: 4 },
  { label: "Graficas de objetivos de semana Actual", value: 5 },
  { label: "Seguimiento", value: 6 },
];

export const renderizarReporteCrm = (tipo, permisoPaisCC) => {
  return tipo ? (
    tipo.value == 1 ? (
      <ListaActividades2 filtros={{ estado: true, fecha: true, empleado: true, empresa: permisoPaisCC, cenco: permisoPaisCC }} cod_usuario={null} excel historico reporte />
    ) : tipo.value == 2 ? (
      <ListaActividades2 filtros={{ estado: true, fecha: true, empleado: true, empresa: permisoPaisCC, cenco: permisoPaisCC }} cod_usuario={null} excel reporte />
    ) : tipo.value == 3 ? (
      <GenerarPdfActividades />
    ) : tipo.value == 4 ? (
      <ReporteObjetiovsActividadesPorEmpleado />
    ) : tipo.value == 5 ? (
      <FiltrosGraficasPersonales />
    ) : tipo.value == 6 ? (
      <SeguimientoDeCliente />
    ) : (
      <BandaAlertaComponent tipo="warning">Reporte no disponible</BandaAlertaComponent>
    )
  ) : null;
};
