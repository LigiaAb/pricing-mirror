import { useMemo, useState, useCallback } from "react";
import { Box, Typography, Paper } from "@mui/material";
import TabComponent from "../../../../components/Tabs/TabComponent";
import HouseTabla from "./HouseTabla";
import HouseCrear from "./HouseCrear";

const House = () => {

  // Contador para forzar re-render de HouseTabla después de crear
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const handleCorrelativoCreado = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, [setRefetchTrigger]);

  const opciones = useMemo(
    () => [
      {
        id: "informacion",
        label: "Información",
        icono: "c-lista",
        content: (
          <Paper sx={{ p: 2 }}>
            <HouseTabla 
              tipoFilter={["HAWB", "HBL", "HCP"]} 
              key={refetchTrigger}
            />
          </Paper>
        ),
      },
      {
        id: "crear",
        label: "Crear",
        icono: "c-suma",
        content: (
          <HouseCrear
            onCorrelativoCreado={handleCorrelativoCreado}
            createOnServer={true}
          />
        ),
      },
    ],
    [refetchTrigger, handleCorrelativoCreado]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Correlativos House
      </Typography>

      <TabComponent
        opciones={opciones}
        tabInicial="informacion"
        direccion="horizontal"
        variante="fullWidth"
        noOcultarTabs={true}
      />

    </Box>
  );
};

export default House;
