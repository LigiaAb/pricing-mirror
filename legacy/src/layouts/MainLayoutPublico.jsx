import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import NavBarPublico from "../components/NavBarPublico";
import SideBarPublico from "../components/SideBarPublico";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";

const MainLayoutPublico = (props) => {
  const screenSize = useSelector((state) => state.screen);

  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ flexGrow: 1, p: 0, m: 0, flex: 1, minWidth: 0, alignItems: "stretch", flexDirection: "column", display: "flex", bgcolor: "background.main" }} id="MainLayoutPublico">
      <NavBarPublico />
      {(screenSize?.name == "xs" || screenSize?.name == "sm") && (
        <SideBarPublico onClose={setOpen} open={open} />
      )}
      <Box zIndex={0} position="absolute" top="60%" left="60%" sx={{ transform: "translate(-50%, -50%)" }}>
        <Typography fontSize="20vw" className="c-cropa-dsv" color="primary.100_30" />
      </Box>
      <Box
        sx={{
          p: 0,
          m: 0,
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
          minWidth: 0,
        }}
        zIndex={1}
        id="bodyContent"
      >
        <Outlet />
      </Box>
    </Box>
  );
};

MainLayoutPublico.propTypes = {};

export default MainLayoutPublico;

