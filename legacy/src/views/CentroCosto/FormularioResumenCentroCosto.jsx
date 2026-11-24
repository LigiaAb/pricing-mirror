import React from "react";
import { Box, Grid, Stack } from "@mui/material";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const FormularioResumenCentroCosto = () => {
  return (
    <Grid sx={{ p: 1, m: 0 }}>
      <Stack direction="column" alignItems="center" useFlexGap justifyContent="center" spacing={2} flexWrap="wrap">
        <FormularioComponent inputs={[{ id: "cc", label: "Centro de costo", tipo: "text", val: "" }]} unaColumna />
      </Stack>
    </Grid>
  );
};
