import { Box, Typography } from "@mui/material";
import { useState } from "react";
import TabComponent from "../../../../../components/Tabs/TabComponent";
import PoolTabla from "./PoolTabla";
import PoolCrear from "./PoolCrear";

const PoolMaster = () => {
    const [saved, setSaved] = useState(false);

    const opciones = [
        { id: "informacion", label: "Información", icono: "c-informacion", content: <PoolTabla /> },
        { id: "crear", label: "Crear", icono: "c-suma", content: <PoolCrear onSuccess={() => setSaved(true)} /> },
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Pool de Masters
            </Typography>

            <Box sx={{ mt: 2 }}>
                <TabComponent opciones={opciones} mostrarTitulo={false} titulo={"Pool de Masters"} />
                {saved && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                        Guardado con éxito.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default PoolMaster;
