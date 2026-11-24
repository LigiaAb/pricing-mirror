import FormularioComponent from '@/components/Formulario/FormularioComponent'
import { Drawer, Box, Snackbar } from '@mui/material'
import React, { useCallback, useMemo, useState } from 'react'
import usePiloto from './hooks/usePiloto'
const ModalFormularioNuevoPiloto = (props) => {
    const {open, close} = props

    const {createPiloto} = usePiloto()
    const anchor ='right'
    
    const [formPiloto, setFormPiloto] = useState({
        text_fullName: '',
        text_licencia:'',
        text_telefono: '',

    })

    const [snackState, setSnackState]= useState({
        open:false,
        message:''
    })

    const inputs  = useMemo(()=>{
        const {text_fullName, text_licencia,text_telefono } =formPiloto

        return [
            {
                tipo:'titulo',
                val:"Registrar Piloto",
                id:'titulo'
            },
            {
                tipo:'text',
                label:'Nombre completo',
                val: text_fullName,
                id: 'text_fullName'
            },
            {
                tipo:'text',
                label:'Licencia',
                val: text_licencia,
                id: 'text_licencia'
            },
            {
                tipo:'text',
                label:'Telefono',
                val:text_telefono,
                id: 'text_telefono'
            }
        ]
    },)

    const onInput = useCallback(({id,val})=>{
        setFormPiloto((v)=>({...v, [id]:val}))
    },[])

    const valideForm=()=>{
        if(formPiloto.text_fullName.toString().trim().length>5 
            && formPiloto.text_licencia.toString().trim().length>5
        ){
            return true

        }else{
            return false
        }
    }
    const registrarPiloto = useCallback(async()=>{
            if(valideForm()){

                await createPiloto(formPiloto)
                setFormPiloto({text_fullName:'', text_telefono:'', text_licencia:''})
                close()
            }
            else{

                setSnackState((v)=>({...v,open:true,message:"Debe llenar los campos"}))

            }
    },[])
    const handleClose= useCallback(()=>{
        setSnackState((v)=>({...v,open:false}))
    }, [])
  return (
    <Drawer
    anchor={anchor}
    open= {open}
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
        }
    }}
    >
        <Box 
        sx={{
            p:3
        }}

          >

                <FormularioComponent
                    inputs={inputs}
                    onInput= {onInput}
                    botones={{
                        agregar:{
                            onClick:()=>registrarPiloto()
                        }
                    }}
                />

        </Box>

        <Snackbar 
        open={snackState.open}
        autoHideDuration={5000}
        onClose={handleClose}
        message={snackState.message}

        />
    </Drawer>
  )
}

export default ModalFormularioNuevoPiloto