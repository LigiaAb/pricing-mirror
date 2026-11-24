import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography, Icon } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";

import { existencias } from "./MockData";

export const TablaReporteExistenciasPoliza = (props) => {
  const { dataApi, modalResume, viewBtn } = props;
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [valores, setValores] = useState({
    estado: null,
    tipo: null,
  });
  const [headesRender, setHeadersRender] = useState([
    {
      name: "INGDEC",
      label: "Declaración",
      campo: "ingdec",
    },
    {
      name: "INGFEC",
      label: "Fecha de Ingreso",
      campo: "ingfec",
    },
    {
      name: "ARTCOD",
      label: "Artículo",
      campo: "artcod",
    },
    {
      name: "ARTDES",
      label: "Descripcion del articulo",
      campo: "artdes",
    },
    {
      name: "INGLOT",
      label: "Lote",
      campo: "inglot",
    },
    {
      name: "BULTOS",
      label: "Bultos",
      campo: "bultos",
    },
    {
      name: "UNIDADES",
      label: "Unidades",
      campo: "unidades",
    },
    {
      name: "VALCIF",
      label: "Valor",
      campo: "valcif",
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
      {/* <Box sx={{ mb: 2 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            setValores((v) => ({ ...v, [id]: val }))
          }}
          botones={{ 
            agregar: { visible: false },
          }}
        />
      </Box> */}

      <TablaComponent
        titulo="Existencias por poliza"
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
