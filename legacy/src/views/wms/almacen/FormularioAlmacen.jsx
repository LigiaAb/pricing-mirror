import FormularioComponent from '../../../components/Formulario/FormularioComponent'
import { Box } from '@mui/material'
import useAlmacen from './hooks/useAlmancen'
import { useCallback, useMemo, useState } from 'react'
const FormularioAlmacen = () => {

    const [valores, setValores] = useState({
        texto_almacen: '',
        texto_prefijo: '',
        select_pais: null
    })
    const {paises,create_almacen} =useAlmacen()
    const inputs = useMemo(() => {
        const { texto_almacen, texto_prefijo, select_pais } = valores

        return [
            {
                tipo: 'text',
                id: 'texto_almacen',
                label: 'Almacen',
                val: texto_almacen
            },
            {
                tipo: 'text',
                id: 'texto_prefijo',
                label: 'Prefijo',
                val: texto_prefijo
            },
            {
                tipo: 'select',       
                id: 'select_pais',
                label: 'Pais',
                val: select_pais, 
                options: paises.map(i=>{
                
                    return {
                    value: i.cod_pais,
                    label: i.nombre_pais
                }}),
        
                width: '60'
            }
        ]
    })

    const onInput = useCallback(async ({ id, val }) => {
        setValores((v) => ({ ...v, [id]: val }));

    }, []);

    const valideInputs= ()=>{
        valide = false
    }

    const sumbitFn =async()=>{
        await create_almacen(valores)
    }

    return (
        <Box sx={{ p: 1, m: 0 }}>

            <FormularioComponent
                inputs={inputs}
                onInput={onInput}
                botones={{agregar:{
                    visible: true,
                    label: 'Agregar almacen',
                    onClick: ()=> sumbitFn()
                }}}
            />
        </Box>
    )
}

export default FormularioAlmacen;