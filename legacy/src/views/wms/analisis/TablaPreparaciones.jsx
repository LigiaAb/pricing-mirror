import { useState } from "react";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import usePreparaciones from "./hooks/usePreparaciones";
import FormPreparacion from "./FormPreparacion";
import { Box, Pagination } from "@mui/material";
export default function TablaPreparaciones(){

    const [open, setOpen] = useState()
    const {preparaciones,imprimirPDfPrepa, getPreparaciones} = usePreparaciones()
    const encabezado =[
        {
            label: 'Preparación',
            campo: 'solicitud_id',
            aling: 'center'
        },
        {
            label:'Facturas',
            campo: 'soldet_factura',
            aling: 'center'
        }
    ]

  /*   const [page, setPage] = useState(2);
  const handleChange = (event, value) => {
    setPage(value);
  }; */

    return (
        <>
        <div style={{
            width:'100%',  
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',      // ← Esto centra horizontalmente
        }}>
    <Box sx={{ width: '100%' }}>

        <TablaComponent
        id="solicitud_id"
        usePagination={false}
        encabezado={encabezado}
        datos={preparaciones}
        botones={{
            add: { label: 'Preparar', color: 'primary', onClick: ()=> setOpen(true) },
        }}
        eventosDeTabla={{

            delete: (row)=>{
                console.log("Eliminar", row)       
            },
            pdf: (row)=>{
                imprimirPDfPrepa(row.content.solicitud_id)       
            }
            }
        }        />
        </Box>
        <br/>
         {/*  <Pagination count={10} page={page} onChange={handleChange} /> */}
         
        <Pagination color="primary" count={10} page={2}  showFirstButton showLastButton  />
        </div>

        <FormPreparacion
        open={open}
        getPreparaciones={getPreparaciones}
        onClose={() => setOpen(false)}
        />
        </>
    )
}