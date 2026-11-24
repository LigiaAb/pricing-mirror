import { Drawer, Box } from "@mui/material"
import { useCallback, useEffect, useMemo, useState } from "react"
import useRack from "./hooks/useRack"
import useAlmacen from "../almacen/hooks/useAlmancen"
import FormularioComponent from "../../../components/Formulario/FormularioComponent"


const FormularioFiltroRack= (props)=>{
    const {anchor, open, onClose, initialData, obtener_racksFiltrado, bodegas, rackRacks,
      tramos, nivels,espacio
    } = props

    const { almacenes } = useAlmacen()
    

    const [filtro, setFiltroValores] = useState({
        select_almacen: null,
        select_bodega: null,
        select_rack:null,
        select_tramo:null,
        select_nivel:null,
        select_espacio:null
        })

    const inputs = useMemo(()=>{
        const {
        select_almacen,
        select_bodega,
        select_rack,
        select_tramo,
        select_nivel,
        select_espacio }  = filtro
        return [
            {
                tipo:'select',
                id: 'select_almacen',
                label: 'Almacen',
                val: select_almacen, 
                options: almacenes.map(i=>{
                    return {
                        value:i.ALMACEN_ID,
                        label:i.ALMACEN_NOM
                    }
                })
            },
            {
                tipo:'select',
                id: 'select_bodega',
                label: 'Bodega',
                val: select_bodega, 
                options: bodegas
            },
            {
                tipo:'select',
                id: 'select_rack',
                label: 'Rack',
                val: select_rack, 
                options:rackRacks
            },
            {
                tipo:'select',
                id: 'select_tramo',
                label: 'Tramo',
                val: select_tramo, 
                options:tramos
            },
            {
                tipo:'select',
                id: 'select_nivel',
                label: 'Nivel',
                val: select_nivel, 
                options: nivels
            },
            {
                tipo:'select',
                id: 'select_espacio',
                label: 'Espacio',
                val: select_espacio, 
                options:espacio
            }
        ]
    })

     const onInput = useCallback(async({ id, val }) => {
       setFiltroValores((v) => ({ ...v, [id]: val }));
        
        }, []);
        useEffect(()=>{
          getDataFilter()
        },[filtro])
    const getDataFilter=()=>{
      
    const {select_almacen,
        select_bodega,
        select_rack,
        select_tramo,
        select_nivel,
        select_espacio} = filtro
        let params  = {}
        if(select_almacen) params.almacen_id = select_almacen.value
        if(select_bodega) params.bod = select_bodega.value
        if(select_rack) params.rack = select_rack.value
        if(select_tramo) params.tramo = select_tramo.value
        if(select_nivel) params.nivel = select_nivel.value
        if(select_espacio) params.espacio = select_espacio.value
        
         obtener_racksFiltrado(params)
        
    }  
    return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 500,
          maxWidth: '80vw',
          boxSizing: 'border-box',
          ...(anchor === 'left' || anchor === 'right') && {
            top: '20%',
            transform: 'translateY(-50%)',
            height: 'auto',
          },
          ...(anchor === 'top' || anchor === 'bottom') && {
            left: '50%',
            transform: 'translateX(-40%)',
          },
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <h2>Filtro</h2>
        <FormularioComponent
          inputs={inputs}
          onInput={onInput}
          botones={{
            agregar: {
              visible:false,
              //onClick:()=>agregar()
            }
          }}
        />

      </Box>
    </Drawer>
  )
}

export default FormularioFiltroRack