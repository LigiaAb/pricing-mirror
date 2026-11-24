import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { api } from "../../api";

export const TablaPaises = (props) => {
  const { dataApi, modalResume, viewBtn, newBtn } = props;
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [headesRender, setHeadersRender] = useState([
    {
      name: "COD_PAIS",
      label: "Codigo",
      campo: "cod_pais",
    },
    {
      name: "NOMBRE_PAIS",
      label: "País",
      campo: "nombre_pais",
    },
    {
      name: "REF_PAIS",
      label: "Referencia",
      campo: "ref_pais",
    },
  ]);
  const navigate = useNavigate();
  useEffect(() => {
    if (modalResume) {
      setHeadersRender([
        {
          name: "NOMBRE_PAIS",
          label: "País",
          campo: "nombre_pais",
        },
      ]);
    }
  }, []);

  const eliminarFila = (fila) => {
    console.log("fila", fila.content)
    api.post("/api/appweb/eliminarpaises", { ...fila.content, cod_estado: 4 }).then((i) => navigate(0));
  }

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* <pre>{JSON.stringify(dataApi, null, 2)}</pre> */}
      <TablaComponent
        titulo="Países"
        id="cod_pais"
        encabezado={headesRender}
        datos={dataApi}
        // onFilaSeleccionada={(fila) => console.log("select", fila)}
        select={false}
        eventosDeTabla={{
          add: (fila) => {
            if (fila) navigate(`${fila?.content.cod_pais}`);
          },
          view: (fila) => {
            // if (fila) navigate(`${fila?.content.cod_pais}`);
            if (fila) navigate(`${encryptId(fila?.content.cod_pais)}`);
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => {
            if (fila) navigate(`${encryptId(fila?.content.cod_pais)}`);
          },
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => {
            setMostrarAlerta(true);
            setFilaSeleccionada(fila);
          },
        }}
        botones={
          true && {
            nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId("new")}`), color: "primary" },
          }
        }
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
