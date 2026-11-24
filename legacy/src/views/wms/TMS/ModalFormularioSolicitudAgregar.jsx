import FormularioComponent from '@/components/Formulario/FormularioComponent'
import { Drawer } from '@mui/material'
import { Box } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { useCallback } from 'react'

const ModalFormularioSolicitudAgregar = (props) => {
    const {open, close, fnAgregarSolicitud} = props
    const anchor = 'right'
    const [formSolicitud,setFormSolicitud] = useState({
        text_solicitud:''
    })

    const inputs = useMemo(()=>{
        const {text_solicitud} = formSolicitud
        return [
            {
                tipo:'titulo',
                id: 'titulo',
                val:'Buscar solicitud',
            },
            {
                tipo:'text',
                val:text_solicitud,
                id:'text_solicitud',
                label:'Solicitud'
            }
        ]
    },[formSolicitud])

    const onInputHandler = useCallback(async({id,val})=>{
        setFormSolicitud((v)=>({...v, [id]: val}))
    },[])

    const validarSolicitud = useCallback(()=>{
        fnAgregarSolicitud(formSolicitud.text_solicitud)

    })
  return (
    <Drawer
    open={open}
    onClose={close}
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
            <FormularioComponent
            inputs={inputs}
            onInput={onInputHandler}
            botones={{
                agregar:{
                    texto:'Agregar solicitud',
                    onClick: ()=>validarSolicitud()
                } 
            }}
            />

    </Drawer>
  )
}

export default ModalFormularioSolicitudAgregar