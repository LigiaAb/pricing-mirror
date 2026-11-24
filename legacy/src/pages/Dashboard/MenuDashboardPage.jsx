import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { Box, Grid, Typography } from "@mui/material";
import AcordeonComponent from "../../components/AcordeonComponent/AcordeonComponent";
import { setCurrentMenu } from "../../store/slices/menu/menuSlice";
import { useNavigate } from "react-router-dom";
import { useFetchMenus } from "../../hooks/Fetch/useFetchConfiguracion";
import TextComponent from "../../components/Formulario/TextComponent";

export const MenuDashboardPage = (props) => {
  const { json } = useSelector((state) => state.auth);
  const { themeMode, opositeMode } = useSelector((state) => state.theme);

  const { currentPais, currentEmpresa, currentCentroCosto, currentModulo } = useSelector((state) => state.menu);
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filtroMenus, setFiltroMenus] = useState("");
  const permmisosDeMenusSegunCentroCosto = useMemo(() => {
    return json?.permisos?.paises[currentPais?.cod_pais]?.empresas[currentEmpresa?.cod_empresa]?.centrosCosto[currentCentroCosto?.cod_cc]?.modulos[currentModulo?.cod_modulo]?.menus || {};
  }, [json, currentPais, currentEmpresa, currentCentroCosto, currentModulo]);

  const menus = useFetchMenus();

  const menusFiltrados = useMemo(() => {
    return (
      (currentModulo?.menus || [])
        .filter((m1) => currentEmpresa?.cod_empresa === m1.cod_empresa && currentCentroCosto?.cod_cc === m1.cod_cc)
        .filter((m) => `${m.nom_menu || ""}`.toUpperCase().includes(filtroMenus.toUpperCase())) || []
    );
  }, [currentModulo, currentEmpresa, currentCentroCosto, filtroMenus]);

  const handleClickModulo = (e, menu) => {
    // Detectar si se presionó Ctrl (o Cmd en Mac)
    dispatch(setCurrentMenu({ menu }));
    if (e.ctrlKey || e.metaKey) {
      // Abrir en nueva pestaña
      e.preventDefault();
      window.open(currentModulo?.modulo_ruta + "/" + menu.menu_ruta, "_blank");
    } else {
      // Navegación normal en la misma pestaña
      navigate(menu.menu_ruta);
    }
  };

  return (
    <Grid sx={{ px: 2, pb: 2, m: 0, overflowY: "auto" }} id="MenuDashboardBasePage" size="grow">
      <Grid width="100%" container mt={0.5}>
        <Grid size={"grow"} />
        <Grid p={1} size={"auto"}>
          <TextComponent
            input={{
              id: "filtro_modulo",
              tipo: "text",
              label: "Filtro por menu",
              val: filtroMenus,
              helper: false,
              visible: true,
              readonly: false,
            }}
            onInput={(val) => setFiltroMenus(val)}
          />
        </Grid>
      </Grid>
      <Grid container spacing={{ xs: 1, sm: 2 }} direction="row" sx={{ flexWrap: "wrap" }} width="100%">
        {"abcdefghijklmnopqrstuvwxyz"
          .split("")
          .filter((letra) => (menusFiltrados || []).filter((m) => `${m.nom_menu || ""}`.toUpperCase().startsWith(letra.toUpperCase(), 0)).length > 0)
          .map((letra) =>
            (menusFiltrados || [])
              .filter((m) => `${m.nom_menu || ""}`.toUpperCase().startsWith(letra.toUpperCase(), 0))
              .map((m) => (
                <Grid
                  key={`${letra}_${m.cod_menu}`}
                  onClick={(ev) => (permmisosDeMenusSegunCentroCosto[m.cod_menu] ? handleClickModulo(ev, m) : null)}
                  sx={{
                    "&:hover": permmisosDeMenusSegunCentroCosto[m.cod_menu]
                      ? { backgroundColor: themeMode === "dark" ? "grey.800" : "grey.50", cursor: permmisosDeMenusSegunCentroCosto[m.cod_menu] ? "pointer" : "" }
                      : {},
                    cursor: "default",
                    borderEndEndRadius: 5,
                    borderStartEndRadius: 5,
                    borderEndStartRadius: 5,
                    borderStartStartRadius: 5,
                    flexGrow: 1,
                    WebkitBoxShadow: permmisosDeMenusSegunCentroCosto[m.cod_menu] ? "3px 2px 7px 0px rgba(153,153,153,0.87)" : "1px 1px 7px 0px rgba(153,153,153,0.87)",
                    boxShadow: permmisosDeMenusSegunCentroCosto[m.cod_menu] ? "3px 2px 7px 0px rgba(153,153,153,0.87)" : "1px 1px 7px 0px rgba(153,153,153,0.87)",
                  }}
                  bgcolor="background.main"
                  pr={0.5}
                  textAlign="left"
                  alignItems="center"
                  // size={{ sm: 3 }}
                  container
                  direction="row"
                >
                  <Grid
                    size="auto"
                    // bgcolor={permmisosDeMenusSegunCentroCosto[m.cod_menu] ? `primary.${opositeMode}` : "grey.main"}
                    p={0}
                    px={2}
                    sx={{
                      borderColor: permmisosDeMenusSegunCentroCosto[m.cod_menu] ? `primary.${opositeMode}` : "grey.main",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderStartStartRadius: 5,
                      borderEndStartRadius: 5,
                      background: permmisosDeMenusSegunCentroCosto[m.cod_menu] ? "#0B2967" : "#333333",
                    }}
                  >
                    <Typography fontSize="1.5rem" color="white.main" className={`${menus.data?.find((m2) => m2.cod_menu === m.cod_menu)?.ico_menu || m.menu_icono}`} />
                  </Grid>
                  <Grid size="grow" px={1}>
                    <Typography fontSize="1rem" color={permmisosDeMenusSegunCentroCosto[m.cod_menu] ? "text.main" : "grey.main"} fontWeight="bolder">
                      {m.nom_menu}
                    </Typography>
                  </Grid>
                  <Grid size="grow" />
                  <Grid size="auto">
                    <Typography fontSize="1rem" color={permmisosDeMenusSegunCentroCosto[m.cod_menu] ? "text.main" : "grey.main"} fontWeight="bolder">
                      ({m.categorias.length})
                    </Typography>
                    {/* <pre>{JSON.stringify(m, null, 2)}</pre> */}
                  </Grid>
                </Grid>
              )),
          )}
      </Grid>
      <Grid container>
        {/* <pre>{JSON.stringify(permmisosDeMenusSegunCentroCosto, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(json, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(menusFiltrados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(menus.data, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(currentModulo, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

MenuDashboardPage.propTypes = {};

export default MenuDashboardPage;
