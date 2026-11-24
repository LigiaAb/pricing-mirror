import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Drawer, Grid, Icon, IconButton, Typography } from "@mui/material";
import { removeCurrentCategoria, removeCurrentMenu, removeCurrentModulo, setCurrentCentroCosto, setCurrentEmpresa, setCurrentPais } from "../store/slices/menu/menuSlice";
import CROPA_DSV_ICON from "../assets/CROPA_DSV_ICON.svg";
import { useLocation, useNavigate } from "react-router-dom";
import GenerarInputSelect from "./GenerarInputSelect";
import { useDispatch, useSelector } from "react-redux";
import MenuComponent from "./MenuComponent/MenuComponent";
import TicketsPage from "../pages/Dashboard/TicketsPage";
import MemosPage from "../pages/Dashboard/MemosPage";
import AyudaPage from "../pages/Dashboard/AyudaPage";
import PerfilPage from "../pages/Dashboard/PerfilPage";
import { handleLogout } from "../store/slices/auth/thunks";
import { setDarkTheme, setLightTheme } from "../store/slices/theme/themeSlice";
import { redirectToUserHome } from "../store/slices/menu/thunks";
import { encryptId } from "../api/encryptDecrypt";
import { useObtenerCentrosCostoPorEmpresaActual, useObtenerEmpresasPorPaisActual, useObtenerPaises } from "../hooks/useObtenerPermisos";

const hoverTextUnderlineStyle = { "&:hover .MuiTypography-button": { textDecoration: "underline" } };

export const SideBar = (props) => {
  const { open = true, onClose, setContenidoDialogo, setOpenDialog, setTitulo } = props;
  const { menus: paises, currentPais, currentEmpresa, currentCentroCosto, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const paisesAutorizados = useObtenerPaises();
  const empresasAutorizadas = useObtenerEmpresasPorPaisActual();
  const centrosCostoAutorizados = useObtenerCentrosCostoPorEmpresaActual();

  const pais = useMemo(() => currentPais, [currentPais]);
  const empresa = useMemo(() => currentEmpresa, [currentEmpresa]);
  const centroCosto = useMemo(() => currentCentroCosto, [currentCentroCosto]);

  const { pathname } = location;

  const handleClickOpen = (title, content) => {
    setTitulo(title);
    setContenidoDialogo(content);
    setOpenDialog(true);
  };

  const handleClose = useCallback(
    (ev) => {
      ev.preventDefault ? ev.preventDefault() : null;
      onClose(false);
    },
    [onClose]
  );

  const copiarEnlaceConCurrents = () => {
    const link = `${window.location.origin}${pathname}?meta=${encryptId(
      JSON.stringify({
        pais: pais?.cod_pais || null,
        empresa: empresa?.cod_empresa || null,
        centroCosto: centroCosto?.cod_cc || null,
        modulo: currentModulo?.cod_modulo || null,
        menu: currentMenu?.cod_menu || null,
        categoria: currentCategoria?.cod_categoria || null,
      })
    )}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <Drawer anchor="left" open={open} onClose={handleClose}>
      <Grid width="100%" container direction="column">
        <Grid sx={{ p: 1, bgcolor: "primary.main" }} width="100%" container direction="row">
          <Grid size="auto">
            <Typography
              sx={{ cursor: "pointer" }}
              onClick={() => {
                // dispatch(setCurrentModulo({ modulo: null }));
                // dispatch(setCurrentMenu({ menu: null }));
                // dispatch(setCurrentCategoria({ categoria: null }));
                navigate("/");
                // onClose(false);
              }}
              lineHeight={1}
              className="c-cropa-dsv"
              fontSize={50}
              color="white.main"
              m={0}
              px={2}
            />
          </Grid>
          <Grid size="grow"></Grid>
          <Grid>
            <IconButton onClick={handleClose} size="small" color="white">
              <Icon className="c-x1" size="xs" />
            </IconButton>
          </Grid>
        </Grid>
        <Grid sx={{ p: 1, bgcolor: "white.main" }} size="auto" width="100%" container>
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
        </Grid>
        <Grid sx={{ mx: 1, mt: 1 }} container size={12} columnSpacing={1} columns={3}>
          <Grid size="auto">
            {!(pathname.split("/").length === 2 || pathname.split("/")[1] === "") ? (
              <Typography>{pais?.nombre_pais}</Typography>
            ) : (
              <GenerarInputSelect
                options={paisesAutorizados}
                value={pais}
                pathname={pathname}
                onChange={(v) => {
                  const pais = paises.find((i) => i.cod_pais === v?.cod_pais) || null;
                  const empresas = pais?.empresas || [];
                  const empresasAutorizadas = v?.empresas || [];

                  const primeraEmpresa = empresas.find((i) => i.cod_empresa === empresasAutorizadas[0]?.cod_empresa) || null;

                  const centrosCosto = primeraEmpresa?.centrosCosto || [];
                  const centrosCostoAutorizados = v?.empresas[0]?.centrosCosto || [];

                  const primerCentroCosto = centrosCosto.find((i) => i.cod_cc === centrosCostoAutorizados[0]?.cod_cc) || null;

                  console.log(pais, empresas, primeraEmpresa, centrosCosto, primerCentroCosto);

                  dispatch(setCurrentPais(pais));
                  dispatch(setCurrentEmpresa(primeraEmpresa || null));
                  dispatch(setCurrentCentroCosto(primerCentroCosto || null));
                }}
                option_label="nombre_pais"
                option_value="cod_pais"
                tooltip="Pais"
                color="black"
              />
            )}
          </Grid>
          <Grid size="auto">
            {!(pathname.split("/").length === 2 || pathname.split("/")[1] === "") ? (
              <Typography>{empresa?.nombre_emp}</Typography>
            ) : (
              <GenerarInputSelect
                color="black"
                options={empresasAutorizadas}
                value={empresa}
                pathname={pathname}
                onChange={(v) => {
                  const empresa = pais?.empresas?.find((i) => i.cod_empresa === v?.cod_empresa) || null;

                  const centrosCosto = empresa?.centrosCosto || [];
                  const centrosCostoAutorizados = v?.centrosCosto || [];

                  const primerCentroCosto = centrosCosto.find((i) => i.cod_cc === centrosCostoAutorizados[0]?.cod_cc) || null;

                  dispatch(setCurrentEmpresa(empresa));
                  dispatch(setCurrentCentroCosto(primerCentroCosto || null));
                }}
                option_label="nombre_emp"
                option_value="cod_empresa"
                tooltip="Empresa"
              />
            )}
          </Grid>
          <Grid size="auto">
            {!(pathname.split("/").length === 2 || pathname.split("/")[1] === "") ? (
              <Typography>{centroCosto?.nombre_cc}</Typography>
            ) : (
              <GenerarInputSelect
                color="black"
                options={centrosCostoAutorizados}
                value={centroCosto}
                pathname={pathname}
                onChange={(v) => {
                  const centroCosto = empresa?.centrosCosto.find((i) => i.cod_cc === v?.cod_cc) || null;
                  dispatch(setCurrentCentroCosto(centroCosto));
                }}
                option_label="nombre_cc"
                option_value="cod_cc"
                tooltip="Centro de Costo"
              />
            )}
          </Grid>
        </Grid>
        <Grid sx={{ mx: 1, mt: 1 }} size="auto">
          <MenuComponent
            direction="column"
            backgroundColor="transparent"
            borderColor="primary.main"
            textColor="primary.main"
            propiedades={{ clickFunction: "onClick", icono: "icon", id: "id", texto: "label", label: "tooltip", ruta: "to" }}
            menus={[
              {
                id: "side_home",
                color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                icon: "c-home",
                label: "Inicio",
                tooltip: "Regresar a página de inicio",
                onClick: (ev) => {
                  ev.preventDefault();
                  navigate(dispatch(redirectToUserHome()));
                },
              },
              {
                id: "side_tickets",
                color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                icon: "c-ticket",
                label: "Tickets",
                onClick: () => {
                  onClose(false);
                  handleClickOpen("Crear Ticket", <TicketsPage />);
                },
              },
              {
                id: "side_memos",
                color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                icon: "c-memos",
                label: "Memos",
                onClick: () => {
                  onClose(false);
                  handleClickOpen("Crear Meno", <MemosPage />);
                },
              },
              {
                id: "side_documentacion",
                color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                icon: "c-capas",
                label: "Documentacion de Componentes",
                to: "/documentacion",
              },
              {
                id: "side_ayuda",
                color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                icon: "c-ayuda",
                label: "Ayuda de Procesos",
                onClick: () => {
                  onClose(false);
                  handleClickOpen("Ayuda", <AyudaPage />);
                },
              },
              {
                id: "side_perfil",
                color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                icon: "c-usuario",
                label: "Perfil de usuario",
                onClick: () => {
                  onClose(false);
                  handleClickOpen("Perfil de Usuario", <PerfilPage />);
                },
              },
            ]}
          />
          <MenuComponent
            direction="column"
            backgroundColor="transparent"
            borderColor="primary.main"
            textColor="primary.main"
            propiedades={{ clickFunction: "onClick", icono: "icon", id: "id", texto: "label", label: "tooltip", ruta: "to" }}
            menus={[
              // notific?.filter((i) => !i.leido).length > 0
              //   ? {
              //       id: "notificaciones",
              //       color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
              //       iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
              //       icon: "c-campana",
              //       label: "notificaciones",
              //       alerta: notific?.filter((i) => !i.leido).length > 0,
              //       children: [
              //         ...(notific
              //           ?.filter((i) => !i.leido)
              //           ?.map((i) => ({
              //             ...i,
              //             id: i.id_notificacion,
              //             icon: `c-circle${i.leido ? "1" : ""}`,
              //             color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
              //             iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
              //             bgcolor: "background.main",
              //             border: "primary.main",
              //             label: i.asunto,
              //             descripcion: `${i.contenido.slice(0, 100)}${i.contenido.length > 100 ? "..." : ""}`,
              //             onClick: () => {
              //               handleClickNotificacion(`Notificacione ${i.id_notificacion}`, <NotificacionPage>{`Notificacione ${i.id_notificacion}`}</NotificacionPage>, i);
              //             },
              //           })) || []),
              //         {
              //           id: "Lsita de notificaciones",
              //           icon: "c-campana",
              //           iconcolor: "white.main",
              //           iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
              //           color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
              //           bgcolor: "primary.main",
              //           label: "Lista de notificaciones",
              //           to: "/notificaciones",
              //         },
              //       ],
              //     }
              //   : {
              //       id: "Lsita de notificaciones",
              //       icon: "c-campana",
              //       iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
              //       color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
              //       label: "Lista de notificaciones",
              //       to: "/notificaciones",
              //     },
              ...(import.meta.env.VITE_APLICAR_SHARE_RUL == "true"
                ? [
                    {
                      id: "copiar_url",
                      color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                      iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                      icon: "c-compartir",
                      label: "Compartir enlace actual",
                      onClick: () => copiarEnlaceConCurrents(),
                    },
                  ]
                : []),
              ...(import.meta.env.VITE_APLICAR_TEMA == "true"
                ? [
                    {
                      id: "tickets",
                      iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                      color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                      onClick: () => {
                        // console.log(palette.mode);
                        dispatch(localStorage.getItem("theme") === "dark" ? setLightTheme() : setDarkTheme());

                        /* dispatch(setLightTheme()) : dispatch(setDarkTheme()) */
                      },
                      icon: localStorage.getItem("theme") === "light" ? "c-luna" : "c-sol",
                      label: `Cambiar a tema ${localStorage.getItem("theme") === "dark" ? "claro" : "oscuro"}`,
                      tooltip: "Cambiar a tema Oscuro",
                    },
                  ]
                : []),
            ]}
          />
          <MenuComponent
            direction="column"
            backgroundColor="transparent"
            borderColor="primary.main"
            textColor="primary.main"
            propiedades={{ clickFunction: "onClick", icono: "icon", id: "id", texto: "label", tooltip: "tooltip", ruta: "to" }}
            menus={[
              {
                id: "cerrar sesion",
                iconColor: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                color: `${localStorage.getItem("theme") === "dark" ? "text.main" : "primary.main"}`,
                icon: "c-cerrar-sesion",
                label: "Cerrar Sesión",
                onClick: () => dispatch(handleLogout()),
              },
            ]}
          />
        </Grid>
      </Grid>
    </Drawer>
  );
};

SideBar.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
  children: PropTypes.any,
  setContenidoDialogo: PropTypes.func,
  setOpenDialog: PropTypes.func,
  setTitulo: PropTypes.func,
};

export default SideBar;
