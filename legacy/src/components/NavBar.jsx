import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { AppBar, Autocomplete, Box, Grid, Icon, IconButton, TextField, Toolbar, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import MenuComponent from "./MenuComponent/MenuComponent";
import { handleLogout } from "../store/slices/auth/thunks";
import { Input } from "@base-ui-components/react/input";

// ICONS
import CROPA_DSV_ICON from "../assets/CROPA_DSV_ICON.svg";

// GIF
import LOADER from "../assets/loader_1.gif";
import {
  getCurrentEmpresa,
  removeCurrentCategoria,
  removeCurrentMenu,
  removeCurrentModulo,
  setCurrentCategoria,
  setCurrentCentroCosto,
  setCurrentEmpresa,
  setCurrentMenu,
  setCurrentModulo,
  setCurrentPais,
} from "../store/slices/menu/menuSlice";
import TicketsPage from "../pages/Dashboard/TicketsPage";
import MemosPage from "../pages/Dashboard/MemosPage";
import AyudaPage from "../pages/Dashboard/AyudaPage";
import PerfilPage from "../pages/Dashboard/PerfilPage";
import GenerarInputSelect from "./GenerarInputSelect";
import { leerNotificacion } from "../store/slices/notificaciones/notificacionSlice";
import { encryptId } from "../api/encryptDecrypt";
import { redirectToUserHome } from "../store/slices/menu/thunks";
import { useObtenerCentrosCostoPorEmpresaActual, useObtenerEmpresasPorPaisActual, useObtenerPaises } from "../hooks/useObtenerPermisos";
import { setDarkTheme, setLightTheme } from "../store/slices/theme/themeSlice";
import { setDashboardAccessGranted } from "../store/slices/auth/authSlice";

const hoverTextUnderlineStyle = { "&:hover .MuiTypography-button": { textDecoration: "underline" } };
const background = "#0B2967";

export const NavBar = ({ handleDrawer, open = true, setContenidoDialogo, setOpenDialog, setTitulo }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { notificaciones } = useSelector((state) => state.notificacion);
  const screenSize = useSelector((state) => state.screen);
  const { mensaje, cargando } = useSelector((state) => state.status);
  const { json, dashboardAccessGranted } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.theme);
  const { movil } = useSelector((state) => state.screen);
  const paisesAutorizados = useObtenerPaises();
  const empresasAutorizadas = useObtenerEmpresasPorPaisActual();
  const centrosCostoAutorizados = useObtenerCentrosCostoPorEmpresaActual();
  const { menus: paises, currentPais, currentEmpresa, currentCentroCosto, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);

  const notific = useMemo(() => notificaciones, [notificaciones]);

  const { pathname } = location;

  const handleClickOpen = (title, content) => {
    setTitulo(title);
    setContenidoDialogo(content);
    setOpenDialog(true);
  };

  const handleClickNotificacion = (title, content, notifi) => {
    dispatch(leerNotificacion(notifi));
    setTitulo(title);
    setContenidoDialogo(content);
    setOpenDialog(true);
  };

  const pais = useMemo(() => currentPais, [currentPais]);
  const empresa = useMemo(() => currentEmpresa, [currentEmpresa]);
  const centroCosto = useMemo(() => currentCentroCosto, [currentCentroCosto]);

  useEffect(() => {
    dispatch(getCurrentEmpresa());
  }, []);

  const copiarEnlaceConCurrents = () => {
    const link = `${window.location.origin}${pathname}?meta=${encryptId(
      JSON.stringify({
        pais: pais?.cod_pais || null,
        empresa: empresa?.cod_empresa || null,
        centroCosto: centroCosto?.cod_cc || null,
        modulo: currentModulo?.cod_modulo || null,
        menu: currentMenu?.cod_menu || null,
        categoria: currentCategoria?.cod_categoria || null,
      }),
    )}`;
    navigator.clipboard.writeText(link);
  };

  const obtenerValorDesdeArray = () => {};

  return (
    <AppBar position="sticky" enableColorOnDark sx={{ top: 0, boxShadow: "none", background }}>
      <Toolbar
        variant="dense"
        sx={{
          // Ocupar toda la altura disponible
          height: "100%",
          minHeight: "auto !important", // Anular altura mínima por defecto

          // Centrado vertical de todos los hijos
          display: "flex",
          alignItems: "center", // Alineación vertical

          p: 0,
        }}
      >
        <Box display={["sm", "xs"].includes(screenSize.name) ? "" : "none"}>
          <IconButton color="white" onClick={handleDrawer} edge="start" sx={{ mr: 2, ml: 2 }}>
            <Icon className="c-menu" />
          </IconButton>
        </Box>
        <Typography
          onClick={() => {
            document.title = `ERP CROPA | DSV`;
            navigate("/");
            // dispatch(setCurrentPais(null));
            // dispatch(setCurrentEmpresa(null));
            // dispatch(setCurrentCentroCosto(null));
          }}
          variant="span"
          color="white"
          className="c-cropa-dsv"
          sx={{ m: 0, p: 0, "&:before": { fontSize: 60 } }}
        ></Typography>
        <Grid container width={"100%"} display={!["sm", "xs"].includes(screenSize.name) ? "" : "none"}>
          <Grid size="grow"></Grid>
          <Grid
            size={{ md: "auto", xs: 12 }}
            sx={{
              alignSelf: "center",
              // Ocupar toda la altura disponible
              height: "100%",
              minHeight: "auto !important", // Anular altura mínima por defecto

              // Centrado vertical de todos los hijos
              display: "flex",
              alignItems: "center", // Alineación vertical
            }}
            container
            direction="row"
          >
            <Grid size={{ sx: "grow", sm: "grow" }}></Grid>

            {dashboardAccessGranted && (
              <Grid size={{ md: "auto", sm: "grow" }} px={1}>
                <Typography
                  sx={{ textTransform: "uppercase", "&:hover": { cursor: "pointer" } }}
                  className="c-izquierda"
                  fontSize={20}
                  onClick={() => {
                    dispatch(setDashboardAccessGranted(false));

                    // dispatch(setCurrentPais(null));
                    // dispatch(setCurrentEmpresa(null));
                    // dispatch(setCurrentCentroCosto(null));
                  }}
                />
              </Grid>
            )}
            <Grid size={{ md: "auto", sm: "grow" }} sx={{ "& p": { textTransform: "uppercase" } }} px={1}>
              <Typography fontSize="2.5vh">{pais?.nombre_pais}</Typography>
            </Grid>
            <Grid size={{ md: "auto", sm: "grow" }} sx={{ "& p": { textTransform: "uppercase" } }} px={1}>
              <Typography fontSize="2.5vh">{empresa?.nombre_emp}</Typography>
            </Grid>
            <Grid size={{ md: "auto", sm: "grow" }} sx={{ "& p": { textTransform: "uppercase" } }} px={1}>
              <Typography fontSize="2.5vh">{centroCosto?.nombre_cc}</Typography>
            </Grid>
          </Grid>
          <Grid size="auto" sx={{ mx: 2 }}></Grid>
          <Grid size="auto">
            <MenuComponent
              direction="row"
              backgroundColor="primary"
              borderColor="white.main"
              textColor="whtie.main"
              propiedades={{
                clickFunction: "onClick",
                icono: "icon",
                id: "id",
                texto: "label",
                tooltip: "tooltip",
                ruta: "to",
              }}
              menus={[
                {
                  id: "home",
                  color: "white.main",
                  iconColor: "white.main",
                  icon: "c-home",
                  tooltip: "Regresar a página de inicio",
                  onClick: (ev) => {
                    ev.preventDefault();
                    navigate(dispatch(redirectToUserHome()));
                  },
                },
                ...(import.meta.env.VITE_APLICAR_SHARE_RUL == "true"
                  ? [
                      {
                        id: "copiar_url",
                        color: "white.main",
                        iconColor: "white.main",
                        icon: "c-compartir",
                        tooltip: "Copiar enlace actual",
                        onClick: () => copiarEnlaceConCurrents(),
                      },
                    ]
                  : []),
                {
                  id: "tickets",
                  color: "white.main",
                  iconColor: "white.main",
                  icon: "c-ticket",
                  tooltip: "Tickets",
                  onClick: () => handleClickOpen("Crear Ticket", <TicketsPage />),
                },
                {
                  id: "memos",
                  color: "white.main",
                  iconColor: "white.main",
                  icon: "c-memos",
                  tooltip: "Memos",
                  onClick: () => handleClickOpen("Crear Meno", <MemosPage />),
                },
                {
                  id: "documentacion",
                  color: "white.main",
                  iconColor: "white.main",
                  icon: "c-capas",
                  tooltip: "Documentacion de Componentes",
                  to: "/documentacion",
                },
                {
                  id: "ayuda",
                  color: "white.main",
                  iconColor: "white.main",
                  icon: "c-ayuda",
                  tooltip: "Ayuda de Procesos",
                  onClick: () => handleClickOpen("Ayuda", <AyudaPage />),
                },
                {
                  id: "perfil",
                  color: "white.main",
                  iconColor: "white.main",
                  icon: "c-usuario",
                  tooltip: "Perfil de usuario",
                  onClick: () => handleClickOpen("Perfil de Usuario", <PerfilPage />),
                },
              ]}
            />
          </Grid>{" "}
          <Grid size="auto">
            <MenuComponent
              direction="row"
              backgroundColor="transparent"
              borderColor="white.main"
              textColor="whtie.main"
              propiedades={{
                clickFunction: "onClick",
                icono: "icon",
                id: "id",
                texto: "label",
                tooltip: "tooltip",
                ruta: "to",
              }}
              menus={[
                notific?.filter((i) => !i.leido).length > 0
                  ? {
                      id: "notificaciones",
                      color: "white.main",
                      iconColor: "white.main",
                      icon: "c-campana",
                      alerta: notific?.filter((i) => !i.leido).length > 0,
                      children: [
                        ...(notific
                          ?.filter((i) => !i.leido)
                          ?.map((i) => ({
                            ...i,
                            id: i.id_notificacion,
                            icon: `c-circle${i.leido ? "1" : ""}`,
                            color: "text.main",
                            iconColor: "text.main",
                            bgcolor: "background.main",
                            border: "primary.main",
                            label: i.asunto,
                            descripcion: `${i.contenido.slice(0, 100)}${i.contenido.length > 100 ? "..." : ""}`,
                            // onClick: () => handleClickNotificacion(`Notificacione ${i.id_notificacion}`, <NotificacionPage>{`Notificacione ${i.id_notificacion}`}</NotificacionPage>, i),
                          })) || []),
                        {
                          id: "Lsita de notificaciones",
                          icon: "c-bell",
                          iconColor: "white.main",
                          border: "white.main",
                          color: "white.main",
                          bgcolor: "primary.main",
                          label: "Lista de notificaciones",
                          to: "/notificaciones",
                        },
                      ],
                    }
                  : {
                      id: "Lsita de notificaciones",
                      icon: "c-campana",
                      iconColor: "white.main",
                      to: "/notificaciones",
                    },
                ...(import.meta.env.VITE_APLICAR_TEMA == "true" || currentCentroCosto?.cod_cc === 2
                  ? [
                      {
                        id: "tickets",
                        iconColor: "white.main",
                        onClick: () => {
                          // console.log(palette.mode);
                          localStorage.getItem("theme") === "dark" ? localStorage.setItem("theme", "light") : localStorage.setItem("theme", "dark");

                          window.dispatchEvent(new Event("themeChange"));
                          localStorage.getItem("theme") === "dark" ? dispatch(setDarkTheme()) : dispatch(setLightTheme());
                        },
                        icon: localStorage.getItem("theme") === "light" ? "c-luna" : "c-sol",
                        color: "white",
                        tooltip: `Cambiar a tema ${localStorage.getItem("theme") === "light" ? "Oscuro" : "Claro"}`,
                      },
                    ]
                  : []),
              ]}
            />
          </Grid>
          <Grid size="auto">
            <MenuComponent
              direction="row"
              backgroundColor="primary"
              borderColor="white.main"
              textColor="whtie.main"
              propiedades={{ clickFunction: "onClick", icono: "icon", id: "id", texto: "label", tooltip: "tooltip", ruta: "to" }}
              menus={[{ id: "cerrar sesion", color: "white.main", iconColor: "white.main", icon: "c-cerrar-sesion", tooltip: "Cerrar Sesión", onClick: () => dispatch(handleLogout()) }]}
            />
          </Grid>
          {/* </Grid> */}
        </Grid>
      </Toolbar>
      {/* <Grid container px={3} py={0.5} boxShadow="1px 9px 7px -6px rgba(0,0,0,0.1)" sx={{ background }} color="white.main" width="100%">
        <Grid size={{ md: 2, sm: 0, xs: 0 }}></Grid>
        <Grid sx={{ mr: 1, ...hoverTextUnderlineStyle }} size="auto">
          <Typography
            variant="button"
            sx={{ textDecoration: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              dispatch(removeCurrentModulo());
              dispatch(removeCurrentMenu());
              dispatch(removeCurrentCategoria());
              navigate(`/`);
              document.title = `ERP CROPA | DSV`;
            }}
          >
            Inicio
          </Typography>
        </Grid>
        <Grid size="auto" display={currentModulo ? "" : "none"} sx={{ ...hoverTextUnderlineStyle }}>
          <Typography variant="span" sx={{ mr: 1, textDecoration: "none", border: "none", cursor: "pointer" }}>
            {"/"}
          </Typography>
          <Typography
            variant="button"
            sx={{ mr: 1, textDecoration: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              dispatch(removeCurrentMenu());
              dispatch(removeCurrentCategoria());
              navigate(`${currentModulo?.modulo_ruta}`);
              document.title = `ERP CROPA | DSV - ${currentModulo?.nom_modulo}`;
            }}
          >
            {currentModulo?.nom_modulo}
          </Typography>
        </Grid>
        <Grid sx={{ ...hoverTextUnderlineStyle }} size="auto" display={currentMenu ? "" : "none"}>
          <Typography variant="span" sx={{ mr: 1, textDecoration: "none", border: "none", cursor: "pointer" }}>
            {"/"}
          </Typography>
          <Typography
            variant="button"
            sx={{ mr: 1, textDecoration: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              dispatch(removeCurrentCategoria());
              navigate(`${currentModulo?.modulo_ruta}/${currentMenu?.menu_ruta}`);
              document.title = `ERP CROPA | DSV - ${currentMenu?.nom_menu}`;
            }}
          >
            {currentMenu?.nom_menu}
          </Typography>
        </Grid>
        <Grid sx={{ ...hoverTextUnderlineStyle }} size="auto" display={currentCategoria ? "" : "none"}>
          <Typography variant="span" sx={{ mr: 1, textDecoration: "none", border: "none", cursor: "pointer" }}>
            {"/"}
          </Typography>
          <Typography
            variant="button"
            sx={{ textDecoration: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              dispatch(removeCurrentCategoria());
              navigate(`${currentModulo?.modulo_ruta}/${currentMenu?.menu_ruta}/${currentCategoria?.ruta_cat}`);
              document.title = `ERP CROPA | DSV - ${currentCategoria?.nom_cat}`;
            }}
          >
            {currentCategoria?.nom_cat}
          </Typography>
        </Grid>
        <Grid size="grow"></Grid>
        <Grid size="auto" display={!cargando && "none"}>
          <img src={LOADER} alt={"cropa dsv"} loading="lazy" width={80} style={{ cursor: "pointer" }} />
          {mensaje}
        </Grid>
      </Grid> */}
      <Grid container width={"100%"}>
        {/* <pre>{JSON.stringify(theme, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(currentMenu, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(paises, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(json, null, 2)}</pre> */}
        {/* <pre>
          {JSON.stringify(
            Object.keys(json.permisos.paises).map((key) => ({ ...json.permisos.paises[key], empresas: undefined })),
            null,
            2
            )}
            </pre> */}
      </Grid>
    </AppBar>
  );
};

NavBar.propTypes = { handleDrawer: PropTypes.func, open: PropTypes.bool, setContenidoDialogo: PropTypes.func, setOpenDialog: PropTypes.func, setTitulo: PropTypes.func };

export default NavBar;
