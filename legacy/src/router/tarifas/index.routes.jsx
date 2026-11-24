import { Outlet, Route, Routes } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import VistaTarifas from "../../pages/Tarifas/VistaTarifas";
import CreacionTarfria from "../../pages/Tarifas/CreacionTarifa/CreacionTarifa";
import ListaPlantillas from "../../pages/Tarifas/Plantilla/ListaPlantillas";
import VistaPlantilla from "../../pages/Tarifas/Plantilla/VistaPlantilla";
import { List } from "@mui/material";
import { NotFoundPage } from "../../layouts/404";
import CalcularTarifa from "../../pages/Tarifas/Calculo/CalcularTarifa";
import ListaAgrupacionesRubros from "../../pages/Tarifas/AgrupacionesRubros/ListaAgrupacionesRubros";
import VistaAgrupacionRubros from "../../pages/Tarifas/AgrupacionesRubros/VistaAgrupacionRubros";
import VistaCalculoTarifasSinPlantillas from "../../pages/Tarifas/CalculoTarifasSinPlantillas/VistaCalculoTarifasSinPlantillas";
import VistaCargaMasivaFlete from "../../pages/Tarifas/CargaMasivaFlete/VistaCargaMasivaFlete";
import VistaTarifasPorRangosPrestablecidos from "../../pages/Tarifas/TarifasPorRangosPrestablecidos/VistaTarifasPorRangosPrestablecidos";
import VistaCotizacion from "../../pages/Tarifas/Cotizaciones/VistaCotizacion";
import House from "../../pages/CorrelativoEmbarque/pages/House/House";
import Master from "../../pages/CorrelativoEmbarque/pages/Master/Master";
import VistaCotizacionPlantilla from "@/pages/Tarifas/CotizacionesPlantilla/VistaCotizacionPlantilla";
import AutorizarTarifaSpot from "@/views/Tarifas/Spot/AutorizarTarifaSpot";

// Componente que define las rutas CRM
export const RutasTarifas = () => {
  return (
    <Routes>
      <Route path="tarifa" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="tarifas" element={<Outlet />}>
          <Route index element={<VistaTarifas />} />
        </Route>
        <Route path="plantillas-tarifas" element={<Outlet />} loader={() => ({ name: "Plantillas de Tarifas" })}>
          <Route index element={<ListaPlantillas />} />
          <Route path=":encryptedId" element={<VistaPlantilla />} />
        </Route>
        <Route path="calculo" element={<Outlet />}>
          <Route index element={<CalcularTarifa />} />
        </Route>
        <Route path="agrupaciones-rubros" element={<Outlet />}>
          <Route index element={<ListaAgrupacionesRubros />} />
          <Route path=":encryptedId" element={<VistaAgrupacionRubros />} />
        </Route>
        <Route path="tarifas-sin-plantillas" element={<Outlet />}>
          <Route index element={<VistaCalculoTarifasSinPlantillas />} />
        </Route>
        <Route path="tarifas-rangos-presetablecidos" element={<Outlet />}>
          <Route index element={<VistaTarifasPorRangosPrestablecidos />} />
        </Route>
        <Route path="carga-masiva-flete" element={<Outlet />}>
          <Route index element={<VistaCargaMasivaFlete />} />
        </Route>
        <Route path="actualizacion-masiva-flete" element={<Outlet />}>
          <Route index element={<VistaCargaMasivaFlete actualizacion={true} />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="cotizacion" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="solicitud-cotizacion" element={<Outlet />}>
          <Route index element={<VistaCotizacion />} />
          <Route path=":encryptedId" element={<VistaCotizacion />} />
        </Route>
        <Route path="autoriza-spot" element={<Outlet />}>
          <Route index element={<AutorizarTarifaSpot />} />
          <Route path=":encryptedId" element={<AutorizarTarifaSpot />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="cliente-cotizacion" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="cotizacion" element={<Outlet />}>
          <Route index element={<VistaCotizacionPlantilla />} />
          <Route path=":encryptedId" element={<VistaCotizacion />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="correlativos" element={<MenuBasePage />}>
        <Route index element={<Outlet />} />
        <Route path="house" element={<Outlet />}>
          <Route index element={<House />} />
        </Route>
        <Route path="master" element={<Outlet />}>
          <Route index element={<Master />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
