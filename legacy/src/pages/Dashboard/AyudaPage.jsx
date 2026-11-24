import { Grid, Typography } from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";

const AyudaPage = () => {
  const { currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);

  return (
    <Grid container direction="column">
      {"<"} Ayudas en Desarrollo {">"}
      <br />
      <Grid container direction="row" width="100%" columns={12}>
        <Grid size={4}>
          <Typography>Modulo:</Typography>
        </Grid>
        <Grid size="grow">
          <Typography>{currentModulo?.nom_modulo}</Typography>
        </Grid>
        <Grid size={12}></Grid>
        <Grid size={4}>
          <Typography>Menu:</Typography>
        </Grid>
        <Grid size="grow">
          <Typography>{currentMenu?.nom_menu}</Typography>
        </Grid>
        <Grid size={12}></Grid>
        <Grid size={4}>
          <Typography>Categoria:</Typography>
        </Grid>
        <Grid size="grow">
          <Typography>{currentCategoria?.nom_cat}</Typography>
        </Grid>
      </Grid>
      {/* <pre>
        {JSON.stringify({ modulo: currentModulo?.modulo_nombre, menu: currentMenu?.menu_nombre, categoria: currentCategoria?.nom_cat }, null, 2)}
      </pre> */}
    </Grid>
  );
};

export default AyudaPage;
