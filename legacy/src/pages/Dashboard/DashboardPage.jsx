import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Collapse, Divider, Grid, IconButton, List, ListItem, ListItemButton, Stack, ToggleButton, Typography } from "@mui/material";
import AcordeonComponent from "../../components/AcordeonComponent/AcordeonComponent";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCurrentCategoria, setCurrentCentroCosto, setCurrentEmpresa, setCurrentMenu, setCurrentModulo, setCurrentPais } from "../../store/slices/menu/menuSlice";
import { useObtenerCentrosCostoPorEmpresaActual, useObtenerEmpresasPorPaisActual, useObtenerModuloPorCentroCostoActual, useObtenerPaises } from "../../hooks/useObtenerPermisos.jsx";
import ToggleComponent from "../../components/Formulario/ToggleComponent.jsx";
import lightScroll from "../../style/scrollStyle.js";
import MenuDashboardPage from "./MenuDashboardPage.jsx";
import TextComponent from "../../components/Formulario/TextComponent.jsx";
import TabComponent from "../../components/Tabs/TabComponent.jsx";
import { setShowLaterlText } from "../../store/slices/theme/themeSlice.js";
import BotonLateralComponent from "../../components/Boton/BotonLateralComponent.jsx";
import PaisEmpresaCenCosDashboardPage from "./PaisEmpresaCenCosDashboardPage.jsx";
import { useFetchModulos } from "../../hooks/Fetch/useFetchConfiguracion.jsx";
import LoaderComponent from "@/components/Loader/LoaderComponent";

export const DashboardPage = (props) => {
  const { opositeMode, themeMode, showLaterlText } = useSelector((state) => state.theme);
  const { json, dashboardAccessGranted, status } = useSelector((state) => state.auth);
  const { currentPais, currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const { menus: paises, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const paisesAutorizados = useObtenerPaises();

  const empresasAutorizadas = useObtenerEmpresasPorPaisActual();
  const centrosCostoAutorizados = useObtenerCentrosCostoPorEmpresaActual();
  const modulos = useFetchModulos();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filtro_modulo, setFiltro_modulo] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);

  const isLoading = paisesAutorizados.length === 0 || empresasAutorizadas.length === 0 || centrosCostoAutorizados.length === 0;

  const permmisosDeModulosSegunCentroCosto = useMemo(() => {
    return json?.permisos?.paises[currentPais?.cod_pais]?.empresas[currentEmpresa?.cod_empresa]?.centrosCosto[currentCentroCosto?.cod_cc]?.modulos || {};
  }, [json, currentPais, currentEmpresa, currentCentroCosto]);

  const menusFiltrados = useMemo(
    () => [
      ...(currentCentroCosto?.modulos || []).filter((m) => `${m.nom_modulo || ""}`.toUpperCase()).filter((i) => i.nom_modulo.toUpperCase().includes((filtro_modulo || "").toUpperCase())),
      { cod_modulo: -1, nom_modulo: "Test", modulo_icono: "c-t", menus: [], modulo_ruta: "/test" },
    ],
    [currentCentroCosto?.modulos, filtro_modulo],
  );

  const showLabel = useMemo(() => showLaterlText, [showLaterlText]);

  const handleClickModulo = (e, m) => {
    let modulo;
    if (typeof m === "object") modulo = m;
    else if (typeof m === "string") modulo = paises.find((p) => p.cod_modulo === Number(m));
    else if (typeof m === "number") modulo = paises.find((p) => p.cod_modulo === m);

    if (modulo.cod_modulo === -1) {
      navigate(modulo.modulo_ruta);
      return;
    }

    // Detectar si se presionó Ctrl (o Cmd en Mac)
    dispatch(setCurrentModulo({ modulo: modulo ? { ...modulo, menus: modulo.menus.filter((m) => m.cod_cc == currentCentroCosto.cod_cc) } : null }));
    dispatch(setCurrentMenu({ menu: null }));
    dispatch(setCurrentCategoria({ categoria: null }));
    document.title = `ERP CROPA | DSV - ${modulo.nom_modulo}`;
    if (e.ctrlKey || e.metaKey) {
      // Abrir en nueva pestaña
      e.preventDefault();
      window.open(modulo.modulo_ruta, "_blank");
    } else {
      // Navegación normal en la misma pestaña
      navigate(modulo.modulo_ruta);
    }
  };

  const seleccionarModulo = (modulo) => {
    return menusFiltrados.find((i) => i.cod_modulo === modulo);
  };
  const seleccionarPais = (item) => {
    dispatch(setCurrentPais(item));
    dispatch(setCurrentEmpresa(null));
    dispatch(setCurrentCentroCosto(null));
  };
  const seleccionarEmpresa = (item) => {
    dispatch(setCurrentEmpresa(item));
    dispatch(setCurrentCentroCosto(null));
  };
  const seleccionarCentroCosto = (item) => {
    dispatch(setCurrentCentroCosto(item));
  };
  const limpiarEmpresa = () => {
    dispatch(setCurrentPais(null));
    dispatch(setCurrentEmpresa(null));
    dispatch(setCurrentCentroCosto(null));
  };
  const limpiarCentroCosto = (item) => {
    dispatch(setCurrentEmpresa(null));
    dispatch(setCurrentCentroCosto(null));
  };

  const renderizarSeleccionDePais = () => <PaisEmpresaCenCosDashboardPage titulo="País" catalogo={paisesAutorizados} catalogo_key="cod_pais" label="nombre_pais" funcionSeleccion={seleccionarPais} />;
  const renderizarSeleccionDeEmpresa = () => (
    <PaisEmpresaCenCosDashboardPage
      funcionLimpiar={limpiarEmpresa}
      titulo="Empresa"
      catalogo={empresasAutorizadas}
      catalogo_key="cod_empresa"
      label="nombre_emp"
      funcionSeleccion={seleccionarEmpresa}
    />
  );
  const renderizarSeleccionDeCentroCosto = () => (
    <PaisEmpresaCenCosDashboardPage
      funcionLimpiar={limpiarCentroCosto}
      titulo="Centro de Costo"
      catalogo={centrosCostoAutorizados}
      catalogo_key="cod_cc"
      label="nombre_cc"
      funcionSeleccion={seleccionarCentroCosto}
    />
  );

  useEffect(() => {
    console.log("DashboardPage useEffect - Verificando acceso al dashboard", { dashboardAccessGranted });
    if (dashboardAccessGranted) {
      setAccessGranted(true);
      return;
    }
    const access = sessionStorage.getItem("dashboardAccessGranted");
    if (access === "true") {
      setAccessGranted(true);
    } else setAccessGranted(false);
  }, [dashboardAccessGranted]);

  return (
    <Box sx={{ p: 0, pr: 0, m: 0, overflowY: "auto", display: "flex", alignItems: "stretch", height: "calc(100vh - 60px)" }} width="100%" id="DashboardPage">
      <LoaderComponent open={isLoading} />
      {status === "checking" || !dashboardAccessGranted ? (
        <PaisEmpresaCenCosDashboardPage grantAccess={setAccessGranted} />
      ) : (
        <Grid container p={0} flex={1}>
          <Grid size={!showLabel ? 2 : "auto"} columns={12} px={0} pb={1} sx={{ maxHeight: "100%", maxWidth: "20vw", ...lightScroll, direction: "rtl", background: "#0B2967" }}>
            <TabComponent
              titulo={"MODULOS"}
              filtro
              opciones={[...menusFiltrados].map((i) => ({
                ...i,
                id: i.cod_modulo,
                label: i.nom_modulo,
                icono: modulos.data?.find((m) => m.cod_modulo === i.cod_modulo)?.ico_modulo || i.modulo_icono,
                activeIconColor: `primary.${opositeMode}`,
                activeColor: "text.main",
                activeBg: "background.main",
                cantidad: `(${i.menus.filter((i) => i.cod_cc === currentCentroCosto?.cod_cc).length})`,
                color: "white.main",
                iconColor: "white.main",
                hoverColor: "white.main",
                readonly: i.cod_modulo === -1 ? false : !permmisosDeModulosSegunCentroCosto[i.cod_modulo],
              }))}
              mostrarTitulo
              direccion="column"
              tabSeleccionado={(val) => handleClickModulo({ preventDefault: () => {} }, seleccionarModulo(val))}
              tabInicial={currentModulo?.cod_modulo || false}
              ordenAlfabetico
              hideText={showLabel}
            />
          </Grid>
          <BotonLateralComponent onClick={() => dispatch(setShowLaterlText(!showLabel))} left={!showLabel} />
          <Grid container direction="column" size="grow" sx={{ ...lightScroll, direction: "ltr", maxHeight: "100%", borderEndEndRadius: 10, borderTopRightRadius: 10 }}>
            <Grid flex={1} size={12} textAlign="center" width="100%" my="auto" zIndex={1}>
              <MenuDashboardPage />
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

DashboardPage.propTypes = {};

export default DashboardPage;
