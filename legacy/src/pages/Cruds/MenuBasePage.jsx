import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { Box, Grid, Typography } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { setCurrentCategoria } from "../../store/slices/menu/menuSlice";
import TabComponent from "../../components/Tabs/TabComponent.jsx";
import { useObtenerCategoriasActivas, useObtenerPermisosDeMenuActual } from "../../hooks/useObtenerOpcionesAcciones.jsx";
import lightScroll from "../../style/scrollStyle.js";
import { setShowLaterlText } from "../../store/slices/theme/themeSlice.js";
import DeesktopMenuBasePage from "./DesktopMenuBasePage.jsx";
import MovilMenuBasePage from "./MovilMenuBasePage.jsx";

const MenuBasePage = (props) => {
  const screen = useSelector((state) => state.screen);
  const { name, movil } = screen;

  const MenuBasePage = useMemo(() => (!["sm", "xs"].includes(name) && !movil ? <DeesktopMenuBasePage /> : <MovilMenuBasePage />), [name, movil]);

  return MenuBasePage;
};

MenuBasePage.propTypes = {};

export default MenuBasePage;
