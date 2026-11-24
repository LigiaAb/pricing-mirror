import React from "react";
import { Box, Grid, Icon, IconButton, Stack } from "@mui/material";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const FormularioResumenPaises = () => {
  return (
    <Grid sx={{ p: 1, m: 0 }}>
      <Stack direction="column" alignItems="center" useFlexGap justifyContent="center" spacing={2} flexWrap="wrap">
        <FormularioComponent
          inputs={[
            { id: "pais", label: "Pais", tipo: "text", val: "" },
            { id: "referencia", label: "Referencia", tipo: "text", val: "" },
          ]}
          unaColumna
        />
      </Stack>
    </Grid>
  );
};
