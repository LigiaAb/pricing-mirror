import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import PropTypes from "prop-types";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { tabla_campanas } from "./HeadersActividades";
import { encryptId } from "../../api/encryptDecrypt";
import DialogComponent from "../../components/Dialog/DialogComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { api } from "../../api";

export const TablaActividadesCampana = (props) => {
  const { datos = [], newBtn = false, vencidas, oportunidades, catalogos = {}, asignacion = false, proximas = false, updateData, setUpdateData } = props;
  const { entidades = [], empleados = [] } = catalogos;
  const [open, setOpen] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const navigate = useNavigate();

  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState([]);

  const [data, setData] = useState({});

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo={`Actividades`}
        id={tabla_campanas["id"]}
        encabezado={tabla_campanas["headers"]}
        datos={datos}
        select={asignacion}
        multipleSelect
        onFilaSeleccionada={(sel) => setActividadesSeleccionadas(sel)}
        eventosDeTabla={{
          add: (fila) => {
            fila && setFilaSeleccionada(fila.content);
            setOpen(true);
          },
          view: (fila) => navigate(encryptId(fila?.content.cod_actividad)),
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => navigate(encryptId(fila?.content.cod_actividad)),
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => console.log("delete", fila),
        }}
        botones={{}}
      />
    </Box>
  );
};

TablaActividadesCampana.propTypes = {
  datos: PropTypes.array, // Lista de actividades
  newBtn: PropTypes.bool, // Indica si se muestra el botón de nuevo
  vencidas: PropTypes.bool, // Indica si la tabla es de actividades retrasadas
  oportunidades: PropTypes.bool, // Indica si la tabla es de oportunidades
  catalogos: PropTypes.object, // Lista de entidades y empleados
};
