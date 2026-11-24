import { Routes, Route, Outlet } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import EntidadLayout from "../../layouts/EntidadLayout";
import ListaEntidad from "../../pages/Entidad/ListaEntidad";
import VistaEntidad from "../../pages/Entidad/VistaEntidad";
import ListaEstadisticasPersonales from "../../pages/CRM/EstadisiticasPersonales/ListaEstadisticasPersonales";
import VistaEstadisticasPersonales from "../../pages/CRM/EstadisiticasPersonales/VistaEstadisticasPersonales";
import { VistaActividades } from "../../pages/Actividades/VistaActividades";
import { VistaReporteInventario } from "../../pages/ReporteInventario/VistaReporteInventario";
import { ListaActividades } from "../../pages/Actividades/ListaActividades";
import { VistaCalendario } from "../../pages/Calendario/VistaCalendario";
import { VistaOportunidades } from "../../pages/Oportunidades/VistaOportunidades";
import { ListaOportunidades } from "../../pages/Oportunidades/ListaOportunidades";
import ListaSolicitarEmpleado from "../../pages/SolicitarEmpleado/ListaSolicitarEmpleado";
import VistaSolicitarEmpleado from "../../pages/SolicitarEmpleado/VistaSolicitarEmpleado";

// Componente que define las rutas CRM
export const RutasRRHH = () => {
  return (
    <Routes>
      <Route path="empleados" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="solicitar_empleado" element={<Outlet />}>
          <Route index element={<Outlet />} />
          {/* <Route index element={<ListaSolicitarEmpleado />} loader={() => ({ name: "Cruds-estados" })} />
          <Route path=":encryptedId" element={<VistaSolicitarEmpleado />} /> */}
        </Route>
      </Route>
    </Routes>
  );
};
