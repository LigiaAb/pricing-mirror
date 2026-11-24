import React, { useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, CircularProgress, Grid, Icon, SvgIcon, Typography } from "@mui/material";
import CROPA_DSV_ICON from "../assets/CROPA_DSV_ICON.svg";
import FONDO from "../assets/Cropa DSV-5.svg";

export const CerrandoSesion = () => {
  const navigate = useNavigate();
  const screenSize = useSelector((state) => state.screen);
  const dispatch = useDispatch();

  const name = useMemo(() => screenSize.name, [screenSize]);

  return (
    <Box sx={{ maxWidth: "100vw", minHeight: "100vh" }}>
      <Grid
        container
        spacing={0}
        direction="row"
        alignItems="center"
        justifyContent="center"
        sx={{
          // backgroundImage: `url(${FONDO})`,
          // backgroundRepeat: "no-repeat",
          // backgroundSize: "cover",
          minHeight: "100vh",
          padding: { xs: 4, md: 1 },
        }}
      >
        <Grid
          container
          spacing={0}
          direction="row"
          alignItems="stretch"
          justifyContent="center"
          sx={{
            width: { sm: "80%", md: 450 * 2, xl: "80vw" },
            borderStyle: "solid",
            borderWidth: 2,
            borderRadius: 5,
          }}
        >
          <Grid
            width="100%"
            sx={{
              color: "error.main",
              padding: 3,
              borderRadius: 5,
              transition: "flex .5s ease-in-out, margin .5s ease-in-out, width .5s ease-in-out, border-radius .5s ease-in-out;",
            }}
            borderLeft
            backgroundColor={`white.main`}
          >
            <Grid container direction="column" justifyContent="center">
              <Box display="flex" justifyContent="center" alignItems="center">
                <CircularProgress sx={{ mx: "auto" }} size={80} />
              </Box>
            </Grid>
            <Grid container direction="column" justifyContent="center">
              <Box display="flex" justifyContent="center" alignItems="center">
                <Typography variant="h6" textAlign="center" fontWeight="bolder">
                  El token a expirado, cerrando la sesión.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};
