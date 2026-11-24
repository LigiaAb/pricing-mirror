import React from "react";
import PropTypes from "prop-types";
import { AppBar, Toolbar, Typography, Box, IconButton, Icon, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setDarkTheme, setLightTheme } from "../store/slices/theme/themeSlice";

const background = "linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(0, 63, 142, 1) 50%, rgba(0, 86, 177, 1) 100%)";

export const NavBarPublico = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.themeMode);

  const handleToggleTheme = () => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event("themeChange"));
    dispatch(nextTheme === "dark" ? setDarkTheme() : setLightTheme());
  };

  return (
    <AppBar position="sticky" enableColorOnDark sx={{ top: 0, boxShadow: "none", background }}>
      <Toolbar
        variant="dense"
        sx={{
          height: "100%",
          minHeight: "auto !important",
          display: "flex",
          alignItems: "center",
          p: 0,
        }}
      >
        {/* Logo */}
        <Typography
          onClick={() => {
            document.title = `ERP CROPA | DSV`;
            navigate("/public");
          }}
          variant="span"
          color="white"
          className="c-cropa-dsv"
          sx={{ m: 0, p: 0, ml: 2, "&:before": { fontSize: 50 } }}
        ></Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title={themeMode === "dark" ? "Cambiar a tema Claro" : "Cambiar a tema Oscuro"}>
          <IconButton onClick={handleToggleTheme} color="white" sx={{ mr: 2 }}>
            <Icon className={themeMode === "dark" ? "c-sol" : "c-luna"} />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

NavBarPublico.propTypes = {};

export default NavBarPublico;

