import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, GlobalStyles, SwipeableDrawer, Typography, Divider, Grid, IconButton, List, ListItem, ListItemButton, Stack, ToggleButton } from "@mui/material";
import AcordeonComponent from "../../components/AcordeonComponent/AcordeonComponent";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCurrentCategoria, setCurrentMenu, setCurrentModulo } from "../../store/slices/menu/menuSlice";
import { useObtenerCentrosCostoPorEmpresaActual, useObtenerEmpresasPorPaisActual, useObtenerModuloPorCentroCostoActual, useObtenerPaises } from "../../hooks/useObtenerPermisos.jsx";
import ToggleComponent from "../../components/Formulario/ToggleComponent.jsx";
import lightScroll from "../../style/scrollStyle.js";
import MenuDashboardPage from "./MenuDashboardPage.jsx";
import TextComponent from "../../components/Formulario/TextComponent.jsx";
import TabComponent from "../../components/Tabs/TabComponent.jsx";
import { setShowLaterlText } from "../../store/slices/theme/themeSlice.js";

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

const MovilDashboardPage = (props) => {
  const { opositeMode, themeMode, showLaterlText } = useSelector((state) => state.theme);
  const { json } = useSelector((state) => state.auth);
  const { movil } = useSelector((state) => state.screen);
  const { currentPais, currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const { menus: paises, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filtro_modulo, setFiltro_modulo] = useState("");
  const permmisosDeModulosSegunCentroCosto = useMemo(() => {
    return json?.permisos?.paises[currentPais?.cod_pais]?.empresas[currentEmpresa?.cod_empresa]?.centrosCosto[currentCentroCosto?.cod_cc]?.modulos || {};
  }, [json, currentPais, currentEmpresa, currentCentroCosto]);

  const menusFiltrados = useMemo(
    () => (currentCentroCosto?.modulos || []).filter((m) => `${m.nom_modulo || ""}`.toUpperCase()).filter((i) => i.nom_modulo.toUpperCase().includes((filtro_modulo || "").toUpperCase())),
    [currentCentroCosto?.modulos, filtro_modulo]
  );

  const showLabel = useMemo(() => showLaterlText, [showLaterlText]);

  const handleClickModulo = (e, m) => {
    let modulo;
    if (typeof m === "object") modulo = m;
    else if (typeof m === "string") modulo = paises.find((p) => p.cod_modulo === Number(m));
    else if (typeof m === "number") modulo = paises.find((p) => p.cod_modulo === m);
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

  return (
    <Box sx={{ p: 0, pr: 1, m: 0, overflowY: "auto", display: "flex", alignItems: "stretch", height: "calc(100vh - 80px)" }} width="100%" id="DashboardPage">
      <Grid container direction="column" flex={1} sx={{ ...lightScroll, direction: "ltr", maxHeight: "100%", borderEndEndRadius: 10, borderTopRightRadius: 10 }}>
        <Grid flex={1} size={12} textAlign="center" width="100%" my="auto" zIndex={1}>
          <MenuDashboardPage />
        </Grid>
        {!currentModulo && (
          <Grid flex={1} size={12} textAlign="center" width="100%" my="auto">
            <Typography fontFamily="arial" variant="h4" fontWeight="bolder" color="text.main_30">
              SELECCIONAR UN MODULO PARA EMPEZAR
            </Typography>
          </Grid>
        )}
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
                opciones={menusFiltrados.map((i) => ({
                  ...i,
                  id: i.cod_modulo,
                  label: i.nom_modulo,
                  icono: i.modulo_icono,
                  activeIconColor: `white.main`,
                  activeColor: "white.main",
                  // activeBg: "accent.main",
                  cantidad: `(${i.menus.filter((i) => i.cod_cc === currentCentroCosto?.cod_cc).length})`,
                  // color: "white.main",
                  // iconColor: "white.main",
                  // hoverColor: "white.main",
                  readonly: !permmisosDeModulosSegunCentroCosto[i.cod_modulo],
                }))}
                titulo={"MODULOS"}
                filtro
                mostrarTitulo
                direccion="column"
                // cuerpoBg="linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(0, 63, 142, 1) 50%, rgba(0, 86, 177, 1) 100%)"
                tabSeleccionado={(val) => handleClickModulo({ preventDefault: () => {} }, seleccionarModulo(val))}
                tabInicial={currentModulo?.cod_modulo || false}
                ordenAlfabetico
                hideText={showLabel}
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
MovilDashboardPage.propTypes = {};

export default MovilDashboardPage;
