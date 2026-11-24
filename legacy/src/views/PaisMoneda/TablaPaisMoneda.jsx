import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import { VistaMoneda } from "../../pages/Moneda/VistaMoneda";

export const TablaPaisMoneda = (props) => {
  const { dataApi, modalResume, viewBtn, updateData, setUpdateData, newBtn } = props;
  const [open, setOpen] = useState(false);
  const [dataMoneda, setDataMoneda] = useState(null);
  const [newMoneda, setNewMoneda] = useState(null);
  const [headesRender, setHeadersRender] = useState([
    
    {
        name: "COD_MONEDA",
        label: "Codigo",
        campo: "cod_moneda",
    },
    {
        name: "NOM_MONEDA",
        label: "Nombre",
        campo: "nom_moneda",
    },
    {
        name: "COD_PAIS",
        label: "Codigo Pais",
        campo: "cod_pais",
    },
    {
        name: "SIMBOLO_MONEDA",
        label: "Simbolo",
        campo: "simbolo_moneda",
    },
  ]);
  const navigate = useNavigate();
//   useEffect(() => {
//     if (modalResume) {
//       setHeadersRender([
//         {
//             name: "COD_MONEDA",
//             label: "Codigo",
//             campo: "cod_moneda",
//         },
//       ]);
//     }
//   }, []);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo="Monedas"
        id="cod_moneda"
        encabezado={headesRender}
        datos={dataApi}
        select={false}
        eventosDeTabla={{
          add: (fila) => console.log("go", add),
          view: (fila) => {
            // if (fila) navigate(`../../moneda/${encryptId(fila?.content.cod_pais)}`);
            if (fila){
              setOpen(!open)
              setDataMoneda(fila?.content)
              setNewMoneda(false)
            }
            
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => {
            // if (fila) navigate(`../../moneda/${encryptId(fila?.content.cod_pais)}`);
            if (fila){
              setOpen(!open)
              setDataMoneda(fila?.content)
              setNewMoneda(false)
            }
          },
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => handleDelete(fila),
        }}
        botones={
          newBtn && {
            nuevo: { label: "nuevo", color: "primary", 
              onClick: () => {
                setOpen(!open)
                setNewMoneda(true)
                setDataMoneda(null)
              }
            },
          }
        }
      />

      {
        open &&
        <Box sx={{ p: 1, m: 0, my: 2 }}>
          <VistaMoneda
            // vistaId = {ciudadId}
            dataGet={dataMoneda}
            updateData={updateData}
            setUpdateData={setUpdateData}
            newMonedaProp={newMoneda}
          />
        </Box>
          
      }
    </Box>
  );
};
