import React, { useState, useMemo } from "react";
import { Box, Grid } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { api } from "../../api";
import { VistaCiudades } from "../../pages/Ciudades/VistaCiudades";

export const TablaPaisCiudades = (props) => {
  const navigate = useNavigate();

  const { currentPais, dataApi, modalResume, viewBtn, newBtn, updateData, setUpdateData } = props;
  const [headesRender, setHeadersRender] = useState([
    { name: "COD_CIUDAD", label: "Codigo", campo: "cod_ciudad" },
    { name: "NOMBRE_CIUDAD", label: "Nombre", campo: "nombre_ciudad" },
    { name: "SIGLAS_CIUDAD", label: "Siglas", campo: "siglas_ciudad" },
    { name: "ESTADO_DESC", label: "Estado", campo: "estado_desc" },
  ]);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

  const [open, setOpen] = useState(false);
  const [ciudadId, setCiudadID] = useState("new");

  const datos = useMemo(() => {
    return dataApi.map((i) => {
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
  }, [dataApi]);

  const eliminarFila = (fila) => {
    api.post("/api/appweb/eliminar-ciudad", { ...fila.content, cod_estado: 4 }).then((i) => setUpdateData(updateData + 1));
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo="Ciudades"
        id="cod_ciudad"
        encabezado={headesRender}
        datos={datos}
        select={false}
        eventosDeTabla={{
          add: (fila) => {
            if (fila) navigate(`${fila?.content.cod_pais}`);
          },
          view: (fila) => {
            setOpen(!open);
            setCiudadID(encryptId(fila?.content.cod_ciudad));
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => {
            setOpen(!open);
            setCiudadID(encryptId(fila?.content.cod_ciudad));
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
          newBtn && {
            nuevo: {
              label: "nuevo",
              color: "primary",
              onClick: () => {
                setOpen(!open);
                setCiudadID(encryptId("new"));
              },
            },
          }
        }
      />

      {open && (
        <Box sx={{ p: 1, m: 0, my: 2 }}>
          <VistaCiudades vistaId={ciudadId} currentPais={currentPais} updateData={updateData} setUpdateData={setUpdateData} />
        </Box>
      )}

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
