import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography } from "@mui/material";
import lightScroll from "../../style/scrollStyle";

const BotonLateralComponent = (props) => {
  const { onClick, left } = props;
  // const [parpadear, setParpadear] = useState(false);

  // useEffect(() => {
  //   const delayInicio = 1000,
  //     // tiempoClosed = 200,
  //     tiempoClosed = 5000,
  //     tiempoOpen = 5000;
  //   let mounted = true;

  //   const ciclo = async () => {
  //     await new Promise((r) => setTimeout(r, delayInicio)); // espera inicial

  //     while (mounted) {
  //       setParpadear(true);
  //       await new Promise((r) => setTimeout(r, tiempoClosed));

  //       setParpadear(false);
  //       await new Promise((r) => setTimeout(r, tiempoOpen));
  //     }
  //   };

  //   ciclo();

  //   return () => {
  //     mounted = false;
  //   };
  // }, []);

  return (
    <Grid
      onClick={onClick}
      p={0}
      sx={{ ...lightScroll, alignItems: "center", justifyContent: "center", direction: "rtl", bgcolor: "#0B2967", cursor: "pointer", "&:hover": { bgcolor: "primary.main" } }}
      maxHeight="100%"
      px={0.3}
      size="auto"
      container
      rowGap="1vw"
      direction="column"
    >
      {/* <Box id="box-dashboard" sx={{ alignItems: "center", justifyContent: "center", height: "30vh", px: "0.1vw", borderRadius: 10, bgcolor: "white.main_50" }} /> */}
      {/* <Box id="box-dashboard" sx={{ alignItems: "center", justifyContent: "center", height: "2vh", px: !parpadear ? "0.1vw" : "0.3vw", borderRadius: 10, bgcolor: "white.main_50" }} /> */}
      <Typography id="icono-dashboard" color="white.main_50" fontSize="2vh" fontWeight="bolder" className={!left ? "c-derecha-simple" : "c-izquierda-simple"} />
      {/* <Box id="box-dashboard" sx={{ alignItems: "center", justifyContent: "center", height: "2vh", px: parpadear ? "0.1vw" : "0.3vw", borderRadius: 10, bgcolor: "white.main_50" }} /> */}
      {/* <Box id="box-dashboard" sx={{ alignItems: "center", justifyContent: "center", height: "30vh", px: "0.1vw", borderRadius: 10, bgcolor: "white.main_50" }} /> */}
    </Grid>
  );
};

BotonLateralComponent.propTypes = {
  onClick: PropTypes.func.isRequired,
  left: PropTypes.bool,
};

export default BotonLateralComponent;
