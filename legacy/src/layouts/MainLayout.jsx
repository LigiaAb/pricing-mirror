import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography } from "@mui/material";
import NavBar from "../components/NavBar";
import { SideBar } from "../components/SideBar";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import ActionAlertComponent from "../components/Dialog/ActionAlertComponent";
import DialogComponent from "../components/Dialog/DialogComponent";
import { removeCurrentCategoria, removeCurrentMenu, removeCurrentModulo } from "../store/slices/menu/menuSlice";

const sideNabWidth = 240;

const MainLayout = (props) => {
  const screenSize = useSelector((state) => state.screen);
  const { opositeMode, themeMode } = useSelector((state) => state.theme);
  const { name } = screenSize;
  let dispatch = useDispatch();
  const { menus: paises, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [tituloDialog, setTituloDialog] = useState("");
  const [contenido, setContenido] = useState(null);

  const handleDrawer = () => {
    setOpen((val) => !val);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 0, m: 0, flex: 1, alignItems: "stretch", flexDirection: "column", display: "flex", bgcolor: "background.main" }} maxWidth={"100vw"} id="MainLayout">
      <NavBar
        setContenidoDialogo={(v) => setContenido(v)}
        setOpenDialog={(v) => setOpenDialog(v)}
        setTitulo={(v) => setTituloDialog(v)}
        open={open}
        handleDrawer={handleDrawer}
        sideNabWidth={["sm", "xs"].includes(name) && open ? sideNabWidth : 0}
        backgroundColor={"primary"}
      />
      {(name == "xs" || name == "sm") && (
        <SideBar setContenidoDialogo={(v) => setContenido(v)} setOpenDialog={(v) => setOpenDialog(v)} setTitulo={(v) => setTituloDialog(v)} onClose={setOpen} open={open} sideNabWidth={sideNabWidth} />
      )}
      <Box
        zIndex={0}
        position="absolute"
        bottom="0%"
        right="0%"
        sx={{
          transform: ["sm", "xs"].includes(name) ? "translate(0%, 0%)" : "translate(-5%, 0%)",
        }}
      >
        <Typography fontSize="5vw" className="c-cropa-dsv-long" color={themeMode === "dark" ? "primary.100_10" : "primary.200_30"} />
      </Box>
      <Grid container sx={{ p: 0, m: 0, flex: 1 }} width="100%" zIndex={1} id="bodyContent">
        <Grid size={12} height="90vh">
          <Outlet />
        </Grid>
        <Grid zIndex={200000} container px={3} py={0.5} boxShadow="1px 9px 7px -6px rgba(0,0,0,0.1)" sx={{}} color="text.main" width="100%">
          <Grid size={{ md: 2, sm: 0, xs: 0 }}></Grid>
          <Grid sx={{ mr: 1 }} size="auto">
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
          <Grid size="auto" display={currentModulo ? "" : "none"} sx={{}}>
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
          <Grid sx={{}} size="auto" display={currentMenu ? "" : "none"}>
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
          <Grid sx={{}} size="auto" display={currentCategoria ? "" : "none"}>
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
          {/* <Grid size="auto" display={!cargando && "none"}>
          <img src={LOADER} alt={"cropa dsv"} loading="lazy" width={80} style={{ cursor: "pointer" }} />
          {mensaje}
        </Grid> */}
        </Grid>
        {tituloDialog === "Ayuda" ? (
          <ActionAlertComponent activarAceptar={false} activarCanecelar={false} openDialog={openDialog} handleClose={() => setOpenDialog(false)} titulo={tituloDialog}>
            {contenido}
          </ActionAlertComponent>
        ) : (
          <DialogComponent openDialog={openDialog} handleClose={() => setOpenDialog(false)} titulo={tituloDialog}>
            {contenido}
          </DialogComponent>
        )}
      </Grid>
    </Box>
  );
};

MainLayout.propTypes = {};

export default MainLayout;
