import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Backdrop, Box, CircularProgress, Grid, Typography } from "@mui/material";
import { withStyles } from "@mui/styles";
import { useSelector } from "react-redux";

// GIF
import LOADER from "../../assets/loader_1.gif";
const LoadingDots = ({ texto }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500); // cambia la velocidad si quieres
    return () => clearInterval(interval);
  }, []);

  return (
    <Typography variant="span" sx={{ fontWeight: "bold" }}>
      {dots}
    </Typography>
  );
};
const LoaderComponent = (props) => {
  const { open = true, texto = "ESTAMOS CARGANDO LA INFORMACIÓN", sx = {}, texto2 } = props;
  const { opositeMode } = useSelector((state) => state.theme);
  const display = useMemo(() => (open ? undefined : "none"), [open]);

  return (
    <Box sx={{ zIndex: 2100, backgroundColor: "background.main_40", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", color: "#fff", ...sx, display }}>
      <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center" sx={{ minHeight: "100%", padding: { xs: 4, md: 1 } }}>
        <Grid
          container
          spacing={0}
          direction="row"
          alignItems="stretch"
          justifyContent="center"
          sx={{
            width: { sm: "80%", md: 450 * 2, xl: "80%" },
            backgroundColor: "background.main_80",
            borderStyle: "solid",
            borderWidth: 0,
            // borderRadius: 5,
            borderColor: `primary.${opositeMode}`,
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <Grid
            width="100%"
            sx={{
              padding: 3,
              borderRadius: 5,
              transition: "flex .5s ease-in-out, margin .5s ease-in-out, width .5s ease-in-out, border-radius .5s ease-in-out;",
              color: "text.main",
            }}
            borderLeft
            backgroundColor={`paper.main`}
          >
            <Grid container direction="column" justifyContent="center">
              <Box component="img" sx={{ maxWidth: { xs: "90%" }, mx: "auto" }} alt="The house from the offer." src={LOADER} />
            </Grid>
            <Grid container direction="column" justifyContent="center">
              <Box display="flex" justifyContent="center" alignItems="center">
                <Typography fontSize={20} textAlign="center" sx={{ fontWeight: 100 }}>
                  {texto}
                  {open && <LoadingDots />}
                </Typography>
              </Box>
              <Box display={!!texto2 ? "flex" : "none"} justifyContent="center" alignItems="center">
                <Typography fontSize={20} textAlign="center" sx={{ fontWeight: 100 }}>
                  {texto2}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};
LoadingDots.propTypes = { texto: PropTypes.oneOfType([PropTypes.string, PropTypes.any]) };
LoaderComponent.propTypes = {
  open: PropTypes.bool,

  sx: PropTypes.object,

  texto: PropTypes.string,
};

export default LoaderComponent;
