import React from "react";
import PropTypes from "prop-types";
import { Box, Icon } from "@mui/material";
import { useSelector } from "react-redux";

const InputLabelComponent = (props) => {
  const { input, error } = props;
  const { themeMode } = useSelector((state) => state.theme);
  return (
    <Box
      sx={{
        m: 0,
        p: 0,
        display: "flex",
        alignItems: "center",
        color: error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : "text.main",
      }}
    >
      {`${input.requerido ? "* " : ""}${input.label || input.id || ""}`}
      {input.icono && <Icon className={input.icono} sx={{ fontSize: 15, ml: 0.5 }} />}
    </Box>
  );
};

InputLabelComponent.propTypes = {
  input: PropTypes.object.isRequired,
  error: PropTypes.bool,
};

export default InputLabelComponent;
