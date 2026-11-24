import { Navigate, Outlet, Routes, Route } from "react-router-dom";
import { NotFoundPage } from "../layouts/404";
import { AuthLayout } from "../layouts/AuthLayout";
import { IndexLayout } from "../layouts/IndexLayout";
import MainLayout from "../layouts/MainLayout";
import MainLayoutPublico from "../layouts/MainLayoutPublico";
import { LoginPage } from "../pages/auth/LoginPage";
import { MenuDashboardPage } from "../pages/Dashboard/MenuDashboardPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { PaginaVaciaPage } from "../pages/PaginaVaciaPage";
import { NoAuthPage } from "../pages/auth/NoAuthPage";
import { CheckingLayout } from "../layouts/CheckingLayout";
import PerfilPage from "../pages/Dashboard/PerfilPage";
import AyudaPage from "../pages/Dashboard/AyudaPage";
import DocumentacionDeErp from "../documentacion/DocumentacionDeErp";
import MemosPage from "../pages/Dashboard/MemosPage";
import TicketsPage from "../pages/Dashboard/TicketsPage";
import ListaComponentesDocumentacion from "../documentacion/DocumentacionListaComponentes";
import DocumentacionDeComponente from "../documentacion/DocumentacionDeComponente";
import ResetPassPage from "../pages/auth/ResetPassPage";
import ListaTest from "../pages/Test/ListaTest";
import { RutasCruds, RutasCRM } from "./";
import PropTypes from "prop-types";
import { RutasRRHH } from "./rrhh/index.routes";
import { RutasTarifas } from "./tarifas/index.routes";
import { RutasProveedores } from "./proveedores/index.routes";
import { RutasEmbarques } from "./embarques/index.routes";
import { RutasCombex } from "./combex/index.routes";
import { RutasEntidad } from "./entidades/index.routes";
import RutasFacturacion from "./facturacion/index.routes";
import { RutasWms } from "./wms/index.router";
import { useSelector } from "react-redux";
import { RutasPublicas } from "./publico/index.routes";
import { RutasObjetivos } from "./objetivos/index.routes";
import RutasReportesBi from "./reportesbi/index.routes";
import RutasCxc from "./cxc/index.routes";

/**
 * Árbol principal de rutas de la aplicación.
 *
 * Filosofía:
 * - Las vistas del ERP dependen solo de si el usuario está **authenticated**.
 * - El estado **checking** existe, pero no debe “romper” el árbol principal del ERP.
 *   Por eso `checking` se trata como una ruta/pantalla auxiliar (p.ej. `checking`),
 *   en lugar de reemplazar todo el árbol de rutas.
 *
 * Estructura:
 * - `public/*`: rutas públicas con layout simplificado.
 * - authenticated:
 *   - `MainLayout` + todas las rutas del ERP.
 * - no authenticated:
 *   - `AuthLayout` con login/reset (y checking opcional).
 */
export const Rutas = ({ status }) => {
  const screen = useSelector((state) => state.screen);
  const { name } = screen;

  const DashboardPageSelected = <DashboardPage />;

  return (
    <Routes>
      <Route path="" element={<IndexLayout />}>
        {/* Rutas públicas - con MainLayoutPublico para mostrar navegación simplificada (disponibles para todos) */}
        <Route path="public/*" element={<MainLayoutPublico />}>
          <Route path="*" element={<RutasPublicas />} />
        </Route>
        {status === "checking" ? (
          <Route path="" element={<MainLayout />}>
            <Route path="*" element={DashboardPageSelected} />
          </Route>
        ) : status === "authenticated" ? (
          <>
            <Route path="/auth/*" element={<Navigate to="/" />} />
            <Route path="not_found" element={<NotFoundPage />} />
            <Route path="/checking" element={<CheckingLayout />} />
            <Route path="" element={<MainLayout />}>
              <Route path="/" element={DashboardPageSelected} />
              <Route path="/menu/:name" element={<MenuDashboardPage />} />
              <Route path="empty" element={<PaginaVaciaPage />} />
              <Route path="tabs" element={<PaginaVaciaPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="memos" element={<MemosPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="ayuda" element={<AyudaPage />} />
              <Route path="/documentacion" element={<Outlet />}>
                <Route path="" element={<DocumentacionDeErp />} />
                <Route path=":id" element={<ListaComponentesDocumentacion />} />
                <Route path=":id/:tipo" element={<DocumentacionDeComponente />} />
              </Route>
              <Route path="notificaciones" element={<AyudaPage />} />
              <Route path="ayudas" element={<AyudaPage />} />
              <Route path="configuracion" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasCruds />} />
              </Route>
              <Route path="crm" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasCRM />} />
              </Route>
              <Route path="entidades" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasEntidad />} />
              </Route>
              <Route path="proveedores" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasProveedores />} />
              </Route>
              <Route path="rrhh" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasRRHH />} />
              </Route>
              <Route path="tarifas" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasTarifas />} />
              </Route>
              <Route path="embarques" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasEmbarques />} />
              </Route>
              <Route path="combex" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasCombex />} />
              </Route>
              <Route path="facturacion" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasFacturacion />} />
              </Route>
              <Route path="test" element={<Outlet />}>
                <Route path="" element={<ListaTest />} />
                <Route path=":1" element={<ListaTest />} />
              </Route>
              <Route path="wms" element={<Outlet />}>
                <Route path="" element={<DashboardPage />} />
                <Route path="*" element={<RutasWms />} />
              </Route>
              <Route path="objetivos" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasObjetivos />} />
              </Route>
              <Route path="reportesbi" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasReportesBi />} />
              </Route>
              <Route path="cxc" element={<Outlet />}>
                <Route path="" element={DashboardPageSelected} />
                <Route path="*" element={<RutasCxc />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </>
        ) : (
          <>
            <Route path="" element={<AuthLayout />}>
              <Route path="" element={<LoginPage />} />
              <Route path="reset-password" element={<ResetPassPage />} />
              <Route path="checking" element={<CheckingLayout />} />
            </Route>
            <Route path="visit" element={<AuthLayout />}>
              <Route path="" element={<NoAuthPage />} />
              <Route path="auth" element={<NoAuthPage />} />
              <Route path="auth/login" element={<LoginPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Route>
    </Routes>
  );
};
Rutas.propTypes = {
  status: PropTypes.string,
};
