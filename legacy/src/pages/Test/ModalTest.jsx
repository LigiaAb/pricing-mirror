import { Box, Grid } from "@mui/material";
import React from "react";
import FormularioResumen from "../../views/test/FormularioResumen";
import ModalDialogComponent from "../../components/Dialog/ModalDialogComponent";
import PropTypes from "prop-types";
import TablaComponent from "../../components/Tabla/TablaComponent";

const ModalTest = (props) => {
  const { abierto, handleClose } = props;

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <ModalDialogComponent
        openDialog={abierto}
        handleClose={handleClose}
        tabla={
          <Box sx={{ m: 0, p: 0, px: 2 }}>
            <TablaComponent encabezado={[]} datos={[]} />
          </Box>
        }
        formulario={<FormularioResumen />}
      />
    </Box>
  );
};

ModalTest.propTypes = {
  // CONTROL DE ABIERTO
  abierto: PropTypes.array,
  handleClose: PropTypes.func,
};

export default ModalTest;
