import React, { useState, useMemo } from "react";
import { Box, Grid } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { api } from "../../api";
import { VistaMunicipios } from "../../pages/Municipios/VistaMunicipios";

export const TablaPaisMunicipios = (props) => {
  const navigate = useNavigate();

  const { currentPais, dataApi, modalResume, viewBtn, newBtn, updateData, setUpdateData } = props;
  const [headesRender, setHeadersRender] = useState([
    { name: "COD_MUNI", label: "Codigo", campo: "cod_muni" },
    { name: "NOMBRE_MUNI", label: "Nombre", campo: "nombre_muni" },
    { name: "NOMBRE_DEPTO", label: "Departamento", campo: "nombre_depto" },
    { name: "ESTADO_DESC", label: "Estado", campo: "estado_desc" },
  ]);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

  const [open, setOpen] = useState(false);
  const [muniID, setMuniID] = useState("new");

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
    console.log("fila", fila.content);
    api.post("api/appweb/eliminar-municipios", { ...fila.content, cod_estado: 4 }).then((i) => setUpdateData(updateData + 1));
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo="Municipios"
        id="cod_muni"
        encabezado={headesRender}
        datos={datos}
        select={false}
        eventosDeTabla={{
          add: (fila) => {
            if (fila) navigate(`${fila?.content.cod_pais}`);
          },
          view: (fila) => {
            // if (fila) navigate(`../../municipio/${encryptId(fila?.content.cod_muni)}`);
            if (fila) {
              setOpen(!open);
              setMuniID(encryptId(fila?.content.cod_muni));
            }
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => {
            if (fila) {
              setOpen(!open);
              setMuniID(encryptId(fila?.content.cod_muni));
            }
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
                setMuniID(encryptId("new"));
              },
            },
          }
        }
      />

      {open && (
        <Box sx={{ p: 1, m: 0, my: 2 }}>
          <VistaMunicipios vistaId={muniID} updateData={updateData} setUpdateData={setUpdateData} currentPais={currentPais} />
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
