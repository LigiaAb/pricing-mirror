import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import CTSPage from "../../pages/Embarques/pages/CTS/page";
import CTSDetallePage from "../../pages/Embarques/pages/CTS/[id]/page";
import GestionEmbarquesPage from "../../pages/Embarques/pages/gestion-embarques/page";
import GestionDetalles from "../../pages/Embarques/pages/gestion-embarques/[id]/page";
import Etiquetas2 from "@/pages/Combex/Etiquetas/Etiquetas2";
import ListaAsignacionCTS from "@/pages/Embarques/pages/AsignacionCTS/ListaAsignacionCTS";

export const RutasEmbarques = () => {
  return (
    <Routes>
      <Route path="embarques" element={<MenuBasePage />}>
        <Route index element={<Navigate to="general" replace />} />
        <Route path="general" element={<GestionEmbarquesPage />} />

        <Route path="cts" element={<Outlet />}>
          <Route index element={<CTSPage />} />
          {/* detalle CTS */}
          <Route path=":id" element={<CTSDetallePage />} />
          <Route path=":id/:pestana" element={<GestionDetalles />} />
          <Route path="tipo/:encryptedTipo" element={<Outlet />}>
            <Route index element={<CTSPage />} />
          </Route>
        </Route>

        <Route path="gestion-embarques" element={<Outlet />}>
          <Route index element={<GestionEmbarquesPage />} />
          <Route path=":id/:pestana?" element={<GestionDetalles />} />
          <Route path="tipo/:encryptedTipo" element={<Outlet />}>
            <Route index element={<GestionEmbarquesPage />} />
          </Route>
        </Route>
        <Route path="etiquetas" element={<Outlet />}>
          <Route index element={<Etiquetas2 />} />
        </Route>
        <Route path="asignacion-cts" element={<Outlet />}>
          <Route index element={<ListaAsignacionCTS />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default RutasEmbarques;