import React from "react";
import PropTypes from "prop-types";
import { Button, Icon, Typography } from "@mui/material";
import { botonStyles, botonIconStyles, botonTextStyles } from "./";

const BotonComponente = (props) => {
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
    <Button vaiant="text" sx={{ ...botonStyles() }}>
      <Icon className="c-home" sx={{ ...botonIconStyles() }} />
      <Typography sx={{ ...botonTextStyles() }}>
        {menus[0][propiedadId]} - {menus[0][propiedadTexto]}
      </Typography>
      <Icon className="c-simple-abajo" sx={{ ...botonIconStyles() }} />
    </Button>
  );
};

BotonComponente.propTypes = {
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

export default BotonComponente;
