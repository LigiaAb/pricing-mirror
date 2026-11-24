import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import TablaCoordinaciones from "../../../components/bpm/tablas/tablaCoordinaciones";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import { useCoordinacionCargas } from "../../../hooks/Bpm";
import ImprimirEtiquetas from "./ImprimirEtiquetas";
import { api } from "../../../api";
import TablaEtiquetas from "./TablaEtiquetas";
import TabComponent from "@/components/Tabs/TabComponent";

const Etiquetas2 = () => {
  const [tab, setTab] = useState(0);
  const [coordinacionSeleccionada, setCoordinacionSeleccionada] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [datosEtiqueta, setDatosEtiqueta] = useState(null);
  const [mostrarNoCargas, setMostrarNoCargas] = useState(false);
  const [mensajeNoCargas, setMensajeNoCargas] = useState("");

  const { data: cargas = [], isLoading: cargasLoading } = useCoordinacionCargas(
    coordinacionSeleccionada?.embarqueId,
    { enabled: !!coordinacionSeleccionada?.embarqueId }
  );

  const handleView = (row) => {
    setCoordinacionSeleccionada(row);
    setDatosEtiqueta(row)
    setMostrarDetalles(true);
  };

  const handleVolver = () => {
    setMostrarDetalles(false);
    setCoordinacionSeleccionada(null);
  };

  const handleCloseNoCargas = () => {
    setMostrarNoCargas(false);
    setCoordinacionSeleccionada(null);
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", mt: 2, p: { xs: 1, md: 2 }, }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
            Etiquetas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Listado de coordinaciones.
        </Typography>
        <TabComponent
          opciones={[
            {
              id: 0,
              label: "Hoy",
              icono: "c-calendario-reloj",
              content: (
                <TablaEtiquetas onView={handleView} estadoFilter={["INGRESADO"]} historico={false}/>
              ),
            },
            {
              id: 1,
              label: "Historico",
              icono: "c-calendario-siguiente",
              content: (
                <TablaEtiquetas onView={handleView} estadoFilter={["INGRESADO"]} />
              ),
            },
          ]}
          tabInicial={tab}
          tabSeleccionado={(nuevoTab) => setTab(nuevoTab)}
          onCambiarTab={(nuevoTab) => setTab(nuevoTab)}
          // variante="scrollable"
          // bgcolor="transparent"
        />
        {/* <TablaEtiquetas onView={handleView} estadoFilter={["INGRESADO"]} /> */}
        {
            mostrarDetalles && <ImprimirEtiquetas coodinacion={coordinacionSeleccionada} etiquetas={datosEtiqueta}/>
        }
    </Box>
  );
};

export default Etiquetas2;
