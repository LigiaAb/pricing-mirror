import React, { useState, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Grid, Box, Typography, IconButton, Icon, Button, Menu, MenuItem, Tooltip } from "@mui/material";
import { colores_actividad, colores_estados, iconos_actividad } from "../../theme/colores_actividad";

const CardActividadComponent2 = (props) => {
  const { themeMode } = useSelector((state) => state.theme);
  const { actividad, onClick, catalogos } = props;
  const { entidades = [] } = catalogos;
  const [cliente, setCliente] = useState(null);

  // useEffect(() => {
  //     console.log(actividad)
  //     setCliente(entidades?.find((i) => i.entidad_id === actividad.cod_cliente))
  // },[entidades])

  return (
    <Grid container width={"100%"}>
      <Tooltip title={`${actividad.nom_tipo} - ${actividad.estado_desc} ${actividad.nombre_cliente ? `- ${actividad.nombre_cliente}` : ""}`}>
        <Button
          variant="text"
          sx={{
            width: "100%",
            display: "block",
            textTransform: "none",
            py: 0,
            px: 0,
            m: 0,
            // my: 2,
            bgcolor: themeMode == "dark" ? "background.200" : "background.600",
            textAlign: "left",
            color: "inherit",
            // bgcolor: "rgba(0, 0, 0, 0)",
            border: 2,
            // borderRadius: 1,
            borderColor: "primary.main",
          }}
          onClick={onClick}
        >
          <Grid
            container
            spacing={0.2}
            width={"100%"}
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyItems: "center",
              alignItems: "center",
              // height:"100%",
              // py:0.5
            }}
          >
            <Grid
              item
              size={12}
              sx={{
                display: "flex",
                // flexDirection:"row",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              <Typography className={iconos_actividad[actividad.nom_tipo]} sx={{ fontSize: 18, mx: 0.5, color: colores_actividad[actividad.nom_tipo] }} />
              <Typography className="c-radio-button" sx={{ fontSize: 18, mx: 0.5, color: colores_estados[actividad.estado_desc] }} />
            </Grid>

            <Grid
              item
              size={12}
              sx={{
                bgcolor: "primary.main",
                // borderRadius: 1,
                pt: 0.6,
                pb: 0.4,
                // height: "100%",
                alignItems: "center",
                alignContent: "center",
              }}
            >
              <Typography fontSize="0.75rem" color="white.main" px={1} textAlign="center">
                {actividad.nombre_cliente ? `${actividad.nombre_cliente}` : ""}
              </Typography>
            </Grid>
          </Grid>
        </Button>
      </Tooltip>
    </Grid>
  );
};

CardActividadComponent2.propTypes = {
  actividad: PropTypes.object,
  onClick: PropTypes.func,
};

export default CardActividadComponent2;
