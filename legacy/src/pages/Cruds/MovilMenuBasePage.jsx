import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, GlobalStyles, SwipeableDrawer, Typography, Divider, Grid, IconButton, List, ListItem, ListItemButton, Stack, ToggleButton } from "@mui/material";
import AcordeonComponent from "../../components/AcordeonComponent/AcordeonComponent";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import { setCurrentCategoria, setCurrentMenu, setCurrentModulo } from "../../store/slices/menu/menuSlice";
import { useObtenerCentrosCostoPorEmpresaActual, useObtenerEmpresasPorPaisActual, useObtenerModuloPorCentroCostoActual, useObtenerPaises } from "../../hooks/useObtenerPermisos.jsx";
import ToggleComponent from "../../components/Formulario/ToggleComponent.jsx";
import lightScroll from "../../style/scrollStyle.js";
import TextComponent from "../../components/Formulario/TextComponent.jsx";
import TabComponent from "../../components/Tabs/TabComponent.jsx";
import { setShowLaterlText } from "../../store/slices/theme/themeSlice.js";
import { useObtenerPermisosDeMenuActual } from "../../hooks/useObtenerOpcionesAcciones.jsx";

const drawerBleeding = 40; // Altura de la pestaña visible

const DrawerDeslizante = ({ children }) => {
  const { movil } = useSelector((state) => state.screen);
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (open) => (event) => {
    // Evita activar con tab o shift
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setOpen(open);
  };

  return (
    <>
      {/* Necesario para permitir que el Drawer sobresalga */}
      <GlobalStyles
        styles={{
          ".MuiDrawer-root > .MuiPaper-root": {
            overflow: "visible",
          },
        }}
      />
      {/* ----------- PESTAÑITA (Puller) SIN CLICK ----------- */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: drawerBleeding,
          // bgcolor: "transparent",
          // zIndex: 1300,
          touchAction: "none",
          pointerEvents: movil ? "none" : "",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(0, 63, 142, 1) 50%, rgba(0, 86, 177, 1) 100%)",

          zIndex: 5000,
        }}
        onClick={toggleDrawer(true)}
      >
        <Box sx={{ py: 0.5, px: "5vw", background: "white", borderRadius: 5 }} />
      </Box>
      {/* ----------- DRAWER DESDE ABAJO ----------- */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        swipeAreaWidth={drawerBleeding} // 👈 swipe SOLO en la pestaña
        disableSwipeToOpen={false}
        disableDiscovery={false}
        p={0}
        m={0}
      >
        {/* Contenido */}
        <Box
          sx={{
            height: movil ? "70vh" : "90vh",
            p: 0,
            m: 0,
            bgcolor: "background.paper",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Box
            sx={{
              // width: 50,
              borderRadius: 3,
              bgcolor: "grey.500",
              mx: "auto",
              mt: 0,
              mb: 0,
              width: "100%",
            }}
          />
          <Grid
            width="100%"
            container
            spacing={2}
            sx={{
              pointerEvents: movil ? "none" : "",
              justifyContent: "center",
              p: 2,
              background: "linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(0, 63, 142, 1) 50%, rgba(0, 86, 177, 1) 100%)",
            }}
            onClick={toggleDrawer(false)}
          >
            <Box sx={{ py: 0.5, px: "5vw", background: "white", borderRadius: 5 }} />
          </Grid>
          {children}
        </Box>
      </SwipeableDrawer>
    </>
  );
};

const MovilMenuBasePage = (props) => {
  const { movil } = useSelector((state) => state.screen);
  const { opositeMode, showLaterlText } = useSelector((state) => state.theme);
  const { currentMenu, currentCategoria, currentUrl } = useSelector((state) => state.menu);
  // const { permisosArray, catalogoArray, catalogoObj, permisosObj } = useObtenerCategoriasActivas();
  const permimsos = useObtenerPermisosDeMenuActual();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tab, setTab] = useState(false);
  const [filtro, setFiltro] = useState("");
  const screenSize = useSelector((state) => state.screen);

  const categoriasFormateadas = useMemo(
    () =>
      (currentMenu?.categorias || [])
        .map((i) => ({
          ...i,
          id: i.cod_categoria,
          disabled: !permimsos[i?.cod_categoria],
          icono: i.categoria_icono,
          tooltip: !permimsos[i?.cod_categoria] ? `${i.nom_cat} Deshabilitado por permisos` : undefined,
        }))
        .sort((a, b) => a.nom_cat.localeCompare(b.nom_cat)),
    [currentMenu, permimsos]
  );
  const [categorias, setCategorias] = useState(categoriasFormateadas || []);
  const primeraCategoria = useMemo(() => categoriasFormateadas.filter((i) => !i.disabled)[0] || false, [currentMenu]);

  const showLabel = useMemo(() => showLaterlText, [showLaterlText]);

  const cambiarTab = useCallback(
    (newTab) => {
      setTab(newTab);
      const c = categorias.find((i) => i.id === newTab);
      if (c) {
        dispatch(setCurrentCategoria({ categoria: c }));
        navigate(c.ruta_cat, { replace: true });
      }
    },
    [categorias, navigate]
  );

  useEffect(() => {
    if (!currentCategoria) {
      setTab(primeraCategoria?.cod_categoria || false);
      navigate(primeraCategoria.ruta_cat, { replace: true });
    } else if (!tab) {
      setTab(currentCategoria?.cod_categoria || false);
      // navigate(currentCategoria.ruta_cat, { replace: true });
    }
  }, []);

  return (
    <Box sx={{ p: 0, pr: 1, m: 0, overflowY: "auto", display: "flex", alignItems: "stretch", height: "calc(100vh - 80px)" }} width="100%" id="DashboardPage">
      <Grid container direction="column" flex={1} sx={{ ...lightScroll, direction: "ltr", maxHeight: "100%", borderEndEndRadius: 10, borderTopRightRadius: 10 }}>
        <Grid flex={1} size={12} textAlign="center" width="100%" my="auto" zIndex={1} pb={{ sm: 6, xs: 6, md: 0 }} pl={{ sm: 1, xs: 1, md: 0 }}>
          <Outlet />
        </Grid>
      </Grid>
      <DrawerDeslizante>
        <Box sx={{ p: 0, pr: 1, m: 0, overflowY: "auto", display: "flex", alignItems: "stretch", height: "calc(100vh - 80px)" }} width="100%">
          <Grid container p={0} display="flex" flex={1}>
            <Grid
              columns={12}
              // size={"auto"}
              px={0}
              pb={1}
              sx={{
                maxHeight: movil ? "70%" : "90%",
                ...lightScroll,
                borderStartEndRadius: 5,
                borderEndStartRadius: 5,
                direction: "rtl",
                // background: "linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(0, 63, 142, 1) 50%, rgba(0, 86, 177, 1) 100%)",
              }}
              size={12}
            >
              <TabComponent
                opciones={categorias
                  ?.filter((i) => i?.nom_cat?.toUpperCase().includes(filtro?.toUpperCase()))
                  .map((i) => ({
                    ...i,
                    label: i.nom_cat,
                    borderColor: "none",
                    // activeIconColor: `primary.${opositeMode}`,
                    // activeColor: "text.main",
                    // activeBg: "background.main",
                    // color: "white.main",
                    // iconColor: "white.main",
                    // hoverColor: "white.main",
                  }))}
                titulo={`${currentMenu?.nom_menu || ""}`.toUpperCase()}
                tabSeleccionado={cambiarTab}
                setFiltro={setFiltro}
                filtro
                mostrarTitulo
                direccion="column"
                // cuerpoBg="linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(0, 63, 142, 1) 50%, rgba(0, 86, 177, 1) 100%)"
                // tabInicial={currentModulo?.cod_modulo || false}
                ordenAlfabetico
                hideText={showLabel}
                tabInicial={tab}
                botonRegresar
                // botonRegresar
                // onRegresar={(ev) => navigate("/..")}
              />
            </Grid>
          </Grid>
        </Box>
      </DrawerDeslizante>
    </Box>
  );
};

DrawerDeslizante.propTypes = { children: PropTypes.node };
MovilMenuBasePage.propTypes = {};

export default MovilMenuBasePage;
