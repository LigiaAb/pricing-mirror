import { Routes, Route, Navigate } from "react-router-dom";
import { Outlet } from "react-router";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import Repeso from "../../pages/Combex/Repeso/Repeso";
import ManifiestoPage from "../../pages/Combex/Manifiesto/manifiesto";
import LibroActas from "../../pages/Combex/LibroActas/libroActas";
import Etiquetas from "../../pages/Combex/Etiquetas/Etiquetas";

export function RutasCombex() {
  return (
    <Routes>
      <Route path="combex" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route
          path="repeso"
          element={<Outlet />}
          loader={() => ({ name: "Cruds-estados" })}
        >
          <Route index element={<Repeso />} />
          <Route path=":encryptedId" element={<Repeso />} />
        </Route>
        <Route
          path="manifiesto"
          element={<Outlet />}
          loader={() => ({ name: "Cruds-estados" })}
        >
          <Route index element={<ManifiestoPage />} />
          {/* <Route path=":encryptedId" element={<Vista.... />} /> */}
        </Route>
        <Route
          path="libro-actas"
          element={<Outlet />}
          loader={() => ({ name: "Cruds-estados" })}
        >
          <Route index element={<LibroActas />} />
          {/* <Route path=":encryptedId" element={<Vista.... />} /> */}
        </Route>
        <Route path="etiquetas" element={<Outlet />}>
          <Route index element={<Etiquetas />} />
        </Route>
      </Route>
    </Routes>
  );
}
