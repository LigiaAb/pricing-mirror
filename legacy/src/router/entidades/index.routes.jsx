import { Routes, Route, Outlet } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import EntidadLayout from "../../layouts/EntidadLayout";
import ListaEntidad from "../../pages/Entidad/ListaEntidad";
import VistaEntidad from "../../pages/Entidad/VistaEntidad";
// import ListaEstadisticasPersonales from "../../pages/CRM/EstadisiticasPersonales/ListaEstadisticasPersonales";
// import VistaEstadisticasPersonales from "../../pages/CRM/EstadisiticasPersonales/VistaEstadisticasPersonales";
import ListaEstadisticasPersonales from "../../pages/EstadisiticasPersonales2/ListaEstadisticasPersonales";
import VistaEstadisticasPersonales from "../../pages/EstadisiticasPersonales2/VistaEstadisticasPersonales";
import { VistaActividades } from "../../pages/Actividades/VistaActividades";
import { VistaReporteInventario } from "../../pages/ReporteInventario/VistaReporteInventario";
import { ListaActividades } from "../../pages/Actividades/ListaActividades";
import { VistaCalendario } from "../../pages/Calendario/VistaCalendario";
import { VistaOportunidades } from "../../pages/Oportunidades/VistaOportunidades";
import { ListaOportunidades } from "../../pages/Oportunidades/ListaOportunidades";
import { ListaCampanas } from "../../pages/Campanas/ListaCampanas";
import { VistaCampanas } from "../../pages/Campanas/VistaCampanas";
import { VistaActividadesDia } from "../../pages/Actividades/VistaActividadesDia";
import ListaEntidadAsignacion from "../../pages/Entidad/EntidadAsignacion/ListaEntidadAsignacion";
import VistaEntidadAsignacion from "../../pages/Entidad/EntidadAsignacion/VistaEntidadAsignacion";

// Componente que define las rutas CRM
export const RutasEntidad = () => {
  return (
    <Routes>
      <Route path="entidades" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="dsv" element={<EntidadLayout tipo="DSV" ruta="dsv" />}>
          <Route path=":encryptedTipo" element={<Outlet />}>
            <Route index element={<ListaEntidad />} />
            <Route path=":encryptedId" element={<VistaEntidad />} />
          </Route>
        </Route>
        <Route path="shipper" element={<EntidadLayout tipo="SHIPPER" ruta="shipper" />}>
          <Route path=":encryptedTipo" element={<Outlet />}>
            <Route index element={<ListaEntidad />} />
            <Route path=":encryptedId" element={<VistaEntidad />} />
          </Route>
        </Route>
        <Route path="consignatario" element={<EntidadLayout tipo="CONSIGNATARIO" ruta="consignatario" />}>
          <Route path=":encryptedTipo" element={<Outlet />}>
            <Route index element={<ListaEntidad />} />
            <Route path=":encryptedId" element={<VistaEntidad />} />
          </Route>
        </Route>
        <Route path="carrier" element={<EntidadLayout tipo="CARRIER" ruta="carrier" />}>
          <Route path=":encryptedTipo" element={<Outlet />}>
            <Route index element={<ListaEntidad />} />
            <Route path=":encryptedId" element={<VistaEntidad />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
