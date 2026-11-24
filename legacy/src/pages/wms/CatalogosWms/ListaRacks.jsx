import { Box } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import { api } from "../../../api"
import TablaRacks from "../../../views/wms/racks/TablaRacks"
import useRack from "../../../views/wms/racks/hooks/useRack"
const ListaRacks = () => {

    const {racks}=useRack()

    return (
        <Box
            sx={{ p: 1, m: 0, flex: 1 }}
        >
            <TablaRacks
                lista={racks}
            />

        </Box>
    )
}

export default ListaRacks