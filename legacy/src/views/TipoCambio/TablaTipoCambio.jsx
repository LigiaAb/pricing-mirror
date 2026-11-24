import React, { useState, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";

export const TablaTipoCambio = (props) => {
  const { dataApi, modalResume, viewBtn } = props;
  const [headesRender, setHeadersRender] = useState([
    {
      name: "COD_TIP_CAMBIO",
      label: "Codigo",
      campo: "cod_tip_cambio",
    },
    {
      name: "NOM_MONEDA_DESTINO",
      label: "Moneda Destino",
      campo: "nom_moneda_destino",
    },
    {
      name: "VALOR_TIPOCAMBIO",
      label: "Valor de Cambio",
      campo: "valor_tipocambio",
    },
    {
      name: "fecha_tipocambio",
      label: "Fecha de cambio",
      campo: "fecha_tipocambio",
    },
  ]);
  const navigate = useNavigate();
  useEffect(() => {
    if (modalResume) {
      setHeadersRender([
        {
          name: "COD_TIP_CAMBIO",
          label: "Codigo",
          campo: "cod_tip_cambio",
        },
      ]);
    }
  }, []);


  const datos = useMemo(() => {
    return dataApi.map((i) => {
      // Generacion de objeto para propiedades de celdas
      let o = {};
      Object.keys(i).forEach(
        (d) =>
          (o[d] = {
            color: undefined,
            bold: undefined,
          })
      );

      return {
        ...i,
        accionesDeTabla: {
          add: false,
          view: false,
          go: false,
          copy: false,
          paste: false,
          auth: false,
          edit: false,
          excel: false,
          pdf: false,
          download: false,
          delete: false,
        },
        propiedadesDeTabla: o,
      };
    });
  }, [dataApi]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo="Cambios"
        id="cod_tip_cambio"
        encabezado={headesRender}
        datos={datos}
        // onFilaSeleccionada={(fila) => console.log("select", fila)}
        select={false}
        eventosDeTabla={{
          add: (fila) => { console.log("add", fila) },
          view: (fila) => { console.log("view", fila) },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => { console.log("edit", fila) },
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => handleDelete(fila),
        }}
        botones={{}}
      />
    </Box>
  );
};
