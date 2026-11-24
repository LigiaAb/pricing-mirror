import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Badge, Grid, Menu } from "@mui/material";
import MenuItemTextComponent from "./MenuItemTextComponent";
import MenuItemButtonComponent from "./MenuItemButtonComponent";
import { menuExsionStyles, menuPaperPropsStyles, menuStyles } from "./menuStyles";
import MenuComponent from "./MenuComponent";
import MenuItemAcordionComponent from "./MenuItemAcordionComponent";
import { scrollType as SCROLL_STILE } from "../../style/scrollStyle";
import MenuItemLinkComponent from "./MenuItemLinkComponent";

const MenuItemComponent = (props) => {
  const { propiedades, itemProperties, menu, esHijo } = props;

  const { backgroundColor, borderColor, borderWidth, propNames } = itemProperties;
  const { id, tooltip, icono, texto, hijos, ruta, render, color, iconColor, size, clickFunction, descripcion, bg, border, alerta } = propNames;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open_1 = Boolean(anchorEl);
  const handleClick_1 = (ev) => {
    ev.preventDefault();
    setAnchorEl(ev.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [open, setOpen] = useState(false);

  const handleClick = (ev) => {
    ev?.preventDefault && ev?.preventDefault();
    setOpen((val) => !val);
  };

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.code === "Escape") handleClose();
    }

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, []);

  return (
    <Grid size="auto" sx={{ borderRadius: 1 }}>
      {menu[hijos] ? (
        !esHijo ? (
          <>
            <Grid container direction="row" sx={{ ...props, ...menuStyles, bgcolor: menu[bg], borderColor: menu[border] }}>
              <MenuItemButtonComponent onClick={!esHijo ? handleClick_1 : handleClick} menu={menu} propNames={propNames} open={!esHijo ? open_1 : open} />
            </Grid>

            <Menu sx={{ ...menuPaperPropsStyles }} anchorEl={anchorEl} id="account-menu" open={open_1} onClose={handleClose}>
              <Grid container sx={{ ...menuExsionStyles, borderRadius: 1 }}>
                <MenuComponent backgroundColor={backgroundColor} borderColor={borderColor} propiedades={propNames} borderWidth={borderWidth} menus={menu[hijos]} direction="column" esHijo={true} />
              </Grid>
            </Menu>
          </>
        ) : (
          <MenuItemAcordionComponent
            esHijo={true}
            handleClick={handleClick}
            menu={menu}
            propNames={itemProperties.propNames}
            open={open}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            borderWidth={borderWidth}
          />
        )
      ) : (
        <Grid
          container
          direction="column"
          sx={{
            ...propiedades,
            ...menuStyles,
            bgcolor: menu[bg],
            borderColor: menu[border],
            borderWidth: menu[border] ? 0.5 : 0,
            borderStyle: menu[border] ? "solid" : "",
            borderRadius: 1,
          }}
        >
          {menu[render] ? (
            <pre>{JSON.stringify(render)}</pre>
          ) : menu[ruta] ? (
            <MenuItemLinkComponent esHijo={esHijo} menu={menu} propNames={itemProperties.propNames} open={open} to={menu[ruta]} />
          ) : (
            <MenuItemButtonComponent esHijo={esHijo} menu={menu} propNames={itemProperties.propNames} open={open} onClick={menu[clickFunction]} />
          )}
        </Grid>
      )}
    </Grid>
  );
};

MenuItemComponent.propTypes = {
  propiedades: PropTypes.object,
  itemProperties: PropTypes.object,
  menu: PropTypes.object,
  esHijo: PropTypes.bool,
};

export default MenuItemComponent;
