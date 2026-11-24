import React from "react";
import PropTypes from "prop-types";
import SelectComponent from "../../../../components/Formulario/SelectComponent";
import { Box } from "@mui/material";

const FiltroCriterioUbicacion = (props) => {
  const { nombre, valor, id, paises = [], sx = {}, setValor, visible, readonly = false, label, value } = props;
  return (
    <Box bgcolor={!readonly ? "background.200_30" : "transparent"} sx={{ pt: "4px", pr: "8px" }}>
      <SelectComponent
        id={`number_${id}_c`}
        key={`number_${id}_c`}
        input={{
          tipo: "number",
          id,
          label: nombre,
          val: valor,
          options: paises,
          labelOption: label || "label",
          valueOption: value || "value",
          readonly,
          visible,
        }}
        sx={sx}
        onInput={setValor}
      />
    </Box>
  );
};

FiltroCriterioUbicacion.propTypes = {
  nombre: PropTypes.string,
  valor: PropTypes.number,
  id: PropTypes.string,

  paises: PropTypes.array,

  sx: PropTypes.object,

  readonly: PropTypes.bool,
  visible: PropTypes.bool,

  setValor: PropTypes.func,

  label: PropTypes.string,
  value: PropTypes.string,
};

export default FiltroCriterioUbicacion;
