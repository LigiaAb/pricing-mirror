import React, { useState, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Grid, Box, Typography, IconButton, Icon, Button, Menu, MenuItem, Tooltip } from "@mui/material";
import { colores_actividad, colores_estados, iconos_actividad } from "../../theme/colores_actividad";

const CardActividadComponent = (props) => {
  const { actividad, onClick, catalogos } = props;
  const { entidades = [] } = catalogos;
  const [cliente, setCliente] = useState(null);

  // useEffect(() => {
  //     console.log(actividad)
  //     setCliente(entidades?.find((i) => i.entidad_id === actividad.cod_cliente))
  // },[entidades])

  return (
    <Grid container width={"100%"}>
      <Button
        variant="text"
        sx={{
          width: "100%",
          display: "block",
          textTransform: "none",
          py: 0,
          px: 0,
          m: 0,
          textAlign: "left",
          color: "inherit",
          bgcolor: "rgba(0, 0, 0, 0)",
          // border: 1
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
            height: "100%",
            // py:0.5
          }}
        >
          <Grid
            item
            size={2}
            sx={{
              display: "flex",
              // flexDirection:"row",
              justifyItems: "center",
              alignItems: "center",
              flexDirection: "column",
              py: 0.5,
            }}
          >
            <Typography className={iconos_actividad[actividad.nom_tipo]} sx={{ fontSize: 18, mr: 0.5, mb: 0.5, color: colores_actividad[actividad.nom_tipo] }} />
            <Icon className="c-radio-button" sx={{ fontSize: 18, mr: 0.5, color: colores_estados[actividad.estado_desc] }} />
          </Grid>

          <Grid
            item
            size={10}
            sx={{
              bgcolor: "primary.main",
              borderRadius: 1,
              py: 0.1,
              px: 0.4,
              height: "100%",
              alignItems: "center",
              alignContent: "center",
            }}
          >
            <Typography fontSize="0.75rem" color="white.main" pr={0.6}>
              {actividad.nom_tipo} {actividad.nombre_cliente ? `- ${actividad.nombre_cliente}` : ""}
              {/* - {entidades?.find((i) => i.entidad_id === actividad.cod_cliente)?.entidad_nombre} */}
            </Typography>
          </Grid>
        </Grid>
      </Button>
    </Grid>
  );
};

CardActividadComponent.propTypes = {
  actividad: PropTypes.object,
  onClick: PropTypes.func,
};

export default CardActividadComponent;
