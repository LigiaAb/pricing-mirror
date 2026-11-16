import React from "react";
import PropTypes from "prop-types";
import TextComponent from "../../../../components/Formulario/TextComponent";
import { Box } from "@mui/material";

const FiltroCriterioTextoSimple = (props) => {
  const { nombre, valor, id, sx = {}, setValor, visible, readonly = false } = props;
  return (
    <Box bgcolor={!readonly ? "background.200_30" : "transparent"} sx={{ pt: "4px", pr: "8px" }}>
      <TextComponent id={`number_${id}_c`} key={`number_${id}_c`} input={{ step: 0.01, tipo: "text", id, label: nombre, val: valor, visible, readonly }} sx={sx} onInput={setValor} />
    </Box>
  );
};

FiltroCriterioTextoSimple.propTypes = {
  nombre: PropTypes.string,
  valor: PropTypes.number,
  id: PropTypes.string,

  sx: PropTypes.object,

  readonly: PropTypes.bool,
  visible: PropTypes.bool,

  setValor: PropTypes.func,
};

export default FiltroCriterioTextoSimple;
