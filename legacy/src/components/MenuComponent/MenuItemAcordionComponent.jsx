import React from "react";
import PropTypes from "prop-types";
import { Accordion, AccordionDetails, AccordionSummary, Grid } from "@mui/material";
import MenuItemIconComponent from "./MenuItemIconComponent";
import { menuAcordionDetailsStyles, menuAcordionStyles, menuAcordionSumaryStyles, menuExsionStyles, menuStyles } from "./menuStyles";
import MenuItemButtonComponent from "./MenuItemButtonComponent";
import MenuComponent from "./MenuComponent";
import MenuTextComponent from "./MenuItemTextComponent";
import { lightScroll as SCROLL_STILE } from "../../style/scrollStyle";

const MenuItemAcordionComponent = (props) => {
  const { handleClick, menu, propNames, open, esHijo = false, backgroundColor, borderColor, borderWidth } = props;
  const { id, tooltip, icono, texto, hijos, ruta, color, iconColor, size, clickFunction, descripcion, bg, border } = propNames;

  return (
    <Accordion expanded={open} sx={{ ...menuAcordionStyles, ...SCROLL_STILE }}>
      <AccordionSummary expandIcon={<MenuItemIconComponent color={menu[iconColor]} open={open} type={"expandir"} onClick={handleClick} />} sx={{ ...menuAcordionSumaryStyles }}>
        <Grid container direction="column" sx={{ ...props, ...menuStyles }}>
          <Grid container direction="column" sx={{ ...props, ...menuStyles }}>
            <MenuItemButtonComponent esHijo={esHijo} onClick={handleClick} menu={menu} propNames={propNames} open={open} />
          </Grid>
          <MenuTextComponent menu={menu} itemProperties={propNames} tipo="descripcion" />
        </Grid>
      </AccordionSummary>
      <AccordionDetails sx={{ ...menuAcordionDetailsStyles, ...SCROLL_STILE }}>
        <Grid container sx={{ ...menuExsionStyles, ...SCROLL_STILE }}>
          <MenuComponent backgroundColor={backgroundColor} borderColor={borderColor} propNames={propNames} borderWidth={borderWidth} menus={menu[hijos]} direction="column" esHijo={true} />
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

MenuItemAcordionComponent.propTypes = {
  handleClick: PropTypes.func,
  menu: PropTypes.object,
  open: PropTypes.bool,
  esHijo: PropTypes.bool,

  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,

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

export default MenuItemAcordionComponent;
