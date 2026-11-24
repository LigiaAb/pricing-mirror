import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography, Icon } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";

export const TablaReportePuestosDeEmpleado = (props) => {
  const { headers, titulo, id, datos, filaSeleccionada, setFilaSeleccionada } = props;
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  // const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [valores, setValores] = useState({
    articulo: null,
    lote: null,
  });

  const datos_ = useMemo(() => {
    return datos.map((i) => {
      let o = {};
      Object.keys(i).forEach((d) => {
        o[d] = {
          color: d === "estado_desc" ? (i.estado_desc === "ACTIVO" ? "green.main" : "red.main") : undefined,
          bold: d === "estado_desc" ? true : undefined,
        };
      });
      return {
        ...i,
        propiedadesDeTabla: o,
      };
    });
  }, [datos]);

  return (
    <Box sx={{ px: 1 }}>
      <TablaComponent
        titulo={titulo}
        id={id}
        encabezado={headers}
        datos={datos_}
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
