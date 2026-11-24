import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import { tabla_oportunidades } from "./HeadersOportunidades";
import { colores_estados } from "../../theme/colores_actividad";

export const TablaOportunidades = (props) => {
  const { headers, datos = [], newBtn = false, setUpdateData, updateData } = props;
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

  const navigate = useNavigate();

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo={tabla_oportunidades["titulo"]}
        id={tabla_oportunidades["id"]}
        encabezado={tabla_oportunidades["headers"]}
        datos={datos}
        select={false}
        eventosDeTabla={{
          add: (fila) => (fila) => console.log("add", fila),
          view: (fila) => navigate(encryptId(fila?.content.cod_oportunidad)),
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => navigate(encryptId(fila?.content.cod_oportunidad)),
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
