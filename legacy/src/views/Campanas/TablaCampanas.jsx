import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import { tabla_campanas } from "./HeadersCampanas";
import { colores_estados } from "../../theme/colores_actividad";

export const TablaCampanas = (props) => {
  const { datos = [], newBtn = false } = props;

  const navigate = useNavigate();

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo={tabla_campanas["titulo"]}
        id={tabla_campanas["id"]}
        encabezado={tabla_campanas["headers"]}
        datos={datos}
        select={false}
        eventosDeTabla={{
          add: (fila) => (fila) => console.log("add", fila),
          view: (fila) => navigate(encryptId(fila?.content.cod_campana)),
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => navigate(encryptId(fila?.content.cod_campana)),
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => console.log("delete", fila),
        }}
        botones={
          newBtn && {
            nuevo: { label: "nuevo", color: "primary", onClick: () => navigate(encryptId("new")) },
          }
        }
      />
    </Box>
  );
};

TablaCampanas.propTypes = {
  datos: PropTypes.array,
  newBtn: PropTypes.bool,
};
