import { Routes, Route, Outlet } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import EntidadLayout from "../../layouts/EntidadLayout";
import ListaEntidad from "../../pages/Entidad/ListaEntidad";
import VistaEntidad from "../../pages/Entidad/VistaEntidad";
// import ListaEstadisticasPersonales from "../../pages/OBJETIVOS/EstadisiticasPersonales/ListaEstadisticasPersonales";
// import VistaEstadisticasPersonales from "../../pages/OBJETIVOS/EstadisiticasPersonales/VistaEstadisticasPersonales";
// import ListaEstadisticasPersonales from "../../pages/EstadisiticasPersonales2/ListaEstadisticasPersonales";
// import VistaEstadisticasPersonales from "../../pages/EstadisiticasPersonales2/VistaEstadisticasPersonales";
import { VistaActividades } from "../../pages/Actividades/VistaActividades";
import { ListaActividades } from "../../pages/Actividades/ListaActividades";
import { VistaCalendario } from "../../pages/Calendario/VistaCalendario";
import { VistaOportunidades } from "../../pages/Oportunidades/VistaOportunidades";
import { ListaOportunidades } from "../../pages/Oportunidades/ListaOportunidades";
import { ListaCampanas } from "../../pages/Campanas/ListaCampanas";
import { VistaCampanas } from "../../pages/Campanas/VistaCampanas";
import { VistaActividadesDia } from "../../pages/Actividades/VistaActividadesDia";
import ListaEntidadAsignacion from "../../pages/Entidad/EntidadAsignacion/ListaEntidadAsignacion";
import VistaEntidadAsignacion from "../../pages/Entidad/EntidadAsignacion/VistaEntidadAsignacion";
import VistaReportes from "../../pages/Reportes/VistaReportes";
import ListaObjetivos from "../../pages/Objetivos/ListaObjetivos";
import VistaObjetivos from "../../pages/Objetivos/VistaObjetivos";
import LoaderComponent from "../../components/Loader/LoaderComponent";
import VistaEstadisticasPersonales from "../../pages/EstadisiticasPersonales3/VistaEstadisticasPersonales";

// Componente que define las rutas OBJETIVOS
export const RutasObjetivos = () => {
  return (
    <Routes>
      <Route path="objetivos" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="objetivos" element={<Outlet />}>
          <Route index element={<ListaObjetivos />} loader={() => ({ name: "Cruds-obtjetivos" })} />
          <Route exact path="crear" element={<VistaObjetivos isEditing={true} />} />
          <Route exact path="editar/:encryptedCodObjetivo" element={<VistaObjetivos isEditing={true} />} />
          <Route path=":encryptedCodObjetivo" element={<Outlet />}>
            <Route index element={<VistaObjetivos />} />
            <Route path=":encryptedIdActividad" element={<VistaActividades />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
