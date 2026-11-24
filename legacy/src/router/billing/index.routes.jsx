import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import VistaCartasPago from "../../pages/Billing/cartasPago/VistaCartasPago";
import VistaFacturacion from "../../pages/Billing/facturacion/VistaFacturacion";

export const RutasBilling = () => {
  return (
    <Routes>
      <Route path="billing" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />

        <Route path="cartas-pago" element={<Outlet />}>
          <Route index element={<VistaCartasPago />} />
        </Route>

        <Route path="facturacion" element={<Outlet />}>
          <Route index element={<VistaFacturacion />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default RutasBilling;
