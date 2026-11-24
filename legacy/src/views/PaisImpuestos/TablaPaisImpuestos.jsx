import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { FormularioImpuestoPais2 } from "../Impuestos/FormularioImpuestoPais2";
import { api } from "../../api";

export const TablaPaisImpuestos = (props) => {
  const { dataApi, newBtn = false, updateData, setUpdateData, impuestos, estados } = props;
  const [headesRender, setHeadersRender] = useState([
    { name: "COD_IMPUESTO", label: "Codigo", campo: "cod_impuesto" },
    { name: "NOM_IMPUESTO", label: "Nombre", campo: "nom_impuesto" },
    { name: "PORCENTAJE_IMPUESTO", label: "Porcentaje", campo: "porcentaje_impuesto" },
    { name: "ESTADO_DESC", label: "Estado", campo: "estado_desc" },
    { name: "FECHA_INICIO_IMPUESTO", label: "Fecha de inicio", campo: "fecha_inicio_impuesto" },
    { name: "FECHA_FIN_IMPUESTO", label: "Fecha de fin", campo: "fecha_fin_impuesto" },
  ]);

  const [impuesto, setImpuesto] = useState(null);
  const [open, setOpen] = useState(false);

  const datos = useMemo(() => {
    console.log(dataApi);
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

  const navigate = useNavigate();

  const eliminarFila = (fila) => {
    console.log("fila", fila.content);
    api.post("/api/appweb/eliminar-impuesto-x-pais", { ...fila.content, cod_estado: 4 }).then((i) => setUpdateData(updateData + 1));
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo="Impuestos"
        id="cod_impuesto_pais"
        encabezado={headesRender}
        datos={datos}
        select={false}
        eventosDeTabla={{
          add: (fila) => {
            if (fila) navigate(`${fila?.content.cod_pais}`);
          },
          view: (fila) => {
            if (fila) {
              setImpuesto({
                cod_impuesto: fila?.content.cod_impuesto,
                nom_impuesto: fila?.content.nom_impuesto,
              });
              setOpen(!open);
            }
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => {
            if (fila) {
              setImpuesto({
                cod_impuesto: fila?.content.cod_impuesto,
                nom_impuesto: fila?.content.nom_impuesto,
              });
              setOpen(!open);
            }
          },
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => eliminarFila(fila),
        }}
        botones={
          newBtn && {
            nuevo: {
              label: "agregar",
              color: "primary",
              onClick: () => {
                setOpen(!open);
                setImpuesto(null);
              },
            },
          }
        }
      />
      {open && (
        <Box sx={{ p: 1, m: 0, my: 2 }}>
          <Grid size="grow">
            <Typography my={2} p={0} variant="h4">
              AGREGAR IMPUESTO
            </Typography>
          </Grid>

          <FormularioImpuestoPais2
            readOnly={false}
            // dataGet={impuesto}
            impuestos={impuestos}
            estados={estados}
            enableBtn={true}
            readOnlyInput={false}
            updateData={updateData}
            setUpdateData={setUpdateData}
          />
        </Box>
      )}
    </Box>
  );
};
