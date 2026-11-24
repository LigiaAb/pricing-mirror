import React, { useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, CircularProgress, Grid, Icon, SvgIcon, Typography } from "@mui/material";
import CROPA_DSV_ICON from "../assets/CROPA_DSV_ICON.svg";
import FONDO from "../assets/Cropa DSV-5.svg";
import { checkingCurrentToken } from "../store/slices/auth/thunks";

// GIF
import LOADER from "../assets/loader_1.gif";

export const CheckingLayout = () => {
  const navigate = useNavigate();
  const screenSize = useSelector((state) => state.screen);
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  // useEffect(() => {
  //   dispatch(checkingCurrentToken());
  // }, []);

  return (
    <Box sx={{ flex: 1 }}>
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
            borderColor: `primary.${opositeMode}`,
          }}
        >
          <Grid
            width="100%"
            sx={{
              color: "primary.main",
              padding: 3,
              borderRadius: 5,
              transition: "flex .5s ease-in-out, margin .5s ease-in-out, width .5s ease-in-out, border-radius .5s ease-in-out;",
            }}
            borderLeft
            backgroundColor={`paper.main`}
          >
            <Grid container direction="column" justifyContent="center">
              <Box
                component="img"
                sx={{
                  maxWidth: { xs: "90%" },
                  mx: "auto",
                }}
                alt="The house from the offer."
                src={LOADER}
              />
            </Grid>
            <Grid container direction="column" justifyContent="center">
              <Box display="flex" justifyContent="center" alignItems="center">
                <Typography variant="h6" textAlign="center" fontWeight="bolder">
                  ESTAMOS VERFICANDO LA INFORMACIÓN
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};
