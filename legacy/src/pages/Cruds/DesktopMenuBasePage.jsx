import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { Box, Grid, Typography } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { setCurrentCategoria } from "../../store/slices/menu/menuSlice.js";
import TabComponent from "../../components/Tabs/TabComponent.jsx";
import { useObtenerCategoriasActivas, useObtenerPermisosDeMenuActual } from "../../hooks/useObtenerOpcionesAcciones.jsx";
import lightScroll from "../../style/scrollStyle.js";
import { setShowLaterlText } from "../../store/slices/theme/themeSlice.js";
import BotonLateralComponent from "../../components/Boton/BotonLateralComponent.jsx";
import { useFetchCategorias } from "../../hooks/Fetch/useFetchConfiguracion.jsx";

const DeesktopMenuBasePage = (props) => {
  const { opositeMode, showLaterlText } = useSelector((state) => state.theme);
  const { currentMenu, currentCategoria, currentUrl } = useSelector((state) => state.menu);
  // const { permisosArray, catalogoArray, catalogoObj, permisosObj } = useObtenerCategoriasActivas();
  const permimsos = useObtenerPermisosDeMenuActual();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tab, setTab] = useState(false);
  const [filtro, setFiltro] = useState("");
  const fetchCategorias = useFetchCategorias();
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
    [currentMenu, permimsos],
  );
  const [categorias, setCategorias] = useState(categoriasFormateadas || []);
  const primeraCategoria = useMemo(() => categoriasFormateadas.filter((i) => !i.disabled)[0] || false, [currentMenu]);

  const showLabel = useMemo(() => showLaterlText, [showLaterlText]);

  const cambiarTab = useCallback(
    (newTab) => {
      setTab(newTab);
      const c = categoriasFormateadas.find((i) => i.id === newTab);
      if (c) {
        dispatch(setCurrentCategoria({ categoria: c }));
        navigate(c.ruta_cat, { replace: true });
      }
    },
    [categoriasFormateadas, navigate],
  );

  useEffect(() => {
    if (!currentCategoria) {
      cambiarTab(primeraCategoria?.cod_categoria || false);
      navigate(primeraCategoria.ruta_cat, { replace: true });
    } else if (!tab) {
      setTab(currentCategoria?.cod_categoria || false);
      // navigate(currentCategoria.ruta_cat, { replace: true });
    }
  }, [primeraCategoria, currentCategoria]);

  return (
    <Box sx={{ p: 0, pr: 0, m: 0, overflowY: "auto", display: "flex", alignItems: "stretch", height: "calc(100vh - 60px)", width: "100vw !important" }} width="100%" id="DashboardPage">
      <Grid container p={0} m={0} sx={{ height: "100%" }} width="100%">
        <Grid columns={12} size={!showLabel ? 2 : "auto"} px={0} pb={1} sx={{ maxHeight: "100%", maxWidth: "20vw", ...lightScroll, direction: "rtl", background: "#0B2967", transition: "all 0.3s" }}>
          <TabComponent
            titulo={`${currentMenu?.nom_menu || ""}`.toUpperCase()}
            filtro
            opciones={(categoriasFormateadas || [])
              ?.filter((i) => i?.nom_cat?.toUpperCase().includes(filtro?.toUpperCase()))
              .map((i) => ({
                ...i,
                label: i.nom_cat,
                icono: fetchCategorias.data?.find((c) => c.cod_categoria === i.cod_categoria)?.ico_cat || i.ico_cat,
                borderColor: "none",
                activeIconColor: `primary.${opositeMode}`,
                activeColor: "text.main",
                activeBg: "background.main",
                color: "white.main",
                iconColor: "white.main",
                hoverColor: "white.main",
              }))}
            mostrarTitulo
            direccion="column"
            tabSeleccionado={cambiarTab}
            tabInicial={tab}
            ordenAlfabetico
            hideText={showLaterlText}
            // botonRegresar
            onRegresar={(ev) => navigate(-1)}
          />
        </Grid>
        <BotonLateralComponent onClick={() => dispatch(setShowLaterlText(!showLabel))} left={!showLabel} />
        <Grid size="grow" maxWidth="100%" sx={{ ...lightScroll, direction: "ltr", maxHeight: "100%", borderEndEndRadius: 10, borderTopRightRadius: 10, px: 1.5 }} pb={4}>
          <Grid flex={1} size={12} maxWidth="100%" my="auto" zIndex={1}>
            <Outlet />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

DeesktopMenuBasePage.propTypes = {};

export default DeesktopMenuBasePage;
