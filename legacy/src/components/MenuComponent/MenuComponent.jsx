import React from "react";
import PropTypes from "prop-types";
import { Grid, Tooltip } from "@mui/material";
import { lightScroll as SCROLL_STILE } from "../../style/scrollStyle";
import MenuItemComponent from "./MenuItemComponent";
import { menuStyles, menuItemStyles, menuItemBackgroundStyles, menuItemBorderStyles } from "./menuStyles";

const propiedadesDefault = {
  id: "id_mmenu",
  tooltip: "tooltip",
  icono: "icon",
  texto: "titulo",
  hijos: "children",
  ruta: "url",
  color: "color",
  iconColor: "iconColor",
  size: "size",
  clickFunction: "onClick",
  descripcion: "descripcion",
  bg: "bgcolor",
  border: "border",
  alerta: "alerta",
  render: "renderizar",
};

const MenuComponent = (props) => {
  const { menus, propiedades, esHijo = false, direction = "row", backgroundColor = "white.main", borderColor = "primary.main", borderWidth = 0 } = props;

  const itemProperties = { propNames: { ...propiedadesDefault, ...propiedades }, backgroundColor, borderColor, borderWidth };

  const { id, tooltip, icono, texto, hijos, ruta, color, render, iconColor, size, clickFunction, descripcion, bg, border } = itemProperties.propNames;

  return (
    <>
      {menus.length > 0 ? (
        <Grid
          columnSpacing={1}
          container
          direction={direction}
          sx={{
            ...(esHijo ? { overflow: "hidden" } : { ...SCROLL_STILE, overflow: "auto" }),
            ...menuStyles,
            ...menuItemBorderStyles(undefined, 0),
            ...menuItemBackgroundStyles(backgroundColor),
            alignContent: "baseline",
            maxWidth: "calc(100vw - 100px) !important",
            borderRadius: 1,
          }}
          id="menu"
        >
          {menus
            .map((item) => ({
              ...item,
              [clickFunction]: item[hijos] ? undefined : item[clickFunction],
              [ruta]: item[hijos] ? undefined : item[ruta],
            }))
            .map((menu) => menus.length > 0 && <MenuItemComponent key={menu[id]} esHijo={esHijo} itemProperties={itemProperties} menu={menu} />)}
        </Grid>
      ) : (
        <></>
      )}
    </>
  );
};

MenuComponent.propTypes = {
  menus: PropTypes.array,
  propiedades: PropTypes.object,

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

  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,

  direction: PropTypes.oneOf(["row", "column", "row-reverse", "column-reverse"]),

  esHijo: PropTypes.bool,
};

export default MenuComponent;
