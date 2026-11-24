import TablaComponent from "../../../components/Tabla/TablaComponent"
import useArticulos from "./useArticulos"
import FormularioArticulo from './FormularioArticulo'
import TablaArticulosColumnas from '../Articulos/TablaArticulosColumns'
import { useState } from "react"
const TablaArticulos = () => {
    const { articulos,getArticulos } = useArticulos()

    const [drawArticulo, setDrawArticulo] = useState({
        open:false,
        anchor: 'right'
    })

    const  openDrawerArticulo =()=>{
        setDrawArticulo({
            open:true,
            anchor: 'right'
        })
    }
    
    const cerrarDrawerArticulo =()=>{
        setDrawArticulo({
            open:false,
            anchor: 'right'
        })
        getArticulos()
    }


    return (
        <>
            <TablaComponent
                id="articulo_id"
                datos={articulos}
                encabezado={TablaArticulosColumnas}
                botones={
                    {
                        Agregar:{
                            label:'Nuevo articulo',
                            onClick: ()=>openDrawerArticulo()
                        }
                    }
                }
            />
            <FormularioArticulo
            open= {drawArticulo.open}
            anchor={drawArticulo.anchor}
            onClose={cerrarDrawerArticulo}
            />

        </>
    )
}

export default TablaArticulos