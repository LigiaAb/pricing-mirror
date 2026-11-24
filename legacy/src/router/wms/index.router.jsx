import { Routes, Route, Outlet } from "react-router-dom";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import ListaAlmacen from "../../pages/wms/CatalogosWms/ListaAlmacen";
import VistaAlmacen from "../../pages/wms/CatalogosWms/VistaAlamacen";
import ListaRacks from "../../pages/wms/CatalogosWms/ListaRacks";
import ListaArticulos from "../../pages/wms/CatalogosWms/ListaArticulos";
import ListaIngresos from "../../pages/wms/analisis/ListaIngresos";
import ListaSolicitudes from "../../pages/wms/analisis/ListaSolicitudes";
import ListaPreparaciones from "../../pages/wms/analisis/ListaPreparaciones";
import ListaDespachos from "../../pages/wms/analisis/ListaDespachos";
import ListaPaseSalida from "@/pages/wms/TMS/ListaPaseSalida";
import ListaReporteInventario from "@/pages/wms/Reportes/ListaReporteInventario";
import VistaPaseSalida from "@/pages/wms/TMS/VistaPaseSalida";
export const RutasWms = () => {

    return (
        <Routes>
            <Route path="wms-catalogo" element={<MenuBasePage />}>
                <Route index element={<Outlet />} />
                <Route
                    path="almacen"
                    element={<Outlet />}
                >
                    <Route index element={<ListaAlmacen />} />
                    <Route path=":encryptedId" element={<VistaAlmacen />} />

                    {/* <Route path=":encryptedId" element={<Vista.... />} /> */}
                </Route>
                <Route
                    path="wms"
                    element={<Outlet />}
                >
                    <Route index element={<ListaAlmacen />} />
                    <Route path=":encryptedId" element={<VistaAlmacen />} />
                    {/* <Route path=":encryptedId" element={<Vista.... />} /> */}
                </Route>
                <Route
                    path="racks"
                    element={<Outlet />}
                >
                    <Route index element={<ListaRacks />} />
                    {/* <Route path=":encryptedId" element={<VistaAlmacen />} />
                     */}{/* <Route path=":encryptedId" element={<Vista.... />} /> */}
                </Route>
                <Route
                    path="articulos"
                    element={<Outlet />}
                >
                    <Route index element={<ListaArticulos />} />
                </Route>
            </Route>
            <Route path="analisis" element={<MenuBasePage />}>
                <Route index element={<Outlet />} />

                <Route
                    path="ingreso"
                    element={<Outlet />}
                >
                    <Route index element={<ListaIngresos />} />

                </Route>
                <Route
                    path="solicitud"
                    element={<Outlet />}
                >
                    <Route index element={<ListaSolicitudes />} />

                </Route>
                 <Route
                    path="preparaciones"
                    element={<Outlet />}
                >
                    <Route index element={<ListaPreparaciones />} />

                </Route>
                 <Route
                    path="despachos"
                    element={<Outlet />}
                >
                    <Route index element={<ListaDespachos />} />

                </Route>
 
            </Route>
            <Route path="tms" element={<MenuBasePage />}>
                <Route index element={<Outlet />} />

                <Route
                    path="pase_salida"
                    element={<Outlet />}
                >
                    <Route index element={<ListaPaseSalida/>} />

                </Route>
                <Route
                    path="pase_salida/:id"
                    element={<Outlet />}
                >
                    <Route index element={<VistaPaseSalida/>} />

                </Route>
            </Route>
            <Route path="reportes" element={<MenuBasePage />}>
                <Route index element={<Outlet />} />
                <Route
                    path="reporte-inventario"
                    element={<Outlet />}
                >
                    <Route index element={<ListaReporteInventario/>} />

                </Route>
            </Route>
        </Routes>
    )
}
export default RutasWms