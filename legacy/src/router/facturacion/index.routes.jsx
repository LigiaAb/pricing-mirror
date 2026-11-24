import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import VistaCartasPago from "../../pages/Facturacion/cartasPago/VistaCartasPago";
import VistaFacturacion from "../../pages/Facturacion/facturacion/VistaFacturacion";
import SolicitudFacturacion from "../../views/Facturacioin/Facturacion/SolicitudFacturacion";
import SolicitudOrdenCompra from "@/views/Facturacioin/Facturacion/SolicitudOrdenCompra";

export const RutasFacturacion = () => {
  return (
    <Routes>
      <Route path="facturacion" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />

        <Route path="cartas-pago" element={<Outlet />}>
          <Route index element={<VistaCartasPago />} />
        </Route>

        <Route path="facturacion" element={<Outlet />}>
          <Route index element={<VistaFacturacion />} />
        </Route>

        <Route path="solicitud" element={<Outlet />}>
          <Route index element={<SolicitudFacturacion tipo="fa"/>} />
        </Route>

        <Route path="solicitud-nd" element={<Outlet />}>
          <Route index element={<SolicitudFacturacion tipo="nd" />} />
        </Route>
        <Route path="solicitud-oc" element={<Outlet />}>
          <Route index element={<SolicitudOrdenCompra tipo="oc" />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default RutasFacturacion;
