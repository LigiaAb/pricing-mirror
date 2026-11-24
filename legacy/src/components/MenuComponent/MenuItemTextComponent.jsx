import React from "react";
import PropTypes from "prop-types";
import { Typography } from "@mui/material";
import { menuDescripcionStyles, menuTextStyles } from "./menuStyles";

const MenuItemTextComponent = (props) => {
  const { itemProperties, menu, tipo } = props;
  const { texto, descripcion, color } = itemProperties;

  return (
    <Typography textAlign="left" color={menu[color]} variant={tipo === "titulo" ? undefined : "caption"} fontSize={"small"} sx={{ ...(tipo === "titulo" ? menuTextStyles : menuDescripcionStyles) }}>
      {menu[tipo == "titulo" ? texto : descripcion]}
    </Typography>
  );
};

MenuItemTextComponent.propTypes = {
  tipo: PropTypes.oneOf(["titulo", "descripcion"]),
  itemProperties: PropTypes.object,
  menu: PropTypes.object,
};

export default MenuItemTextComponent;
