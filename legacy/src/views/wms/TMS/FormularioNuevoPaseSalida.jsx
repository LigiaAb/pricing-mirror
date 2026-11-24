import FormularioComponent from '@/components/Formulario/FormularioComponent'
import TablaComponent from '@/components/Tabla/TablaComponent'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ModalFormularioNuevoPiloto from './ModalFormularioNuevoPiloto'
import usePasesalida from './hooks/usePasesalida'
import useAlmacen from '../almacen/hooks/useAlmancen'
import ModalFormularioSolicitudAgregar from './ModalFormularioSolicitudAgregar'
import { IconButton, Snackbar } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom'

const FormularioNuevoPaseSalida = () => {
    const {getPilotos,pilotos, crearPase, valideSolicitud} = usePasesalida()
    const {entidades, almacenes} =useAlmacen()
    const navigate = useNavigate()

    const [stateSnack, setStateSnack] = useState({
        open:false,
        message:""
    })

    const [formPase, setFormPase] =  useState({
        placa_id: '',
        select_entidad: null,
        select_piloto: null,
        select_almacen: null,
        solicitudes: []
    }) 

    const [openFormPiloto, setOpenFormPiloto] = useState(false)
    const [openFormSolicitud, setOpenFormSolicitud] = useState(false)

    const inputs  = useMemo(()=>{
        const {placa_id, select_piloto, select_entidad, select_almacen}  = formPase
        return [
            {
                tipo:'titulo',
                id:'titulo',
                val:'Nuevo Pase'
            },
            {
                id:'placa_id',
                tipo:'text',
                label:'Placa',
                val: placa_id
            },
            {
                id:'select_piloto',
                tipo:'select',
                label:'Piloto',
                val:select_piloto,
                options:pilotos.map(i=>{
                            return{
                                value:i.piloto_id,
                                label: i.licencia + " "+ i.nombre_completo
                            }
                        }),
                actions:[
                    {
                        id:'select_piloto',
                        icono:'c-suma',
                        label:'Agregar piloto',
                        enabled:true,
                        
                        onClick:()=>{setOpenFormPiloto(true)}
                    }
                ]
            },
            {
                id:'select_almacen',
                tipo:'select',
                label:'Almacén',
                val:select_almacen,
                options:almacenes.map((i)=>{
                    return{
                        value:i.ALMCEN_ID,
                        label:i.ALMACEN_ID+ ". " +i.ALMACEN_NOM
                    }
                })
            },
            {
                id:'select_entidad',
                tipo:'select',
                label:'Cliente',
                val:select_entidad,
                options:entidades.map((i)=>{
                    return{
                        value:i.entidad_id,
                        label:i.entidad_id+ ". " +i.entidad_nombre
                    }
                })                
            },

        ]
    },[formPase, pilotos])

    function closeModal(){
        setOpenFormPiloto(false)
        getPilotos()
    }

   const onInputHandler =useCallback(({id,val})=>{
        setFormPase((v)=>({...v,[id]:val}))
    },[])

    useEffect(()=>{
         getPilotos()
    },[getPilotos])

    const  registrarPase = useCallback(async()=>{
        await crearPase(formPase)
        setFormPase({
            placa_id: '',
            select_entidad: null,
            select_piloto: null,
            solicitudes:[]
        })

    },[])

    const closeFormSolicitud = useCallback(()=>{
        setOpenFormSolicitud(false)
    },[])

    const fnAgregarSolicitud = useCallback(async(solicitud_id)=>{
        const data = await valideSolicitud(solicitud_id)
        if(data.cod_mensaje ==200){

            setOpenFormSolicitud(false)
            const solicitudes = formPase.solicitudes
            solicitudes.push({solicitud_id: solicitud_id})
            setFormPase((v)=>({...v,['solicitudes']:solicitudes }))
        }
        else if(data.cod_mensaje ==204 || data.cod_mensaje ==201){

            setStateSnack((v)=>({...v, ['message']:data.mensaje, open:true}))
        }
                
    },[])

    const closeSnackHandler = useCallback(async()=>{
        setStateSnack((i)=>({...i, open:false}))
    },[])

  return (
    <>
        <IconButton
            aria-label="back"  color='primary'
            >
               <ArrowBackIcon onClick={()=>{navigate(-1)}}/> 
        </IconButton>

        <FormularioComponent
            inputs = {inputs}
            onInput={onInputHandler}
            botones={{
                agregar:{
                    visible:false,
                    onClick:()=>registrarPase()
                }
            }}
        />
        <TablaComponent
        key={'solicitud_id'}
        titulo="Solicitudes-Facturas"
        encabezado={[{name: 'facturas', label :'solicitudes', campo:'solicitud_id'}]}
        datos={formPase.solicitudes}
        useSeach={false}
        botones={{
            agregar:{
                label:'Agregar solicitud',
                onClick:()=>setOpenFormSolicitud(true)
            }
        }}
        />
        <FormularioComponent
        key={"botones"}
        inputs={[{
            tipo:'separador'
        }]}
        botones={{
            agregar:{
                texto:'Registrar pase',
                visible:true,
                onClick:()=>registrarPase()
            }
        }}

        />
        <ModalFormularioNuevoPiloto
            open= {openFormPiloto}
            close= {closeModal}
        />

        <ModalFormularioSolicitudAgregar
        open={openFormSolicitud}
        close={closeFormSolicitud}
        fnAgregarSolicitud = {fnAgregarSolicitud}
        />
        <Snackbar
        open= {stateSnack.open}
        onClose={closeSnackHandler}
        autoHideDuration={5000}
        message={stateSnack.message}
        />
    </>
  )
}

export default FormularioNuevoPaseSalida