import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Alert, Typography } from "@mui/material";
// import { colors } from "../../theme/colors";
import { useSelector } from "react-redux";

const BandaAlertaComponent = (props) => {
  const { children, content, tipo = "success", icono = undefined } = props;
  const { colors } = useSelector((state) => state.theme);
  const tipoUpper = useMemo(
    () =>
      `${tipo}`
        .split("")
        .map((i, ind) => (ind === 0 ? i.toUpperCase() : i))
        .join(""),
    [tipo]
  );

  return (
    <Alert
      sx={{
        width: "100%",
        m: 0,
        my: 0.5,
        p: 0,
        "& *": { my: "auto" },
        "& .MuiAlert-icon": { mx: 1 },
        "& .MuiAlert-message": { mx: 0, width: "100%" },
        borderColor: colors[tipo || "primary"]?.main,
        borderStyle: "solid",
        borderWidth: 1,
      }}
      severity={tipo}
      icon={icono}
    >
      {content || children}
    </Alert>
  );
};

BandaAlertaComponent.propTypes = {
  children: PropTypes.node,
  content: PropTypes.node,
  icono: PropTypes.node,
  tipo: PropTypes.oneOf(["warning", "info", "error", "success"]),
};

export default BandaAlertaComponent;
