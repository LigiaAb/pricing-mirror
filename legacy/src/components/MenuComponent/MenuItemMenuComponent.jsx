import React from "react";
import PropTypes from "prop-types";
import { Grid, Menu } from "@mui/material";
import MenuComponent from "./MenuComponent";
import { menuExsionStyles, menuPaperPropsStyles } from "./menuStyles";

const MenuItemMenuComponent = (props) => {
  const { propNames, anchorEl, open, handleClose, menus, backgroundColor, borderColor, borderWidth, direction, propiedades, esHijo } = props;

  return (
    <Menu sx={{ ...menuPaperPropsStyles }} anchorEl={anchorEl} id="account-menu" open={open} onClose={handleClose}>
      <Grid container sx={{ ...menuExsionStyles }}>
        <MenuComponent backgroundColor={backgroundColor} borderColor={borderColor} propNames={propNames} borderWidth={borderWidth} menus={menus} direction="column" esHijo={true} />
      </Grid>
    </Menu>
  );
};

MenuItemMenuComponent.propTypes = {
  anchorEl: PropTypes.any,
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,
  direction: PropTypes.oneOf(["row", "column", "row-reverse", "column-reverse"]),
  propiedades: PropTypes.any,
  esHijo: PropTypes.bool,
  menus: PropTypes.array,
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
};

export default MenuItemMenuComponent;
