import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import { FormularioImpuestos } from "./FormularioImpuestos";
import { api } from "../../api";

export const TablaImpuestos = (props) => {
  const { dataApi, paises=[], modalResume, viewBtn, newBtn = false, updateData, setUpdateData} = props;
  const [open, setopen] = useState(false)
  const [headesRender, setHeadersRender] = useState([

    {
      name: "COD_IMPUESTO",
      label: "Codigo Impuesto",
      campo: "cod_impuesto",
    },
    {
      name: "NOM_IMPUESTO",
      label: "Impuesto",
      campo: "nom_impuesto",
    },

  ]);
  const navigate = useNavigate();

  useEffect(() => {
    if (modalResume) {
      setHeadersRender([
        {
          name: "NOM_IMPUESTO",
          label: "Moneda",
          campo: "nom_impuesto",
        },
      ]);
    }
  }, []);

  
  const eliminarFila = (fila) => {
    console.log("fila", fila.content)
    api.post("/api/appweb/eliminar-impuesto", { ...fila.content, cod_estado: 4 }).then((i) => setUpdateData(updateData + 1));
  }

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo="Impuestos"
        id="cod_impuesto"
        encabezado={headesRender}
        datos={dataApi}
        select={false}
        eventosDeTabla={{
          add: (fila) => {
            if (fila) navigate(`${fila?.content.cod_pais}`);
          },
          view: (fila) => {
            // if (fila) navigate(`${fila?.content.cod_pais}`);
            if (fila) navigate(`${encryptId(fila?.content.cod_impuesto)}`);
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => {
            if (fila) navigate(`${encryptId(fila?.content.cod_impuesto)}`);
          },
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => eliminarFila(fila),
        }}
        botones={
          newBtn && {
            nuevo: { label: "nuevo", onClick: () => setopen(!open), color: "primary" },
          }
        }
      />

      {

        open && 
        <Box sx={{ p: 1, m: 0, my: 2 }}>  
          <Typography my={2} p={0} variant="h5">
              NUEVO IMPUESTO
          </Typography>
          <FormularioImpuestos
            readOnly={false}
            dataGet={null}
            enableBtn={false}
            readOnlyInput={false}
            updateData={updateData}
            setUpdateData={setUpdateData}
          />
        </Box>
      }

      


    </Box>
  );
};
