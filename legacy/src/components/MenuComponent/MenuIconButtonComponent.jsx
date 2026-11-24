import React from "react";
import PropTypes from "prop-types";
import { Badge, Button, Grid } from "@mui/material";
import MenuItemIconComponent from "./MenuItemIconComponent";
import MenuTextComponent from "./MenuIconTextComponent";
import { menuButtonStyles, menuStyles } from "./menuStyles";

const MenuIconButtonComponent = (props) => {
  const { onClick, menu, propNames } = props;
  const { id, tooltip, icono, texto, hijos, ruta, color, iconColor, size, clickFunction, descripcion, bg, border, alerta } = propNames;

  return (
    <Button vaiant="text" sx={{ ...menuButtonStyles, maxWidth: 400, width: 400 }} onClick={onClick} disabled={menu.disabled} size={menu.size}>
      <Grid sx={{ ...menuStyles }}>
        <MenuItemIconComponent color={menu[iconColor]} type={"icono"} icon={menu[icono]} />
      </Grid>
      <Grid sx={{ ...menuStyles }}>
        <MenuTextComponent menu={menu} itemProperties={propNames} tipo="titulo" />
      </Grid>
      {menu[hijos] && (
        <>
          <Grid size="grow" sx={{ ...menuStyles }}></Grid>
          <MenuItemIconComponent color={menu[iconColor]} open={open} type={"expandir"} />
        </>
      )}
    </Button>
  );
};

MenuIconButtonComponent.propTypes = {
  onClick: PropTypes.func,
  menu: PropTypes.object,

  propNames: PropTypes.shape({
    id: PropTypes.string,
    tooltip: PropTypes.string,
    icono: PropTypes.string,
    texto: PropTypes.string,
    hijos: PropTypes.string,
    ruta: PropTypes.string,
    color: PropTypes.string,
    iconColor: PropTypes.string,
    size: PropTypes.string,
    clickFunction: PropTypes.string,
    descripcion: PropTypes.string,
    bg: PropTypes.string,
    border: PropTypes.string,
    alerta: PropTypes.string,
  }),

  open: PropTypes.bool,
};

export default MenuIconButtonComponent;
