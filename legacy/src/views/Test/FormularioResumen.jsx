import { Box } from "@mui/material";
import React from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

const FormularioResumen = () => {
  return (
    <Box sx={{ px: 1, m: 0 }}>
      <FormularioComponent
        inputs={[
          { id: "empresa1", label: "empresa1", tipo: "text", val: "empresa" },
          { id: "empresa2", label: "empresa2", tipo: "text", val: "" },
          { id: "empresa3", label: "empresa3", tipo: "date", val: null },
        ]}
        unaColumna
      />
    </Box>
  );
};

export default FormularioResumen;
