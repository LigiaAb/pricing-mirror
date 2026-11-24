import { useCallback, useMemo, useState } from "react"
import FormularioComponent from "../../../components/Formulario/FormularioComponent"
import { Drawer } from "@mui/material"
import useArticulos from "./useArticulos"
import {useFetchRelacionTipo} from '../../../hooks/Fetch/useFetchCatalog'

const FormularioArticulo = ({ open, anchor, onClose }) => {
    
    
    const unidadesMedidaPrivadas = useFetchRelacionTipo({ tipo_tabla: "COORDINACION_CARGA", tipo_padre_tabla: "TIPO_MEDIDA" });
    const uniMeds  = useMemo(()=>{

        return unidadesMedidaPrivadas.data
    }, [unidadesMedidaPrivadas])
    

    const {entidades, sumbitArticulo} = useArticulos()

    const [valores, setValores] = useState({
        select_entidad: null,
        select_unimed:null,
        text_sku:"",
        text_des:"",
        number_unidad:0,
        number_bultosxtar:0,
        number_embajeumed:0,
        number_pesob:0,
        number_peson:0,
        number_alto:0,
        number_ancho:0,
        number_largo:0,
        number_camas:0,
        select_manejaven:null,
        text_codqr_barra : ""
    })

    const inputs = useMemo(() => {

        const {
        select_entidad,
        select_unimed,
        text_sku,
        text_des,
        number_unidad,
        number_bultosxtar,
        number_embajeumed,
        number_pesob,
        number_peson,
        number_alto,
        number_ancho,
        number_largo,
        number_camas,
        select_manejaven,
        text_codqr_barra } = valores
        return [
            {
                tipo: 'select',
                label: 'Entidad',
                id: 'select_entidad',
                val: select_entidad,
                options: entidades.map((i)=>{
                     return{
                        value: i.entidad_id,
                        label:i.entidad_id+ " - "+ i.entidad_nombre
                    } 
                }),
                
            },
            {
                tipo: 'select',
                label: 'Unidad de medida',
                id: 'select_unimed',
                val: select_unimed,
                options: uniMeds? uniMeds.map(i=>{
                    return {
                        value:i.value,
                        label: i.tipo_padre_desc + " -"+ i.tipo_desc
                    }
                }):[],
                actions: [
                    { nombre: "accion 1", onClick: () => { }, icono: "c-suma" },
                ],
            },
            {
                tipo:'text',
                id: "text_sku",
                label:"SKU",
                val:text_sku
            },
            {
                tipo:'text',
                id: "text_des",
                label:"Descripción",
                val:text_des
            },
            {
                tipo:'number',
                id: "number_unidad",
                label:"Unidad",
                val:number_unidad,
                min:1
            },
            {
                tipo:'number',
                id: "number_bultosxtar",
                label:"Bultos por tarima",
                val:number_bultosxtar,
                min:1
            },
            {
                tipo:'number',
                id: "number_embajeumed",
                label:"Embalaje unidad de medida",
                val:number_embajeumed,
                min:1
            },
            {
                tipo:'number',
                id: "number_pesob",
                label:"Peso por bulto",
                val:number_pesob
            },
            {
                tipo:'number',
                id: "number_peson",
                label:"Peso neto",
                val:number_peson
            },
            {
                tipo:'number',
                id: "number_alto",
                label:"Alto",
                val:number_alto
            },
            {
                tipo:'number',
                id: "number_ancho",
                label:"Ancho",
                val:number_ancho
            },
            {
                tipo:'number',
                id: "number_largo",
                label:"Largo",
                val:number_largo
            },
            {
                tipo:'number',
                id: "number_camas",
                label:"Cantidad de camas",
                val: number_camas
            },
            {
                tipo: 'select',
                label: 'Maneja vencimiento',
                id: 'select_manejaven',
                val: select_manejaven,
                options: [{
                    value:0,
                    label:"No"
                },
                {
                    value:1,
                    label: "Si"
                }
            ],
                actions: [
                    { nombre: "accion 1", onClick: () => { }, icono: "c-suma" },
                ],
            },
            {
                tipo:'text',
                id:'text_codqr_barra',
                label:"Codigod de barra",
                val:text_codqr_barra
            }
        ]
    })
    const onInput = useCallback(async ({ id, val }) => {
        setValores((v) => {
            return ({ ...v, [id]: val })
        })
    }, [])

    const valideInput=()=>{
        
    }
    const fnAgregar=()=>{
        if (valideInput) {
            
            sumbitArticulo(valores)
            onClose()
        }
    }

    return (
        <>
            <Drawer
                anchor={anchor}
                open={open}
                onClose={onClose}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 800,
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
                    onInput={onInput}
                    botones={{
                        agregar: {
                            visible: true,
                            onClick: ()=>fnAgregar()
                        }
                    }
                    }
                />
            </Drawer>

        </>
    )
}
export default FormularioArticulo