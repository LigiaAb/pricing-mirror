import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import useWindowSize from "../hooks/useWindowsSize.jsx";
import { Outlet, useNavigate } from "react-router-dom";

// ESTLOS
const SCROLL_STILE = import("../style/scrollStyle");
const RESIZE_STYLE = import("./../style/resizeStyle.js");

export const IndexLayout = (props) => {
  let dispatch = useDispatch();
  const { version } = useSelector((state) => state.auth);
  const [firstLoad, setFirstLoad] = useState(false);
  const navigate = useNavigate();

  useWindowSize();

  return (
    <Box className="scroll" sx={{ ...RESIZE_STYLE, ...SCROLL_STILE, display: "flex", alignItems: "stretch", overflow: "hidden" }} id="IndexLayout">
      {/* BOX PARA SCROLL HACIA A TOP DE PANTALLA */}
      <Box sx={{ display: "block", visibility: "hidden" }} id="inicio"></Box>
      {/* PAGINA */}
      <Outlet />
      {/* PIE DE PAGINA */}
      <Box sx={{ position: "absolute", right: 15, bottom: 10, width: "auto", color: "grey.400_80", cursor: "unset", pointerEvents: "none", zIndex: 10 }}>
        <Typography variant="caption">© 2024 CROPA | DSV. All rights reserved. v{version}</Typography>
      </Box>
    </Box>
  );
};

IndexLayout.propTypes = {};

export default IndexLayout;
