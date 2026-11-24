import { Box } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import TablaAlmacen from '../../../views/wms/almacen/TablaAlmacen'
import useAlmacen from "../../../views/wms/almacen/hooks/useAlmancen"
const ListaAlmacen = ()=>{

    const {almacenes} = useAlmacen()
    

    return(
            <Box sx={{ p: 1, m: 0, flex: 1 }}>
            <TablaAlmacen
            lista={almacenes}
            />
            </Box>
    )
}
export default ListaAlmacen