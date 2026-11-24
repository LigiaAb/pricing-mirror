import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography, Icon } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const TablaReporteMovimientoArticulo = (props) => {
  const { headers, titulo, id, datos } = props;
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [valores, setValores] = useState({
    articulo: null,
    lote: null,
  });
  const [headesRender, setHeadersRender] = useState([]);
  const navigate = useNavigate();

  return (
    <Box sx={{ px: 1 }}>
      <TablaComponent
        titulo={titulo}
        id={id}
        encabezado={headers}
        datos={datos}
        select={false}
        multipleSelect={false}
        onFilaSeleccionada={setFilaSeleccionada}
        eventosDeTabla={{
          add: (fila) => console.log("add", fila),
          view: (fila) => console.log("view", fila),
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => console.log("edit", fila),
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => {
            console.log("delete", fila);
          },
        }}
        botones={{}}
      />
      <ActionAlertComponent
        aceptar={() => {
          eliminarFila(filaSeleccionada);
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="error"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};
