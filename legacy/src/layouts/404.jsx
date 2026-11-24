// import { useEffect, useState } from "react";
import { Grid, Typography, Button, colors } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useLoaderData } from "react-router-dom";

export const NotFoundPage = () => {
  // const data = useLoaderData();

  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <>
      <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center" sx={{ minHeight: "100vh", backgroundColor: "background", padding: 1 }}>
        <Grid className="box-shadow" xs={11} sm={7} md={5} sx={{ borderColor: "primary.main", borderWidth: 10, borderStyle: "solid", padding: 3, borderRadius: 3, width: { sm: 450 } }}>
          <Grid container sx={{}}>
            <Grid size={12} sx={{ mt: 0 }}>
              <Grid container>
                <Grid size={6} sx={{ mb: 2 }}>
                  <Button sx={{ textDecoration: "none", p: 1, m: 0 }} size="small" onClick={() => navigate(-1)}>
                    <Typography sx={{ mr: 0, p: 0 }} fontSize="3em" className="c-izquierda" fontWeight="bold" align="center" variant="span" />
                    <Typography sx={{ mx: 1, display: { xs: "none", sm: "block" }, p: 0, width: "100%" }} fontWeight="bold" align="center" variant="span">
                      Regresar
                    </Typography>
                  </Button>
                </Grid>
                <Grid size="grow" sx={{ mb: 2 }} textAlign="right"></Grid>
                <Grid size="auto" sx={{ mb: 2 }} textAlign="right">
                  <Typography align="center" color="red" fontSize="3rem" sx={{ m: 0, p: 0 }} fontWeight={100} lineHeight="normal" className="c-alerta" />
                </Grid>
                <Grid size="grow" sx={{ mb: 2 }} textAlign="right"></Grid>
                <Grid size={6} sx={{ mb: 2 }} textAlign="right">
                  <Button sx={{ textDecoration: "none", p: 1, m: 0 }} size="small" component={NavLink} to="/" color="white">
                    <Typography sx={{ mx: 1, display: { xs: "none", sm: "block" }, p: 0, width: "100%" }} fontWeight="bold" align="center" variant="span">
                      Ir a Inicio
                    </Typography>
                    <Typography sx={{ mr: 0, p: 0 }} fontSize="3em" className="c-home" fontWeight="bold" align="center" variant="span" />
                  </Button>
                </Grid>
              </Grid>
              <Typography variant="h6" sx={{ m: 1, p: 0, width: "100%" }} fontWeight="bold" align="center">
                Pagina no encontrada
              </Typography>
              <Typography variant="h1" sx={{ m: 1, p: 0 }} fontWeight="bold" align="center">
                404
              </Typography>
              <Typography sx={{ m: 1, p: 0 }} align="center">
                {
                  "Parece que no podemos encontrar la página que estás buscando. Por favor revise la URL para ver si hay errores tipográficos, o comuniquece con el departamento de Informática para verificar el error."
                }
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
