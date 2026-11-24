import React from "react";
import PropTypes from "prop-types";
import { Button, Icon, Typography } from "@mui/material";
import { menuButtonStyles, menuIconStyles, menuTextStyles } from "./";

const MenuComponent = (props) => {
  const {
    propiedadId = "id",
    propiedadTooltip = "tooltip",
    propiedadIcono = "icon",
    propiedadTexto = "title",
    propiedadHijos = "children",
    propiedadRuta = "url",
    propiedadColor = "color",
    propiedadSize = "size",
    menus = [{}],
  } = props;
  return (
    <div>
      <Button vaiant="text" sx={{ ...menuButtonStyles() }}>
        <Icon className="c-home" sx={{ ...menuIconStyles() }} />
        <Typography sx={{ ...menuTextStyles() }}>
          {menus[0][propiedadId]} - {menus[0][propiedadTexto]}
        </Typography>
        <Icon className="c-simple-abajo" sx={{ ...menuIconStyles() }} />
      </Button>
      <br />
      {`${propiedadId}`} <br />
      {`${propiedadTooltip}`} <br />
      {`${propiedadIcono}`} <br />
      {`${propiedadTexto}`} <br />
      {`${propiedadHijos}`} <br />
      {`${propiedadRuta}`} <br />
      {`${propiedadColor}`} <br />
      {`${propiedadSize}`} <br />
      <pre>{JSON.stringify(menus, null, 2)}</pre> <br />
    </div>
  );
};

MenuComponent.propTypes = {
  propiedadId: PropTypes.string,
  propiedadTooltip: PropTypes.string,
  propiedadIcono: PropTypes.string,
  propiedadTexto: PropTypes.string,
  propiedadHijos: PropTypes.string,
  propiedadRuta: PropTypes.string,
  propiedadColor: PropTypes.string,
  propiedadSize: PropTypes.string,
  menus: PropTypes.array,
};

export default MenuComponent;
