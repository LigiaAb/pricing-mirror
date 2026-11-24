import { Routes, Route, Outlet } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import EntidadLayout from "../../layouts/EntidadLayout";
import ListaEntidad from "../../pages/Entidad/ListaEntidad";
import VistaEntidad from "../../pages/Entidad/VistaEntidad";
// import ListaEstadisticasPersonales from "../../pages/CRM/EstadisiticasPersonales/ListaEstadisticasPersonales";
// import VistaEstadisticasPersonales from "../../pages/CRM/EstadisiticasPersonales/VistaEstadisticasPersonales";
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
import HistorialActividades from "@/pages/CRM/HistorialActividades/HistorialActividades";

// Componente que define las rutas CRM
export const RutasCRM = () => {
  return (
    <Routes>
      <Route path="calendario" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="estadisticas-personales" element={<Outlet />} loader={() => ({ name: "Cruds-estados" })}>
          <Route index element={<VistaEstadisticasPersonales />} loader={() => ({ name: "Cruds-estados" })} />
          <Route path=":encryptedId" element={<VistaActividades />} />
        </Route>
        <Route path="historial" element={<Outlet />} loader={() => ({ name: "Historia actividades" })}>
          <Route index element={<HistorialActividades />} loader={() => ({ name: "Historia actividades" })} />
        </Route>
        <Route path="actividad" element={<Outlet />} loader={() => ({ name: "Cruds-estados" })}>
          <Route index element={<VistaCalendario />} loader={() => ({ name: "Cruds-estados" })} />
          <Route path=":encryptedId" element={<VistaActividades />} />
        </Route>
        <Route path="oportunidades" element={<Outlet />}>
          <Route index element={<ListaOportunidades />} loader={() => ({ name: "Cruds-estados" })} />
          <Route path=":encryptedId" element={<Outlet />}>
            <Route index element={<VistaOportunidades />} />
            <Route path=":encryptedIdActividad" element={<VistaActividades />} />
          </Route>
        </Route>
        <Route path="campana" element={<Outlet />}>
          <Route index element={<ListaCampanas />} loader={() => ({ name: "Cruds-estados" })} />
          <Route path=":encryptedId" element={<Outlet />}>
            <Route index element={<VistaCampanas />} />
            <Route path=":encryptedIdActividad" element={<VistaActividades />} />
          </Route>
        </Route>
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
      <Route path="clientes" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route loader={<LoaderComponent />} path="cliente" element={<EntidadLayout tipo="CLIENTE" ruta="cliente" />}>
          <Route path=":encryptedTipo" element={<Outlet />}>
            <Route index element={<ListaEntidad />} />
            <Route path=":encryptedId" element={<VistaEntidad />} />
          </Route>
        </Route>
        <Route path="pre-cliente" element={<EntidadLayout tipo="PRE-CLIENTE" ruta="pre-cliente" />}>
          <Route path=":encryptedTipo" element={<Outlet />}>
            <Route index element={<ListaEntidad />} />
            <Route path=":encryptedId" element={<VistaEntidad />} />
          </Route>
        </Route>
        <Route path="cliente-para-manifestar" element={<EntidadLayout tipo="CLIENTE PARA MANIFESTAR" ruta="entidad-manifiesto" />}>
          <Route path=":encryptedTipo" element={<Outlet />}>
            <Route index element={<ListaEntidad />} />
            <Route path=":encryptedId" element={<VistaEntidad />} />
          </Route>
        </Route>
        <Route path="asignacion" element={<Outlet />} loader={() => ({ name: "Cruds-estados" })}>
          <Route index element={<ListaEntidadAsignacion />} />
          <Route path=":encryptedId" element={<VistaEntidadAsignacion />} />
        </Route>
      </Route>
      <Route path="reportes" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="reportes" element={<Outlet />} loader={() => ({ name: "Cruds-estados" })}>
          <Route index element={<VistaReportes modulo="CRM" />} loader={() => ({ name: "Cruds-estados" })} />
        </Route>
      </Route>
    </Routes>
  );
};
