import React from 'react';
import { Box,  Stack } from "@mui/material";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const FormularioResumenEstados = () => {
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Stack direction="column" alignItems="center" useFlexGap justifyContent="center" spacing={2} flexWrap="wrap">
        <FormularioComponent
          inputs={[
            { id: "estado", label: "Estado", tipo: "text", val: "" },
          ]}
          unaColumna
        />
      </Stack>
    </Box>
  )
}
