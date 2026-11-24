import { Box, Drawer, Divider } from '@mui/material'
import React, { useCallback, useMemo, useState } from 'react'
import FormularioComponent from '../../../components/Formulario/FormularioComponent'
import usePreparaciones from './hooks/usePreparaciones'
export default function FormPreparacion({getPreparaciones, open = false, anchor = 'right', onClose, }) {

    const {saveToPreparacion} = usePreparaciones()

    const [valores, setValores] = useState({
        solicitud_id: 0
    })


    const inputs = useMemo(() => {
        const { solicitud_id } = valores
        return [
            {
                tipo: 'titulo',
                val: 'Preparar',
                id: 'titulo'
            },
            {
                name: 'solicitud_id',
                label: 'solicitud',
                id: 'solicitud_id',
                tipo: 'number',
                val: solicitud_id,
                max: 12
            }]
    })

    const inputChange = useCallback(({ id, val }) => {
        setValores((i) => ({ ...i, [id]: val }
        ))
    })

    const submitPreparacion = useCallback(async()=>{
            await saveToPreparacion(valores.solicitud_id)
            setValores((i)=>{
                return{
                    ...i,
                    solicitud_id:0

                }
            })
            await getPreparaciones()
            onClose()
    })

    return (
        <>
            <Drawer
                anchor={anchor}
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
                            height: '35%',
                        },
                        ...('top') && {
                            left: '25%',
                            transform: 'translateX(-30%)',
                        },
                    },
                }}
            >
               
                <Divider />
                <div sx></div>
                <Box sx={{ p: 3 }}>
                    <FormularioComponent
                        inputs={inputs}
                        onInput={inputChange}
                        botonesCentro
                        botones={{
                            enviar:{
                                visible:true,
                                texto:'Preparar',
                                onClick: ()=>submitPreparacion()
                            },
                            cancelar:{
                                visible:true,
                                texto:'Cancelar',
                                onClick:()=> onClose()
                            }
                            ,agregar:{visible:false}

                        }}
                    />


                </Box>
            </Drawer>

        </>
    )
}
