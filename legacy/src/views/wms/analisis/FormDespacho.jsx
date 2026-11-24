import { Box, Drawer } from '@mui/material'
import  { useCallback, useMemo, useState } from 'react'
import FormularioComponent from '../../../components/Formulario/FormularioComponent'
import useDespachos from './hooks/useDespachos'
export const FormDespacho = ({ obtenerDespachos, open= false, anchor ='right', onClose}) => {

    const {prepasSinSalidas, getSolicitud, solicitud, aduanas, regimenes,enviarDespacho}  = useDespachos()
    
    const [formDespacho, setFormDespacho] = useState({
    solicitud_id:null,
    declaracion:"",
    dua:'',
    almacen_id:null,
    cliente_id :null,
    fecha_id: "",
    regimen_id: null,
    pais_id: null,
    tipocambio_id: 0,
    consignatario_id:"",
    canttar_id:0,
    aduana_id:null,
    aduana_visible: false
    })

    const inputs =useMemo(()=>{
        const {
            solicitud_id,
            declaracion,
            dua,
            almacen_id,
            cliente_id,
            fecha_id,
            regimen_id,
            pais_id,
            tipocambio_id,
            consignatario_id,
            aduana_id,
            aduana_visible,
            canttar_id

        }= formDespacho
        return [
            {
                tipo:'titulo',
                val:'Salida desde una solicitud'
            },
            {
                tipo:'select',
                name: 'solicitud',
               label: 'solicitud',
                id:'solicitud_id',
                options: prepasSinSalidas,
                val:solicitud_id
            },
            {
                tipo:'select',
                label:'Almacen',
                id:'almacen_id',
                val:solicitud.ALMACEN_ID?{value:solicitud.ALMACEN_ID , label:solicitud.ALMACEN_NOM}:null,
                readonly:true
            },
            {
                tipo:'select',
                label:'Cliente',
                id:'cliente_id',
                readonly:true,
                val:solicitud.ENTIDAD_ID ? {value:solicitud.ENTIDAD_ID[0], label:solicitud.ENTIDAD_NOMBRE}: {},
            },
            {
                tipo:'select',
                label:'Pais destino',
                id:'pais_id',
                readonly:true,
                val:solicitud.PAIS_ID ? {value: solicitud.PAIS_ID[0], label: solicitud.PAIS_NOMBRE}: {},
            },
            {
                tipo:'text',
                label:'Consignatario',
                id:'consignatario_id',
                readonly:true,
                val: solicitud? solicitud.SOLICITUD_CONSIGNATARIO: ""
            },
            {
                name: 'declaracion',
               label: 'Declaracion',
                id:'declaracion',
                tipo:'text',
                val:declaracion
            },
            {
                tipo:'select',
                label:'Regimen',
                id:'regimen_id',
                options:regimenes.map(i =>{
                    return {
                        value:i.regimen_id,
                        label:i.regimen_description
                    }
                }),
                val:regimen_id
            },
            {
                tipo:'select',
                label:'Aduana',
                id:'aduana_id',
                options:aduanas.map(i=>{
                    return {
                        value: i.puntoenlace_id,
                        label: i.puntoenlace_nombre
                    }
                }),
                visible: aduana_visible,
                val:aduana_id
            },
            {
                tipo:'text',
                label:'DUA',
                id:'dua',
                val: dua,
                visible: aduana_visible
            },
            {
                tipo:'date',
                label:'fecha',
                id:'fecha_id',
                val:fecha_id
            },
            {
                tipo:'number',
                label:'Tipo de cambio',
                id:'tipocambio_id',
                val:tipocambio_id
            },
            {
                tipo:'number',
                label:'Cantidad de tarimas',
                id:'canttar_id',
                val:canttar_id
            },
        ]
    })

    const inputChange = useCallback(({id,val})=>{

        setFormDespacho((i)=>({...i,[id]:val}))
        if(id=='solicitud_id'&& val){
                getSolicitud(val.value)            
        }
        if(id=='regimen_id'&& val && val.value ==1){
            setFormDespacho((i)=>({...i,['aduana_visible']:false}))  
        }
        if(id=='regimen_id'&& val && val.value !==1){
            setFormDespacho((i)=>({...i,['aduana_visible']:true}))  
        }
    })

    const submitDespacho = async()=>{
       await  enviarDespacho(formDespacho)
       await obtenerDespachos()
       onClose()
        setFormDespacho({
             solicitud_id:null,
            declaracion:"",
            dua:'',
            almacen_id:null,
            cliente_id :null,
            fecha_id: "",
            regimen_id: null,
            pais_id: null,
            tipocambio_id: 0,
            consignatario_id:"",
            canttar_id:0,
            aduana_id:null,
            aduana_visible: false

            })
        }
  return (
    <>
    <Drawer
        anchor = {anchor}
        open={open}
        onClose={onClose}
        sx={{
                    '& .MuiDrawer-paper': {
                        padding: '16px',
                        width: '50%',
                        maxWidth: '95vw',
                        boxSizing: 'border-box',
                        ...('right') && {
                            top: '8%',
                            bottom: '5%',
                            transform: 'translateY(-50%)',
                            height: '60%',
                        },
                        ...('top') && {
                            left: '25%',
                            transform: 'translateX(-30%)',
                        },
                    },
                }}
                >
                <Box sx={{ p: 3 }}>

                    <FormularioComponent
                    inputs={inputs}
                    onInput={inputChange}
                    botonesDerecha
                    botones={{
                        agregar:{
                            visible:true,
                            texto:'Despachar',
                            color:'primary',
                            onClick:()=>submitDespacho()}

                    }}
                    />
                </Box>
    </Drawer>
    </>
  )
}
