import React from "react";
import PropTypes from "prop-types";
import { useLocation, useParams, Outlet, useLoaderData, useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";

// ESTLOS
const SCROLL_STILE = import("../../style/scrollStyle");
const RESIZE_STYLE = import("./../../style/resizeStyle.js");

const CrudPage = (props) => {
  const location = useLocation();
  const data = useLoaderData();
  let params = useParams();
  const actual = location;
  const navigate = useNavigate();
  return (
    <Box sx={{ maxWidth: "100%", maxHeight: "100%", p: 0, m: 0 }} id="CrudPage">
      <Outlet />
    </Box>
  );
};

export default CrudPage;
