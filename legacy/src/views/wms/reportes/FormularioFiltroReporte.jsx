import FormularioComponent from '@/components/Formulario/FormularioComponent'
import { Drawer , Box} from '@mui/material'
import React, { useCallback, useMemo, useState } from 'react'
import useAlmacen from '../almacen/hooks/useAlmancen'

const FormularioFiltroReporte = (props) => {
    const {anchor,  open, close, fnGetInventario} = props
    const {entidades} =useAlmacen()
    
    
        const [filtro, setFiltro] = useState({
            select_entidad: null,
        })
    
        const inputs = useMemo(()=>{
    
            const {
                select_entidad,
                 }  = filtro
            return [
                {
                    tipo:'select',
                    id: 'select_entidad',
                    label: 'Cliente',
                    val: select_entidad, 
                    options: entidades.map(item => {
                        return {
                            value: item.entidad_id,
                            label: `${item.entidad_id} - ${item.entidad_nombre}`,
                            key:item.entidad_id.toString()
                        }
                    })
                }
            ]
        })
    
        const onInput = useCallback(async({id, val}) => {
            console.log(val)
            setFiltro((v)=>({...v, [id]: val}))
        }, [])
    
        const fnFiltrar = useCallback(() => {
            console.log(filtro)
            fnGetInventario(filtro.select_entidad.value)
            setFiltro({ select_entidad: null})
            close()
        }, [filtro])
    
  return (
    <>
    <Drawer
     anchor={anchor}
        open={open}
        onClose={close}
        sx= {{ '& .MuiDrawer-paper': {
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
        <Box sx={{p:3}}>

            <h2>Filtro de inventario </h2>
            <FormularioComponent
            id="form1"
            inputs = {inputs}
            onInput = {onInput}
            botones={{ 
                    agregar: {
                        visible:false,
                    },
                    filtrar: {
                        visible:true,
                        texto:'Filtrar',
                        onClick:()=>fnFiltrar()
                    }
                }}
            />
        </Box>

    </Drawer>
    </>
  )
}

export default FormularioFiltroReporte