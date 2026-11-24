import React from "react";
import PropTypes from "prop-types";
import { Button, Grid, IconButton, Tooltip } from "@mui/material";
import MenuItemIconComponent from "./MenuItemIconComponent";
import MenuTextComponent from "./MenuItemTextComponent";
import { menuButtonStyles, menuIconButtonStyles, menuStyles } from "./menuStyles";
import { useNavigate } from "react-router-dom";
import MenuItemTextComponent from "./MenuItemTextComponent";

const MenuItemLinkComponent = (props) => {
  const { to, menu, propNames, esHijo = false, open = false } = props;
  const { id, tooltip, icono, texto, hijos, ruta, color, iconColor, size, clickFunction, descripcion } = propNames;
  const navigate = useNavigate();

  const handleClick = (ev) => {
    ev.preventDefault();
    navigate(to);
  };

  return (
    <>
      {menu[tooltip] ? (
        <Tooltip title={menu[tooltip]}>
          {menu[texto] ? (
            <Button vaiant="text" sx={{ ...menuButtonStyles }} onClick={handleClick}>
              <Grid sx={{ ...menuStyles }}>
                <MenuItemIconComponent color={menu[iconColor]} type={"icono"} icon={menu[icono]} />
              </Grid>
              <Grid sx={{ ...menuStyles }}>
                <MenuTextComponent menu={menu} itemProperties={propNames} tipo="titulo" />
              </Grid>
              {menu[hijos] && !esHijo && (
                <>
                  <Grid size="grow" sx={{ ...menuStyles }}></Grid>
                  <MenuItemIconComponent color={menu[iconColor]} open={open} type={"expandir"} />
                </>
              )}
              <MenuItemTextComponent menu={menu} itemProperties={propNames} tipo="descripcion" />
            </Button>
          ) : (
            <IconButton vaiant="text" sx={{ ...menuIconButtonStyles }} onClick={handleClick}>
              <Grid sx={{ ...menuStyles }}>
                <MenuItemIconComponent color={menu[iconColor]} type={"icono"} icon={menu[icono]} />
              </Grid>
              {menu[hijos] && !esHijo && (
                <>
                  <Grid size="grow" sx={{ ...menuStyles }}></Grid>
                  <MenuItemIconComponent color={menu[iconColor]} open={open} type={"expandir"} />
                </>
              )}
            </IconButton>
          )}
        </Tooltip>
      ) : (
        <>
          {menu[texto] ? (
            <Button vaiant="text" sx={{ ...menuButtonStyles }} onClick={handleClick}>
              <Grid sx={{ ...menuStyles }}>
                <MenuItemIconComponent color={menu[iconColor]} type={"icono"} icon={menu[icono]} />
              </Grid>
              <Grid sx={{ ...menuStyles }}>
                <MenuTextComponent menu={menu} itemProperties={propNames} tipo="titulo" />
              </Grid>
              {menu[hijos] && !esHijo && (
                <>
                  <Grid size="grow" sx={{ ...menuStyles }}></Grid>
                  <MenuItemIconComponent color={menu[iconColor]} open={open} type={"expandir"} />
                </>
              )}
              <MenuItemTextComponent menu={menu} itemProperties={propNames} tipo="descripcion" />
            </Button>
          ) : (
            <IconButton vaiant="text" sx={{ ...menuIconButtonStyles }} onClick={handleClick}>
              <Grid sx={{ ...menuStyles }}>
                <MenuItemIconComponent color={menu[iconColor]} type={"icono"} icon={menu[icono]} />
              </Grid>
              {menu[hijos] && !esHijo && (
                <>
                  <Grid size="grow" sx={{ ...menuStyles }}></Grid>
                  <MenuItemIconComponent color={menu[iconColor]} open={open} type={"expandir"} />
                </>
              )}
            </IconButton>
          )}
        </>
      )}
    </>
  );
};

MenuItemLinkComponent.propTypes = {
  to: PropTypes.string,
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
  esHijo: PropTypes.bool,
};

export default MenuItemLinkComponent;
