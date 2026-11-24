import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography, Icon } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { existencias } from "./MockData";

export const TablaReporteExistenciasArticulo = (props) => {
  const { dataApi, modalResume, viewBtn } = props;
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [valores, setValores] = useState({
    articulo: null,
    lote: null,
  });
  const [headesRender, setHeadersRender] = useState([
    {
      name: "INGDEC",
      label: "Declaración",
      campo: "ingdec",
    },
    {
      name: "INGLIN",
      label: "Linea",
      campo: "inglin",
    },
    {
      name: "ARTCOD",
      label: "Artículo",
      campo: "artcod",
    },
    {
      name: "INGTAR",
      label: "Tarima",
      campo: "ingtar",
    },
    {
      name: "INGFLOT",
      label: "Fecha de vencimiento",
      campo: "ingflot",
    },
    {
      name: "INGUNI",
      label: "Unidades por bulto",
      campo: "inguni",
    },
    {
      name: "DISPONIBLES",
      label: "Disponibles",
      campo: "disponibles",
    },
    {
      name: "REALES",
      label: "Reales",
      campo: "reales",
    },
    {
      name: "TIPDES",
      label: "Almacen",
      campo: "tipdes",
    },
  ]);
  const navigate = useNavigate();

  return (
    <Box sx={{ px: 1 }}>
      <TablaComponent
        titulo="Existencias por articulo"
        id="ingdec"
        encabezado={headesRender}
        datos={existencias}
        select={true}
        multipleSelect={false}
        onFilaSeleccionada={setFilaSeleccionada}
        eventosDeTabla={{
          add: (fila) => {
            // if (fila) navigate(`${fila?.content.cod_pais}`);
          },
          view: (fila) => {
            // if (fila) navigate(`${fila?.content.cod_pais}`);
            // if (fila) navigate(`${encryptId(fila?.content.cod_moneda)}`);
          },
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
