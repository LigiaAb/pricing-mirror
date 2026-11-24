import React from "react";
import PropTypes from "prop-types";
import { Tooltip } from "@mui/material";

const TooltipComponent = (props) => {
  const {
    fontSize = 16,
    color = "black.main",
    bgcolor = "white.main",
    borderColor = "primary.main",
    borderWidth = 2,
    borderStyle = "solid",
    borderRadius = 2,
    configuracion = {},
    titulo,
    placement,
    content,
    children,
    disableHoverListener, // <-- IMPORTANTE
  } = props;

  return (
    <Tooltip
      arrow
      disableHoverListener={disableHoverListener} // <-- NECESARIO
      slotProps={{
        tooltip: { sx: { fontSize, color, bgcolor, borderColor, borderWidth, borderStyle, borderRadius } },
        arrow: { sx: { "&::before": { bgcolor, borderColor, borderWidth, borderStyle } } },
      }}
      title={titulo}
      placement={placement}
      {...configuracion}
    >
      {content || children}
    </Tooltip>
  );
};

TooltipComponent.propTypes = {
  fontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  bgcolor: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  borderColor: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  borderStyle: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  borderWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  placement: PropTypes.string,
  configuracion: PropTypes.object,
  titulo: PropTypes.any,
  content: PropTypes.any,
  children: PropTypes.any,
  disableHoverListener: PropTypes.bool, // <-- NUEVO
};

export default TooltipComponent;
