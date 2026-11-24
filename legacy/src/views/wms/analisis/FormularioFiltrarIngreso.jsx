import FormularioComponent from '@/components/Formulario/FormularioComponent'
import { Box, Drawer } from '@mui/material'
import React, { useCallback, useMemo, useState } from 'react'
import useAlmacen from '../almacen/hooks/useAlmancen'

export const FormularioFiltrarIngreso = (props) => {
    const {anchor, open, close, fnFiltrarIngresos} = props
    const {entidades} = useAlmacen()


    const [filtro, setFiltro] = useState({
        select_entidad: null,
        text_identificacion: ''
    })

    const inputs = useMemo(()=>{

        const {
            select_entidad,
            text_identificacion }  = filtro
        return [
            {
                tipo:'select',
                id: 'select_entidad',
                label: 'Cliente',
                val: select_entidad, 
                options: entidades.map(item => {
                    return {
                        value: item.entidad_id,
                        label: `${item.entidad_id} - ${item.entidad_nombre}`
                    }
                })
            },
            {
                tipo:'text',
                id: 'text_identificacion',
                label: 'Identificación de ingreso',
                val: text_identificacion, 
            },
        ]
    })

    const onInput = useCallback(async({id, val}) => {
        setFiltro((v)=>({...v, [id]: val}))
    }, [])

    const fnFiltrar = useCallback(() => {
        fnFiltrarIngresos(filtro)
        setFiltro({ select_entidad: null, text_identificacion: ''})
        close()
    }, [])


  return (
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
        <Box sx={{ p: 3 }}>
            <h2>Filtro</h2>

            <FormularioComponent
                inputs={inputs}
                onInput={onInput}
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
  )
}